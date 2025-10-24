/**
 * Unit tests for AI Analyzer functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { analyzeProperty, generateMockAnalysis } from '../../app/lib/ai-analyzer';
import { cleanupTestData, createTestUser, createTestListing, MOCK_AI_ANALYSIS } from '../setup';

describe('AI Analyzer', () => {
  let testUserId: string;
  let testListingId: string;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test user
    const { data: authData } = await createTestUser();
    testUserId = authData.user?.id || 'test-user-id';
    
    // Create test listing
    const listing = await createTestListing(testUserId);
    testListingId = listing.id;
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('analyzeProperty', () => {
    it('should return analysis with correct structure', async () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const,
        yearBuilt: 2000,
        lotSize: 0.25
      };

      const analysis = await analyzeProperty(testUserId, testListingId, input);

      expect(analysis).toHaveProperty('arv');
      expect(analysis).toHaveProperty('repairs');
      expect(analysis).toHaveProperty('mao');
      expect(analysis).toHaveProperty('comps');
      expect(analysis).toHaveProperty('analysis_notes');
      expect(analysis).toHaveProperty('confidence_score');
    });

    it('should return ARV within reasonable range', async () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const
      };

      const analysis = await analyzeProperty(testUserId, testListingId, input);

      expect(analysis.arv.low).toBeGreaterThan(0);
      expect(analysis.arv.high).toBeGreaterThan(analysis.arv.low);
      expect(analysis.arv.median).toBeGreaterThanOrEqual(analysis.arv.low);
      expect(analysis.arv.median).toBeLessThanOrEqual(analysis.arv.high);
      expect(analysis.arv.confidence).toBeGreaterThan(0);
      expect(analysis.arv.confidence).toBeLessThanOrEqual(1);
    });

    it('should return repair estimates with correct structure', async () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const
      };

      const analysis = await analyzeProperty(testUserId, testListingId, input);

      expect(analysis.repairs).toHaveProperty('cosmetic');
      expect(analysis.repairs).toHaveProperty('structural');
      expect(analysis.repairs).toHaveProperty('systems');
      expect(analysis.repairs).toHaveProperty('total');

      expect(analysis.repairs.cosmetic.low).toBeGreaterThanOrEqual(0);
      expect(analysis.repairs.cosmetic.high).toBeGreaterThanOrEqual(analysis.repairs.cosmetic.low);
    });

    it('should return MAO calculation', async () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const
      };

      const analysis = await analyzeProperty(testUserId, testListingId, input);

      expect(analysis.mao.low).toBeGreaterThan(0);
      expect(analysis.mao.high).toBeGreaterThan(analysis.mao.low);
      expect(analysis.mao.recommended).toBeGreaterThanOrEqual(analysis.mao.low);
      expect(analysis.mao.recommended).toBeLessThanOrEqual(analysis.mao.high);
    });

    it('should return comparable sales', async () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const
      };

      const analysis = await analyzeProperty(testUserId, testListingId, input);

      expect(Array.isArray(analysis.comps)).toBe(true);
      if (analysis.comps.length > 0) {
        const comp = analysis.comps[0];
        expect(comp).toHaveProperty('address');
        expect(comp).toHaveProperty('price');
        expect(comp).toHaveProperty('beds');
        expect(comp).toHaveProperty('baths');
        expect(comp).toHaveProperty('sqft');
        expect(comp).toHaveProperty('distance');
        expect(comp).toHaveProperty('sold_date');
      }
    });

    it('should return analysis notes', async () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const
      };

      const analysis = await analyzeProperty(testUserId, testListingId, input);

      expect(Array.isArray(analysis.analysis_notes)).toBe(true);
      expect(analysis.analysis_notes.length).toBeGreaterThan(0);
    });

    it('should return confidence score', async () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const
      };

      const analysis = await analyzeProperty(testUserId, testListingId, input);

      expect(analysis.confidence_score).toBeGreaterThan(0);
      expect(analysis.confidence_score).toBeLessThanOrEqual(1);
    });
  });

  describe('generateMockAnalysis', () => {
    it('should generate realistic mock data', () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const
      };

      const analysis = generateMockAnalysis(input);

      // Check ARV calculation
      const expectedBasePrice = input.sqft * 150; // $150/sqft base
      const expectedBedBathMultiplier = (input.beds + input.baths) * 5000;
      const expectedArvBase = expectedBasePrice + expectedBedBathMultiplier;

      expect(analysis.arv.median).toBeCloseTo(expectedArvBase, -2);
      expect(analysis.arv.low).toBeLessThan(analysis.arv.median);
      expect(analysis.arv.high).toBeGreaterThan(analysis.arv.median);
    });

    it('should generate repair estimates', () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const
      };

      const analysis = generateMockAnalysis(input);

      expect(analysis.repairs.total.low).toBeGreaterThan(0);
      expect(analysis.repairs.total.high).toBeGreaterThan(analysis.repairs.total.low);
    });

    it('should generate MAO calculation', () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const
      };

      const analysis = generateMockAnalysis(input);

      expect(analysis.mao.low).toBeGreaterThan(0);
      expect(analysis.mao.high).toBeGreaterThan(analysis.mao.low);
      expect(analysis.mao.recommended).toBeGreaterThanOrEqual(analysis.mao.low);
      expect(analysis.mao.recommended).toBeLessThanOrEqual(analysis.mao.high);
    });

    it('should generate comparable sales', () => {
      const input = {
        address: '123 Test St',
        beds: 3,
        baths: 2,
        sqft: 1500,
        propertyType: 'single_family' as const
      };

      const analysis = generateMockAnalysis(input);

      expect(analysis.comps).toHaveLength(3);
      analysis.comps.forEach(comp => {
        expect(comp.address).toBeDefined();
        expect(comp.price).toBeGreaterThan(0);
        expect(comp.beds).toBeGreaterThan(0);
        expect(comp.baths).toBeGreaterThan(0);
        expect(comp.sqft).toBeGreaterThan(0);
        expect(comp.distance).toBeGreaterThan(0);
        expect(comp.sold_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
});
