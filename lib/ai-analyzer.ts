import { logAIAnalysis } from '@/lib/subscription';

export interface MarketContext {
  zhviMidAll: number | null;
  zhviMidSfr: number | null;
  zoriRentIndex: number | null;
  inventoryForSale: number | null;
  newListings: number | null;
  newPending: number | null;
  salesCount: number | null;
  marketTempIndex: number | null;
  pctSoldAboveList: number | null;
  pctListingsPriceCut: number | null;
  medianDaysToClose: number | null;
  zhvfGrowth1m: number | null;
  zhvfGrowth3m: number | null;
  zhvfGrowth12m: number | null;
  regionName?: string | null;
  stateName?: string | null;
}

export interface AIAnalysisInput extends Record<string, unknown> {
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  photos?: string[];
  notes?: string;
  propertyType?: 'single_family' | 'condo' | 'townhouse' | 'multi_family';
  yearBuilt?: number;
  lotSize?: number;
  marketContext?: MarketContext;
}

export interface AIAnalysisOutput extends Record<string, unknown> {
  arv: {
    low: number;
    high: number;
    median: number;
    confidence: number;
  };
  repairs: {
    cosmetic: { low: number; high: number };
    structural: { low: number; high: number };
    systems: { low: number; high: number };
    total: { low: number; high: number };
  };
  mao: {
    low: number;
    high: number;
    recommended: number;
  };
  comps: Array<{
    address: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
    distance: number;
    sold_date: string;
  }>;
  analysis_notes: string[];
  confidence_score: number;
}

const AI_ANALYZER_ENABLED = process.env.AI_ANALYZER_ENABLED === 'true';

export async function analyzeProperty(
  userId: string,
  listingId: string,
  input: AIAnalysisInput
): Promise<AIAnalysisOutput> {
  if (!AI_ANALYZER_ENABLED) {
    return generateMockAnalysis(input);
  }

  try {
    // Call AI service (OpenAI, Anthropic, or local)
    const analysis = await callAIService(input);
    
    // Log the analysis
    await logAIAnalysis(
      userId,
      listingId,
      'arv',
      input,
      analysis,
      calculateAICost(analysis)
    );

    return analysis;
  } catch {
    console.error('AI analysis failed');
    // Fallback to mock analysis
    return generateMockAnalysis(input);
  }
}

async function callAIService(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
  const prompt = createAnalysisPrompt(input);
  
  if (process.env.OPENAI_API_KEY) {
    return await callOpenAI(prompt);
  } else if (process.env.ANTHROPIC_API_KEY) {
    return await callAnthropic(prompt);
  } else if (process.env.LOCAL_AI_ENDPOINT) {
    return await callLocalAI(prompt);
  } else {
    throw new Error('No AI service configured');
  }
}

function createAnalysisPrompt(input: AIAnalysisInput): string {
  const marketSection = input.marketContext ? `
Market Context (${input.marketContext.regionName || 'Metro'}, ${input.marketContext.stateName || 'State'}):
- ZHVI Mid-Tier All Homes: ${input.marketContext.zhviMidAll ? `$${input.marketContext.zhviMidAll.toLocaleString()}` : 'N/A'}
- ZHVI Mid-Tier Single Family: ${input.marketContext.zhviMidSfr ? `$${input.marketContext.zhviMidSfr.toLocaleString()}` : 'N/A'}
- Rent Index (ZORI): ${input.marketContext.zoriRentIndex ? input.marketContext.zoriRentIndex.toLocaleString() : 'N/A'}
- Inventory for Sale: ${input.marketContext.inventoryForSale ? input.marketContext.inventoryForSale.toLocaleString() : 'N/A'}
- New Listings: ${input.marketContext.newListings ? input.marketContext.newListings.toLocaleString() : 'N/A'}
- New Pending Sales: ${input.marketContext.newPending ? input.marketContext.newPending.toLocaleString() : 'N/A'}
- Sales Count: ${input.marketContext.salesCount ? input.marketContext.salesCount.toLocaleString() : 'N/A'}
- Market Temperature Index: ${input.marketContext.marketTempIndex !== null ? input.marketContext.marketTempIndex.toFixed(2) : 'N/A'} ${input.marketContext.marketTempIndex !== null ? (input.marketContext.marketTempIndex > 50 ? '(Hot Market)' : input.marketContext.marketTempIndex < 30 ? '(Cool Market)' : '(Moderate Market)') : ''}
- % Sold Above List Price: ${input.marketContext.pctSoldAboveList !== null ? `${input.marketContext.pctSoldAboveList.toFixed(1)}%` : 'N/A'}
- % Listings with Price Cuts: ${input.marketContext.pctListingsPriceCut !== null ? `${input.marketContext.pctListingsPriceCut.toFixed(1)}%` : 'N/A'}
- Median Days to Close: ${input.marketContext.medianDaysToClose !== null ? `${input.marketContext.medianDaysToClose} days` : 'N/A'}
- ZHVI Growth (1 month): ${input.marketContext.zhvfGrowth1m !== null ? `${input.marketContext.zhvfGrowth1m > 0 ? '+' : ''}${input.marketContext.zhvfGrowth1m.toFixed(2)}%` : 'N/A'}
- ZHVI Growth (3 months): ${input.marketContext.zhvfGrowth3m !== null ? `${input.marketContext.zhvfGrowth3m > 0 ? '+' : ''}${input.marketContext.zhvfGrowth3m.toFixed(2)}%` : 'N/A'}
- ZHVI Growth (12 months): ${input.marketContext.zhvfGrowth12m !== null ? `${input.marketContext.zhvfGrowth12m > 0 ? '+' : ''}${input.marketContext.zhvfGrowth12m.toFixed(2)}%` : 'N/A'}

` : '';

  return `
Analyze this real estate property and provide a comprehensive market analysis:

Property Details:
- Address: ${input.address}
- Beds: ${input.beds}
- Baths: ${input.baths}
- Square Feet: ${input.sqft}
- Property Type: ${input.propertyType || 'single_family'}
- Year Built: ${input.yearBuilt || 'Unknown'}
- Lot Size: ${input.lotSize || 'Unknown'}
- Notes: ${input.notes || 'None'}
${marketSection}
Please provide:
1. ARV (After Repair Value) range with low, high, and median estimates
2. Repair cost estimates broken down by category (cosmetic, structural, systems)
3. MAO (Maximum Allowable Offer) calculation
4. Comparable sales data (3-5 recent sales)
5. Analysis notes and confidence score
${input.marketContext ? `
IMPORTANT: Use the Market Context data above to inform your analysis. Consider:
- Market temperature (hot/cool) when assessing demand and pricing
- Inventory levels (tight inventory suggests higher prices, loose inventory suggests buyer's market)
- Growth trends (positive ZHVI growth indicates appreciating market)
- Days to close and % sold above list (competitive market indicators)
- Mention market conditions in your analysis notes (e.g., "This metro shows strong growth" or "Inventory is tight")
` : ''}

Return the response as a JSON object with the following structure:
{
  "arv": {
    "low": number,
    "high": number,
    "median": number,
    "confidence": number
  },
  "repairs": {
    "cosmetic": {"low": number, "high": number},
    "structural": {"low": number, "high": number},
    "systems": {"low": number, "high": number},
    "total": {"low": number, "high": number}
  },
  "mao": {
    "low": number,
    "high": number,
    "recommended": number
  },
  "comps": [
    {
      "address": string,
      "price": number,
      "beds": number,
      "baths": number,
      "sqft": number,
      "distance": number,
      "sold_date": string
    }
  ],
  "analysis_notes": [string],
  "confidence_score": number
}
`;
}

async function callOpenAI(prompt: string): Promise<AIAnalysisOutput> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a real estate investment analyst. Provide accurate, data-driven analysis for wholesale real estate deals.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Failed to parse AI response');
  }
}

