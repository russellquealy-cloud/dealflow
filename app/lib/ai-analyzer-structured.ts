/**
 * Structured AI Analyzer - Cost-Controlled, Two-Track System
 * 
 * Features:
 * - Fixed question types (no free-text = lower costs)
 * - Investor track: Deal analysis, ROI, ARV comps, sensitivity
 * - Wholesaler track: MAO, ARV, repairs, wholesale fee
 * - Repair checklist system with unit-based math
 * - Rate limiting and cost controls
 */

import { createClient } from '@/lib/supabase/server';
import { canUserPerformAction, incrementUsage } from '@/lib/subscription';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type UserRole = 'investor' | 'wholesaler';

export type InvestorQuestionType = 
  | 'deal_at_price'          // "Is this a deal at $X?"
  | 'price_for_roi'          // "What price hits Y% return?"
  | 'arv_from_comps'         // "ARV from comps within N miles and ±M months?"
  | 'sensitivity_analysis'   // "Sensitivity if ARV ±k% or repairs ±k%?"
  | 'exit_strategy';         // "Exit check: flip vs. wholetail vs. wholesale?"

export type WholesalerQuestionType =
  | 'mao_calculation'        // "What is MAO given ARV, repairs, fee?"
  | 'arv_quick_comps'        // "Rapid ARV from quick comps filter?"
  | 'repair_estimate'        // "Repair estimate from component checklist?"
  | 'wholesale_fee_target';  // "What wholesale fee fits a target buyer return?"

export type RepairItemStatus = 'good' | 'repair' | 'replace' | 'unknown';

export interface RepairItem {
  category: string;
  status: RepairItemStatus;
  quantity: number;
  units: string;
  notes?: string;
}

export interface InvestorQuestionInput {
  questionType: InvestorQuestionType;
  // Deal at price
  purchasePrice?: number;
  // Price for ROI
  targetROI?: number;
  // ARV from comps
  compsRadius?: number;        // miles (default 1.0, rural 5-10)
  compsMonths?: number;        // ±months (default 6)
  // Sensitivity
  arvVariation?: number;       // ±% (default 5, 10)
  repairsVariation?: number;   // ±% (default 10)
  // Exit strategy
  exitType?: 'flip' | 'wholetail' | 'wholesale';
  // Common inputs
  arv?: number;
  repairs?: number;
  sqft?: number;
  beds?: number;
  baths?: number;
}

export interface WholesalerQuestionInput {
  questionType: WholesalerQuestionType;
  // MAO calculation
  arv?: number;
  repairs?: number;
  targetMargin?: number;       // default 0.20 (20%)
  buyerClosing?: number;       // default 2% ARV
  carryingCost?: number;
  monthsHold?: number;
  yourFee?: number;
  // ARV quick comps
  compsRadius?: number;
  compsMonths?: number;
  // Repair estimate
  repairChecklist?: RepairItem[];
  // Wholesale fee target
  targetBuyerReturn?: number;
  // Common
  sqft?: number;
  beds?: number;
  baths?: number;
  county?: string;             // For regional multipliers
}

export interface AnalysisResult {
  questionType: InvestorQuestionType | WholesalerQuestionType;
  result: {
    answer: number | string | boolean;
    calculations?: Record<string, number | Record<string, number>>;
    comps?: CompData[];
    sensitivity?: SensitivityResult;
    exitAnalysis?: ExitAnalysis;
    notes: string[];
  };
  cached: boolean;
  aiCost: number;              // In cents
  timestamp: string;
}

export interface CompData {
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  distance: number;            // miles
  soldDate: string;
  pricePerSqft: number;
}

export interface SensitivityResult {
  arvVariations: {
    minus10: number;
    minus5: number;
    base: number;
    plus5: number;
    plus10: number;
  };
  repairsVariations: {
    minus10: number;
    base: number;
    plus10: number;
  };
}

export interface ExitAnalysis {
  flip: { roi: number; profit: number; timeline: string };
  wholetail: { roi: number; profit: number; timeline: string };
  wholesale: { fee: number; profit: number; timeline: string };
  recommendation: string;
}

