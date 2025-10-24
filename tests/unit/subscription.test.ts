/**
 * Unit tests for subscription functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getUserSubscriptionTier, 
  canUserPerformAction, 
  incrementUsage,
  getPlanLimits,
  getPlanFeatures 
} from '../../app/lib/subscription';
import { 
  cleanupTestData, 
  createTestUser, 
  createTestSubscription,
  testSupabase 
} from '../setup';

describe('Subscription System', () => {
  let testUserId: string;
  let testSubscriptionId: string;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test user
    const { data: authData } = await createTestUser();
    testUserId = authData.user?.id || 'test-user-id';
    
    // Create test subscription
    const subscription = await createTestSubscription(testUserId);
    testSubscriptionId = subscription.id;
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('getUserSubscriptionTier', () => {
    it('should return correct tier for active subscription', async () => {
      const tier = await getUserSubscriptionTier(testUserId);
      expect(tier).toBe('PRO');
    });

    it('should return FREE tier for user without subscription', async () => {
      const { data: { user } } = await testSupabase.auth.signUp({
        email: 'free@test.com',
        password: 'testpass123'
      });
      
      const tier = await getUserSubscriptionTier(user?.id || '');
      expect(tier).toBe('FREE');
    });
  });

  describe('canUserPerformAction', () => {
    it('should allow action within limits', async () => {
      const canContact = await canUserPerformAction(testUserId, 'contacts', 1);
      expect(canContact).toBe(true);
    });

    it('should deny action when limits exceeded', async () => {
      // Create usage record that exceeds limits
      await testSupabase
        .from('subscription_usage')
        .insert({
          user_id: testUserId,
          subscription_id: testSubscriptionId,
          month_year: new Date().toISOString().slice(0, 7),
          contacts_used: 1000, // Exceed free tier limit
          ai_analyses_used: 0,
          listings_created: 0
        });

      const canContact = await canUserPerformAction(testUserId, 'contacts', 1);
      expect(canContact).toBe(false);
    });

    it('should allow unlimited actions for PRO tier', async () => {
      const canContact = await canUserPerformAction(testUserId, 'contacts', 1000);
      expect(canContact).toBe(true);
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage correctly', async () => {
      await incrementUsage(testUserId, 'contacts', 1);
      
      const { data: usage } = await testSupabase
        .from('subscription_usage')
        .select('contacts_used')
        .eq('user_id', testUserId)
        .single();
        
      expect(usage?.contacts_used).toBe(1);
    });

    it('should create new usage record if none exists', async () => {
      await incrementUsage(testUserId, 'ai_analyses', 1);
      
      const { data: usage } = await testSupabase
        .from('subscription_usage')
        .select('ai_analyses_used')
        .eq('user_id', testUserId)
        .single();
        
      expect(usage?.ai_analyses_used).toBe(1);
    });
  });

  describe('getPlanLimits', () => {
    it('should return correct limits for FREE tier', () => {
      const limits = getPlanLimits('FREE');
      expect(limits.contacts).toBe(5);
      expect(limits.ai_analyses).toBe(0);
      expect(limits.listings).toBe(0);
    });

    it('should return correct limits for PRO tier', () => {
      const limits = getPlanLimits('PRO');
      expect(limits.contacts).toBe(-1); // Unlimited
      expect(limits.ai_analyses).toBe(50);
      expect(limits.listings).toBe(-1); // Unlimited
    });

    it('should return correct limits for ENTERPRISE tier', () => {
      const limits = getPlanLimits('ENTERPRISE');
      expect(limits.contacts).toBe(-1); // Unlimited
      expect(limits.ai_analyses).toBe(-1); // Unlimited
      expect(limits.listings).toBe(-1); // Unlimited
    });
  });

  describe('getPlanFeatures', () => {
    it('should return correct features for FREE tier', () => {
      const features = getPlanFeatures('FREE');
      expect(features).toContain('View all listings');
      expect(features).toContain('Basic map search');
      expect(features).toContain('Contact 5 listings/month');
    });

    it('should return correct features for PRO tier', () => {
      const features = getPlanFeatures('PRO');
      expect(features).toContain('Unlimited listings');
      expect(features).toContain('AI property analysis');
      expect(features).toContain('Unlimited contacts');
    });
  });
});