async function callAnthropic(prompt: string): Promise<AIAnalysisOutput> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  
  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Failed to parse AI response');
  }
}

async function callLocalAI(prompt: string): Promise<AIAnalysisOutput> {
  const response = await fetch(`${process.env.LOCAL_AI_ENDPOINT}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`Local AI error: ${response.statusText}`);
  }

  return await response.json();
}

function generateMockAnalysis(input: AIAnalysisInput): AIAnalysisOutput {
  // Generate realistic mock data based on input
  const basePrice = input.sqft * 150; // $150/sqft base
  const bedBathMultiplier = (input.beds + input.baths) * 5000;
  const arvBase = basePrice + bedBathMultiplier;
  
  const arv = {
    low: Math.round(arvBase * 0.85),
    high: Math.round(arvBase * 1.15),
    median: Math.round(arvBase),
    confidence: 0.75,
  };

  const repairTotal = Math.round(arvBase * 0.15); // 15% of ARV
  const repairs = {
    cosmetic: { low: Math.round(repairTotal * 0.3), high: Math.round(repairTotal * 0.5) },
    structural: { low: Math.round(repairTotal * 0.2), high: Math.round(repairTotal * 0.4) },
    systems: { low: Math.round(repairTotal * 0.1), high: Math.round(repairTotal * 0.3) },
    total: { low: Math.round(repairTotal * 0.6), high: Math.round(repairTotal * 1.2) },
  };

  const mao = {
    low: Math.round(arv.low - repairs.total.high - 20000), // 20k profit margin
    high: Math.round(arv.high - repairs.total.low - 10000), // 10k profit margin
    recommended: Math.round(arv.median - (repairs.total.low + repairs.total.high) / 2 - 15000), // 15k profit margin
  };

  const comps = generateMockComps(input);

  return {
    arv,
    repairs,
    mao,
    comps,
    analysis_notes: [
      `Property appears to be in ${input.sqft > 2000 ? 'good' : 'fair'} condition`,
      `Market conditions favor ${arv.median > 300000 ? 'buyers' : 'sellers'}`,
      `Recommended for ${mao.recommended > 200000 ? 'wholesale' : 'retail'} investors`,
    ],
    confidence_score: 0.8,
  };
}

function generateMockComps(input: AIAnalysisInput) {
  const basePrice = input.sqft * 150;
  const comps = [];
  
  for (let i = 0; i < 3; i++) {
    const variation = 0.8 + (Math.random() * 0.4); // 80-120% of base price
    const distance = 0.1 + (Math.random() * 0.9); // 0.1-1.0 miles
    
    comps.push({
      address: `${100 + i * 50} ${['Main', 'Oak', 'Pine'][i]} St`,
      price: Math.round(basePrice * variation),
      beds: input.beds + (Math.random() > 0.5 ? 1 : -1),
      baths: input.baths + (Math.random() > 0.5 ? 0.5 : -0.5),
      sqft: input.sqft + Math.round((Math.random() - 0.5) * 500),
      distance: Math.round(distance * 10) / 10,
      sold_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  }
  
  return comps;
}

function calculateAICost(analysis: AIAnalysisOutput): number {
  // Estimate cost based on analysis complexity
  const baseCost = 5; // 5 cents base
  const complexityMultiplier = analysis.comps.length * 0.5;
  return Math.round((baseCost + complexityMultiplier) * 100);
}

