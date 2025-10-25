/**
 * Test setup and utilities for Deal Flow
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.test' });

// Test database client
export const testSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Test data
export const TEST_USER = {
  email: 'test@offaxisdeals.com',
  password: 'testpassword123',
  id: 'test-user-id'
};

export const TEST_LISTING = {
  title: 'Test Property',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zip: '12345',
  price: 250000,
  beds: 3,
  baths: 2,
  sqft: 1500,
  latitude: 32.2226,
  longitude: -110.9747,
  property_type: 'single_family',
  description: 'Test property for unit testing'
};

export const TEST_BUYER = {
  name: 'Test Buyer',
  email: 'buyer@test.com',
  phone: '(555) 555-5555',
  company: 'Test Company',
  city: 'Test City',
  state: 'TS',
  investment_focus: ['fix_and_flip'],
  price_range_min: 200000,
  price_range_max: 300000,
  property_types: ['single_family'],
  bed_min: 2,
  bed_max: 4,
  bath_min: 2,
  bath_max: 3,
  sqft_min: 1200,
  sqft_max: 2000,
  is_active: true
};

// Test utilities
export async function cleanupTestData() {
  try {
    // Clean up test data in reverse order of dependencies
    await testSupabase.from('ai_analysis_logs').delete().like('user_id', 'test-%');
    await testSupabase.from('contact_logs').delete().like('user_id', 'test-%');
    await testSupabase.from('subscription_usage').delete().like('user_id', 'test-%');
    await testSupabase.from('subscriptions').delete().like('user_id', 'test-%');
    await testSupabase.from('buyers').delete().like('name', 'Test%');
    await testSupabase.from('listings').delete().like('title', 'Test%');
    await testSupabase.from('profiles').delete().like('company_name', 'Test%');
  } catch (error) {
    console.warn('Cleanup failed:', error);
  }
}

export async function createTestUser() {
  const { data, error } = await testSupabase.auth.signUp({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  
  if (error) throw error;
  return data;
}

export async function createTestListing(userId: string) {
  const { data, error } = await testSupabase
    .from('listings')
    .insert({
      ...TEST_LISTING,
      user_id: userId,
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function createTestBuyer() {
  const { data, error } = await testSupabase
    .from('buyers')
    .insert(TEST_BUYER)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function createTestSubscription(userId: string) {
  const { data, error } = await testSupabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_customer_id: 'cus_test_' + Date.now(),
      stripe_subscription_id: 'sub_test_' + Date.now(),
      stripe_price_id: 'price_pro_monthly',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// Mock AI analysis response
export const MOCK_AI_ANALYSIS = {
  arv: {
    low: 300000,
    high: 350000,
    median: 325000,
    confidence: 0.85
  },
  repairs: {
    cosmetic: { low: 5000, high: 10000 },
    structural: { low: 10000, high: 20000 },
    systems: { low: 5000, high: 15000 },
    total: { low: 20000, high: 45000 }
  },
  mao: {
    low: 250000,
    high: 300000,
    recommended: 275000
  },
  comps: [
    {
      address: '100 Comp St',
      price: 320000,
      beds: 3,
      baths: 2,
      sqft: 1600,
      distance: 0.5,
      sold_date: '2024-01-15'
    }
  ],
  analysis_notes: [
    'Property in good condition',
    'Market conditions favorable'
  ],
  confidence_score: 0.8
};

// Test environment setup
export const TEST_CONFIG = {
  database: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  stripe: {
    secret: process.env.STRIPE_SECRET_KEY,
    publishable: process.env.STRIPE_PUBLISHABLE_KEY
  },
  ai: {
    enabled: process.env.AI_ANALYZER_ENABLED === 'true',
    apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
  },
  notifications: {
    email: {
      enabled: !!(process.env.RESEND_API_KEY || process.env.POSTMARK_API_TOKEN),
      provider: process.env.RESEND_API_KEY ? 'resend' : 'postmark'
    },
    push: {
      enabled: process.env.PUSH_WEB_ENABLED === 'true'
    }
  }
};