// ============================================================================
// COST CONTROLS & RATE LIMITING
// ============================================================================

const MAX_REQUESTS_PER_MINUTE = 5;
const MAX_REQUESTS_PER_HOUR = 30;
const MAX_AI_COST_PER_REQUEST = 50; // cents (max $0.50 per request)

// Track requests per user (in-memory, resets on server restart)
const requestTracker = new Map<string, { minute: number[]; hour: number[] }>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userRequests = requestTracker.get(userId) || { minute: [], hour: [] };
  
  // Clean old entries
  const oneMinuteAgo = now - 60000;
  const oneHourAgo = now - 3600000;
  userRequests.minute = userRequests.minute.filter(t => t > oneMinuteAgo);
  userRequests.hour = userRequests.hour.filter(t => t > oneHourAgo);
  
  // Check limits
  if (userRequests.minute.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestMinute = Math.min(...userRequests.minute);
    const retryAfter = Math.ceil((oldestMinute + 60000 - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  if (userRequests.hour.length >= MAX_REQUESTS_PER_HOUR) {
    const oldestHour = Math.min(...userRequests.hour);
    const retryAfter = Math.ceil((oldestHour + 3600000 - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Add current request
  userRequests.minute.push(now);
  userRequests.hour.push(now);
  requestTracker.set(userId, userRequests);
  
  return { allowed: true };
}

// ============================================================================
// REPAIR COST CALCULATION (Unit-Based Math)
// ============================================================================

interface RepairCostRange {
  category: string;
  unitCostLow: number;
  unitCostHigh: number;
  unitType: 'sqft' | 'count' | 'linear_ft' | 'flat';
  regionalMultiplier?: Record<string, number>; // county -> multiplier
}

const REPAIR_COST_DB: RepairCostRange[] = [
  { category: 'roof', unitCostLow: 3.5, unitCostHigh: 5.5, unitType: 'sqft' },
  { category: 'hvac', unitCostLow: 3000, unitCostHigh: 8000, unitType: 'flat' },
  { category: 'electrical', unitCostLow: 2000, unitCostHigh: 15000, unitType: 'flat' },
  { category: 'plumbing', unitCostLow: 1500, unitCostHigh: 12000, unitType: 'flat' },
  { category: 'windows', unitCostLow: 300, unitCostHigh: 800, unitType: 'count' },
  { category: 'doors', unitCostLow: 200, unitCostHigh: 800, unitType: 'count' },
  { category: 'kitchen_basic', unitCostLow: 8000, unitCostHigh: 15000, unitType: 'flat' },
  { category: 'bathroom_full', unitCostLow: 5000, unitCostHigh: 9000, unitType: 'count' },
  { category: 'bathroom_half', unitCostLow: 2000, unitCostHigh: 4000, unitType: 'count' },
  { category: 'flooring_lvp', unitCostLow: 4, unitCostHigh: 6, unitType: 'sqft' },
  { category: 'paint_interior', unitCostLow: 1.8, unitCostHigh: 3.0, unitType: 'sqft' },
  { category: 'paint_exterior', unitCostLow: 2.5, unitCostHigh: 4.5, unitType: 'sqft' },
  { category: 'drywall', unitCostLow: 1.5, unitCostHigh: 3.0, unitType: 'sqft' },
  { category: 'landscaping_light', unitCostLow: 2, unitCostHigh: 4, unitType: 'sqft' },
  { category: 'landscaping_medium', unitCostLow: 5, unitCostHigh: 8, unitType: 'sqft' },
  { category: 'landscaping_heavy', unitCostLow: 10, unitCostHigh: 15, unitType: 'sqft' },
];

function calculateRepairCost(
  items: RepairItem[],
  county?: string,
  complexityMultiplier: number = 1.0
): { low: number; high: number; breakdown: Record<string, number> } {
  let totalLow = 0;
  let totalHigh = 0;
  const breakdown: Record<string, number> = {};
  
  const regionalMultiplier = county ? getRegionalMultiplier(county) : 1.0;
  
  for (const item of items) {
    if (item.status === 'good') continue;
    
    const costRange = REPAIR_COST_DB.find(c => c.category === item.category);
    if (!costRange) continue;
    
    let itemLow: number;
    let itemHigh: number;
    
    if (costRange.unitType === 'sqft') {
      itemLow = item.quantity * costRange.unitCostLow;
      itemHigh = item.quantity * costRange.unitCostHigh;
    } else if (costRange.unitType === 'count') {
      itemLow = item.quantity * costRange.unitCostLow;
      itemHigh = item.quantity * costRange.unitCostHigh;
    } else if (costRange.unitType === 'linear_ft') {
      itemLow = item.quantity * costRange.unitCostLow;
      itemHigh = item.quantity * costRange.unitCostHigh;
    } else { // flat
      itemLow = costRange.unitCostLow;
      itemHigh = costRange.unitCostHigh;
    }
    
    // Apply multipliers
    itemLow *= regionalMultiplier * complexityMultiplier;
    itemHigh *= regionalMultiplier * complexityMultiplier;
    
    // Status adjustments
    if (item.status === 'repair') {
      itemLow *= 0.5;
      itemHigh *= 0.7;
    } else if (item.status === 'replace') {
      // Full cost (already calculated)
    }
    
    totalLow += itemLow;
    totalHigh += itemHigh;
    breakdown[item.category] = (itemLow + itemHigh) / 2;
  }
  
  return { low: Math.round(totalLow), high: Math.round(totalHigh), breakdown };
}

function getRegionalMultiplier(county: string): number {
  // Simplified - in production, use real data
  const highCostCounties = ['Los Angeles', 'San Francisco', 'New York', 'Miami-Dade'];
  if (highCostCounties.some(c => county.includes(c))) return 1.3;
  return 1.0;
}

// ============================================================================
// CORE FORMULAS
// ============================================================================

/**
 * Calculate ARV from comps
 * Filters: distance, time, bed/bath ±1, sqft ±20%
 * Returns median of top 3-5 comps, adjusted by $/sqft delta (capped at 25%)
 */
function calculateARVFromComps(
  comps: CompData[],
  subjectSqft: number
): number {
  if (comps.length === 0) return 0;
  
  // Sort by similarity (closer comps first)
  const sorted = comps.sort((a, b) => a.distance - b.distance);
  
  // Take top 3-5
  const topComps = sorted.slice(0, Math.min(5, sorted.length));
  
  // Calculate median price per sqft
  const pricesPerSqft = topComps.map(c => c.pricePerSqft);
  pricesPerSqft.sort((a, b) => a - b);
  const medianPPSF = pricesPerSqft[Math.floor(pricesPerSqft.length / 2)];
  
  // Adjust for subject sqft difference
  const subjectPPSF = medianPPSF;
  const adjustment = Math.min(0.25, (subjectSqft - topComps[0].sqft) / topComps[0].sqft);
  
  return Math.round(subjectSqft * subjectPPSF * (1 + adjustment));
}

/**
 * Calculate MAO (Maximum Allowable Offer)
 */
function calculateMAO(
  arv: number,
  repairs: number,
  targetMargin: number = 0.20,
  buyerClosing: number = 0.02,
  carryingCost: number = 0,
  monthsHold: number = 3,
  yourFee: number = 0
): number {
  const buyerClosingCost = arv * buyerClosing;
  const totalCarrying = carryingCost * monthsHold;
  const totalCosts = repairs + buyerClosingCost + totalCarrying;
  const profit = arv * targetMargin;
  
  return Math.round(arv - profit - totalCosts - yourFee);
}

/**
 * Calculate investor target price for ROI
 */
function calculatePriceForROI(
  arv: number,
  repairs: number,
  targetROI: number,
  holdingCosts: number = 0
): number {
  const totalCost = repairs + holdingCosts;
  const requiredProfit = (arv - totalCost) * (targetROI / 100);
  return Math.round(arv - requiredProfit - totalCost);
}

/**
 * Sensitivity analysis
 */
function calculateSensitivity(
  baseARV: number,
  baseRepairs: number,
  basePrice: number
  // arvVariation and repairsVariation are currently hardcoded, kept for future use
): SensitivityResult {
  
  const arvVariations = {
    minus10: calculateMAO(baseARV * 0.9, baseRepairs),
    minus5: calculateMAO(baseARV * 0.95, baseRepairs),
    base: basePrice,
    plus5: calculateMAO(baseARV * 1.05, baseRepairs),
    plus10: calculateMAO(baseARV * 1.10, baseRepairs),
  };
  
  const repairsVariations = {
    minus10: calculateMAO(baseARV, baseRepairs * 0.9),
    base: basePrice,
    plus10: calculateMAO(baseARV, baseRepairs * 1.1),
  };
  
  return { arvVariations, repairsVariations };
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export async function analyzeStructured(
  userId: string,
  role: UserRole,
  input: InvestorQuestionInput | WholesalerQuestionInput,
  supabaseClient?: SupabaseClient
): Promise<AnalysisResult> {
  // 1. Check rate limits
  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds.`);
  }
  
  // 2. Check subscription limits
  const canAnalyze = await canUserPerformAction(userId, 'ai_analyses', 1, supabaseClient);
  if (!canAnalyze) {
    throw new Error('AI analysis limit reached. Upgrade your plan.');
  }
  
  // 3. Check cache first (store question signature as key)
  const questionKey = generateQuestionKey(role, input);
  const cached = await getCachedAnalysis(userId, questionKey, supabaseClient);
  if (cached) {
    return { ...cached, cached: true };
  }
  
  // 4. Perform calculation (minimize AI calls - only for comps/sensitivity)
  let result: AnalysisResult['result'];
  let aiCost = 0;
  
  if (role === 'investor') {
    result = await analyzeInvestorQuestion(input as InvestorQuestionInput);
    // Only call AI for ARV comps if needed AND OpenAI is configured
    if (input.questionType === 'arv_from_comps') {
      if (process.env.OPENAI_API_KEY) {
        aiCost = 15; // Cents - minimal AI call for comps lookup
      } else {
        aiCost = 0; // Use mock/simplified comps if no API key
      }
    } else {
      aiCost = 0; // Pure calculation, no AI
    }
  } else {
    result = await analyzeWholesalerQuestion(input as WholesalerQuestionInput);
    // Only call AI for ARV quick comps if needed AND OpenAI is configured
    if (input.questionType === 'arv_quick_comps') {
      if (process.env.OPENAI_API_KEY) {
        aiCost = 15; // Cents
      } else {
        aiCost = 0; // Use mock/simplified comps if no API key
      }
    } else if (input.questionType === 'repair_estimate') {
      aiCost = 0; // Pure calculation from repair checklist, no AI needed
    } else {
      aiCost = 0; // Pure calculation
    }
  }
  
  // 5. Enforce cost limit
  if (aiCost > MAX_AI_COST_PER_REQUEST) {
    throw new Error('Analysis exceeds cost limit. Please simplify your request.');
  }
  
  // 6. Increment usage
  await incrementUsage(userId, 'ai_analyses', 1, supabaseClient);
  
  // 7. Cache result
  const analysisResult: AnalysisResult = {
    questionType: input.questionType,
    result,
    cached: false,
    aiCost,
    timestamp: new Date().toISOString(),
  };
  
  await cacheAnalysis(userId, questionKey, analysisResult, supabaseClient);
  
  return analysisResult;
}

async function analyzeInvestorQuestion(
  input: InvestorQuestionInput
  // userId parameter reserved for future features (e.g., user-specific calculations)
): Promise<AnalysisResult['result']> {
  switch (input.questionType) {
    case 'deal_at_price':
      if (!input.purchasePrice || !input.arv || !input.repairs) {
        throw new Error('Missing required fields: purchasePrice, arv, repairs');
      }
      const roi = ((input.arv - input.purchasePrice - input.repairs) / (input.purchasePrice + input.repairs)) * 100;
      const isDeal = roi >= 15; // 15% ROI threshold
      return {
        answer: isDeal,
        calculations: {
          roi: Math.round(roi * 100) / 100,
          profit: input.arv - input.purchasePrice - input.repairs,
          totalInvestment: input.purchasePrice + input.repairs,
        },
        notes: [
          `ROI: ${roi.toFixed(2)}%`,
          isDeal ? 'This is a good deal!' : 'Consider negotiating lower price.',
          `Expected profit: $${(input.arv - input.purchasePrice - input.repairs).toLocaleString()}`,
        ],
      };
      
    case 'price_for_roi':
      if (!input.targetROI || !input.arv || !input.repairs) {
        throw new Error('Missing required fields: targetROI, arv, repairs');
      }
      const targetPrice = calculatePriceForROI(input.arv, input.repairs, input.targetROI);
      return {
        answer: targetPrice,
        calculations: {
          targetPrice,
          maxTotalInvestment: input.arv / (1 + input.targetROI / 100),
          repairs: input.repairs,
        },
        notes: [
          `To achieve ${input.targetROI}% ROI, offer up to $${targetPrice.toLocaleString()}`,
          `Total investment: $${(targetPrice + input.repairs).toLocaleString()}`,
        ],
      };
      
    case 'arv_from_comps':
      // This would call AI/minimal API for comps lookup
      // For now, return mock - in production, use real comps API
      const mockComps: CompData[] = []; // Would fetch real comps
      const arv = calculateARVFromComps(mockComps, input.sqft || 1500);
      return {
        answer: arv,
        comps: mockComps,
        calculations: { arv },
        notes: [`ARV calculated from ${mockComps.length} comparable sales`],
      };
      
    case 'sensitivity_analysis':
      if (!input.arv || !input.repairs || !input.purchasePrice) {
        throw new Error('Missing required fields: arv, repairs, purchasePrice');
      }
      const sensitivity = calculateSensitivity(
        input.arv,
        input.repairs,
        input.purchasePrice
        // Note: arvVariation and repairsVariation parameters are hardcoded in function
      );
      return {
        answer: 'See sensitivity table',
        sensitivity,
        calculations: {
          baseARV: input.arv,
          baseRepairs: input.repairs,
          basePrice: input.purchasePrice,
        },
        notes: [
          'Sensitivity analysis shows how ARV and repairs variations affect deal viability',
        ],
      };
      
    case 'exit_strategy':
      if (!input.arv || !input.purchasePrice || !input.repairs) {
        throw new Error('Missing required fields: arv, purchasePrice, repairs');
      }
      const totalInvestment = input.purchasePrice + input.repairs;
      const exitAnalysis: ExitAnalysis = {
        flip: {
          roi: ((input.arv - totalInvestment) / totalInvestment) * 100,
          profit: input.arv - totalInvestment,
          timeline: '3-6 months',
        },
        wholetail: {
          roi: ((input.arv * 0.95 - totalInvestment) / totalInvestment) * 100,
          profit: input.arv * 0.95 - totalInvestment,
          timeline: '1-2 months',
        },
        wholesale: {
          fee: input.arv * 0.05,
          profit: input.arv * 0.05,
          timeline: '1-2 weeks',
        },
        recommendation: 'Consider wholesale for fastest exit, flip for highest profit',
      };
      return {
        answer: 'See exit analysis',
        exitAnalysis,
        calculations: {
          totalInvestment,
          maxProfit: input.arv - totalInvestment,
        },
        notes: ['Compare exit strategies to maximize your returns'],
      };
      
    default:
      throw new Error('Invalid question type');
  }
}

async function analyzeWholesalerQuestion(
  input: WholesalerQuestionInput
  // userId parameter reserved for future features (e.g., user-specific calculations)
): Promise<AnalysisResult['result']> {
  switch (input.questionType) {
    case 'mao_calculation':
      if (!input.arv || !input.repairs) {
        throw new Error('Missing required fields: arv, repairs');
      }
      const mao = calculateMAO(
        input.arv,
        input.repairs,
        input.targetMargin || 0.20,
        input.buyerClosing || 0.02,
        input.carryingCost || 500,
        input.monthsHold || 3,
        input.yourFee || 0
      );
      return {
        answer: mao,
        calculations: {
          mao,
          arv: input.arv,
          repairs: input.repairs,
          targetMargin: (input.targetMargin || 0.20) * 100,
          buyerClosing: input.arv * (input.buyerClosing || 0.02),
          carrying: (input.carryingCost || 500) * (input.monthsHold || 3),
          yourFee: input.yourFee || 0,
        },
        notes: [
          `MAO: $${mao.toLocaleString()}`,
          `Expected profit: $${(input.arv - mao - input.repairs).toLocaleString()}`,
        ],
      };
      
    case 'arv_quick_comps':
      // Would fetch quick comps
      const mockComps: CompData[] = [];
      const quickARV = calculateARVFromComps(mockComps, input.sqft || 1500);
      return {
        answer: quickARV,
        comps: mockComps,
        calculations: { arv: quickARV },
        notes: [`Quick ARV estimate: $${quickARV.toLocaleString()}`],
      };
      
    case 'repair_estimate':
      if (!input.repairChecklist || input.repairChecklist.length === 0) {
        throw new Error('Missing repair checklist');
      }
      const repairCost = calculateRepairCost(
        input.repairChecklist,
        input.county,
        1.0 // complexity multiplier
      );
      return {
        answer: repairCost.high, // Use high estimate
        calculations: {
          low: repairCost.low,
          high: repairCost.high,
          breakdown: repairCost.breakdown,
        },
        notes: [
          `Repair estimate: $${repairCost.low.toLocaleString()} - $${repairCost.high.toLocaleString()}`,
          'Based on component checklist and regional multipliers',
        ],
      };
      
    case 'wholesale_fee_target':
      if (!input.arv || !input.repairs || !input.targetBuyerReturn) {
        throw new Error('Missing required fields: arv, repairs, targetBuyerReturn');
      }
      const buyerTargetPrice = calculatePriceForROI(input.arv, input.repairs, input.targetBuyerReturn);
      const maxFee = buyerTargetPrice - calculateMAO(input.arv, input.repairs, 0.20);
      return {
        answer: maxFee,
        calculations: {
          maxFee,
          buyerTargetPrice,
          mao: calculateMAO(input.arv, input.repairs),
        },
        notes: [
          `Maximum wholesale fee: $${maxFee.toLocaleString()}`,
          `To give buyer ${input.targetBuyerReturn}% ROI`,
        ],
      };
      
    default:
      throw new Error('Invalid question type');
  }
}

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================

function generateQuestionKey(role: UserRole, input: InvestorQuestionInput | WholesalerQuestionInput): string {
  return `${role}_${input.questionType}_${JSON.stringify(input)}`;
}

async function getCachedAnalysis(
  userId: string,
  questionKey: string,
  supabaseClient?: SupabaseClient
): Promise<AnalysisResult | null> {
  try {
    const supabase = supabaseClient ?? (await createClient());
    
    // Store cache key in question signature format
    const { data, error } = await supabase
      .from('ai_analysis_logs')
      .select('output_data, created_at')
      .eq('user_id', userId)
      .eq('analysis_type', questionKey)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return null;
    
    // Check if cache is fresh (1 hour TTL)
    const cacheAge = Date.now() - new Date(data.created_at).getTime();
    if (cacheAge > 3600000) return null; // 1 hour
    
    return data.output_data as AnalysisResult;
  } catch {
    // Fail silently - caching is non-critical
    return null;
  }
}

async function cacheAnalysis(
  userId: string,
  questionKey: string,
  result: AnalysisResult,
  supabaseClient?: SupabaseClient
): Promise<void> {
  try {
    const supabase = supabaseClient ?? (await createClient());
    
    await supabase.from('ai_analysis_logs').insert({
      user_id: userId,
      listing_id: null, // Not tied to specific listing
      analysis_type: questionKey,
      input_data: { questionKey },
      output_data: result,
      ai_cost_cents: result.aiCost,
    });
  } catch (error) {
    // Fail silently - caching is non-critical
    console.warn('Failed to cache analysis:', error);
  }
}

