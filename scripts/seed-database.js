#!/usr/bin/env node

/**
 * Comprehensive database seeding script for Deal Flow
 * Run with: node scripts/seed-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Sample data
const SAMPLE_LISTINGS = [
  {
    title: 'Beautiful Historic Home in Downtown',
    address: '123 E Broadway Blvd',
    city: 'Tucson',
    state: 'AZ',
    zip: '85701',
    price: 250000,
    beds: 3,
    baths: 2,
    sqft: 1800,
    latitude: 32.2226,
    longitude: -110.9747,
    property_type: 'single_family',
    year_built: 1920,
    lot_size: 0.25,
    description: 'Charming historic home in downtown Tucson with original hardwood floors and updated kitchen.',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'
    ],
    cover_image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    arv: 320000,
    repairs: 25000,
    spread: 45000,
    roi: 18
  },
  {
    title: 'Modern Desert Oasis',
    address: '456 N Campbell Ave',
    city: 'Tucson',
    state: 'AZ',
    zip: '85719',
    price: 450000,
    beds: 4,
    baths: 3,
    sqft: 2400,
    latitude: 32.2326,
    longitude: -110.9847,
    property_type: 'single_family',
    year_built: 2015,
    lot_size: 0.5,
    description: 'Stunning modern home with mountain views and updated finishes throughout.',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    cover_image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    arv: 550000,
    repairs: 15000,
    spread: 85000,
    roi: 19
  },
  {
    title: 'Mountain View Ranch',
    address: '789 E Speedway Blvd',
    city: 'Tucson',
    state: 'AZ',
    zip: '85719',
    price: 350000,
    beds: 3,
    baths: 2,
    sqft: 2000,
    latitude: 32.2426,
    longitude: -110.9947,
    property_type: 'single_family',
    year_built: 1995,
    lot_size: 0.3,
    description: 'Spacious ranch with mountain views and large backyard.',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
    ],
    cover_image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    arv: 420000,
    repairs: 20000,
    spread: 50000,
    roi: 14
  },
  {
    title: 'Downtown Condo with City Views',
    address: '101 S 6th Ave',
    city: 'Tucson',
    state: 'AZ',
    zip: '85701',
    price: 180000,
    beds: 2,
    baths: 2,
    sqft: 1200,
    latitude: 32.2126,
    longitude: -110.9547,
    property_type: 'condo',
    year_built: 2010,
    lot_size: 0.1,
    description: 'Modern downtown condo with city views and walkable to restaurants.',
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    cover_image_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    arv: 220000,
    repairs: 10000,
    spread: 30000,
    roi: 17
  },
  {
    title: 'Family Home in Suburbs',
    address: '555 W Grant Rd',
    city: 'Tucson',
    state: 'AZ',
    zip: '85705',
    price: 320000,
    beds: 4,
    baths: 3,
    sqft: 2200,
    latitude: 32.2526,
    longitude: -111.0047,
    property_type: 'single_family',
    year_built: 2005,
    lot_size: 0.4,
    description: 'Great family home in quiet neighborhood with good schools nearby.',
    images: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
    ],
    cover_image_url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    arv: 380000,
    repairs: 18000,
    spread: 42000,
    roi: 13
  }
];

const SAMPLE_WHOLESALERS = [
  {
    name: 'John Smith',
    email: 'john@tucsonwholesale.com',
    phone: '(520) 555-0101',
    company: 'Tucson Wholesale Group',
    city: 'Tucson',
    state: 'AZ',
    experience_years: 5,
    specialties: 'Single family, fix and flip',
    bio: 'Experienced wholesaler specializing in single family homes in Tucson area.'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@desertdeals.com',
    phone: '(520) 555-0102',
    company: 'Desert Deals LLC',
    city: 'Tucson',
    state: 'AZ',
    experience_years: 3,
    specialties: 'Condos, townhouses',
    bio: 'Focus on condos and townhouses in downtown Tucson.'
  },
  {
    name: 'Mike Rodriguez',
    email: 'mike@azwholesale.com',
    phone: '(520) 555-0103',
    company: 'AZ Wholesale Partners',
    city: 'Phoenix',
    state: 'AZ',
    experience_years: 8,
    specialties: 'Multi-family, commercial',
    bio: 'Experienced in multi-family and commercial properties across Arizona.'
  }
];

const SAMPLE_INVESTORS = [
  {
    name: 'Lisa Chen',
    email: 'lisa@phoenixcapital.com',
    phone: '(602) 555-0201',
    company: 'Phoenix Capital Partners',
    city: 'Phoenix',
    state: 'AZ',
    investment_preferences: 'Fix and flip, new construction',
    budget_range: '$200k - $600k',
    bio: 'Looking for fix and flip opportunities in Phoenix metro area.'
  },
  {
    name: 'David Wilson',
    email: 'david@valleyinvestments.com',
    phone: '(602) 555-0202',
    company: 'Valley Investment Group',
    city: 'Phoenix',
    state: 'AZ',
    investment_preferences: 'Rental properties, buy and hold',
    budget_range: '$100k - $500k',
    bio: 'Long-term rental investor focused on cash flow properties.'
  },
  {
    name: 'Jennifer Martinez',
    email: 'jennifer@vegasdeals.com',
    phone: '(702) 555-0301',
    company: 'Vegas Deal Finders',
    city: 'Las Vegas',
    state: 'NV',
    investment_preferences: 'Wholesale, fix and flip',
    budget_range: '$120k - $350k',
    bio: 'Wholesale specialist in Las Vegas market.'
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed listings
    console.log('📋 Seeding listings...');
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .insert(SAMPLE_LISTINGS)
      .select();

    if (listingsError) {
      console.error('❌ Error seeding listings:', listingsError);
    } else {
      console.log(`✅ Seeded ${listings.length} listings`);
    }

    // 2. Seed wholesaler profiles
    console.log('👷 Seeding wholesaler profiles...');
    const wholesalerProfiles = SAMPLE_WHOLESALERS.map(wholesaler => ({
      type: 'wholesaler',
      company_name: wholesaler.company,
      phone: wholesaler.phone,
      city: wholesaler.city,
      state: wholesaler.state,
      experience_years: wholesaler.experience_years,
      specialties: wholesaler.specialties,
      bio: wholesaler.bio,
      subscription_tier: 'pro',
      subscription_status: 'active'
    }));

    const { data: wholesalers, error: wholesalersError } = await supabase
      .from('profiles')
      .insert(wholesalerProfiles)
      .select();

    if (wholesalersError) {
      console.error('❌ Error seeding wholesalers:', wholesalersError);
    } else {
      console.log(`✅ Seeded ${wholesalers.length} wholesaler profiles`);
    }

    // 3. Seed investor profiles
    console.log('💰 Seeding investor profiles...');
    const investorProfiles = SAMPLE_INVESTORS.map(investor => ({
      type: 'investor',
      company_name: investor.company,
      phone: investor.phone,
      city: investor.city,
      state: investor.state,
      investment_preferences: investor.investment_preferences,
      budget_range: investor.budget_range,
      bio: investor.bio,
      subscription_tier: 'pro',
      subscription_status: 'active'
    }));

    const { data: investors, error: investorsError } = await supabase
      .from('profiles')
      .insert(investorProfiles)
      .select();

    if (investorsError) {
      console.error('❌ Error seeding investors:', investorsError);
    } else {
      console.log(`✅ Seeded ${investors.length} investor profiles`);
    }

    // 4. Create sample subscriptions
    console.log('💳 Creating sample subscriptions...');
    const sampleSubscriptions = [
      {
        user_id: wholesalers[0]?.id,
        stripe_customer_id: 'cus_sample_wholesaler',
        stripe_subscription_id: 'sub_sample_wholesaler',
        stripe_price_id: 'price_pro_monthly',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: investors[0]?.id,
        stripe_customer_id: 'cus_sample_investor',
        stripe_subscription_id: 'sub_sample_investor',
        stripe_price_id: 'price_pro_monthly',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .insert(sampleSubscriptions)
      .select();

    if (subscriptionsError) {
      console.error('❌ Error seeding subscriptions:', subscriptionsError);
    } else {
      console.log(`✅ Seeded ${subscriptions.length} subscriptions`);
    }

    // 5. Create sample usage data
    console.log('📊 Creating sample usage data...');
    const currentMonth = new Date().toISOString().slice(0, 7);
    const sampleUsage = [
      {
        user_id: wholesalers[0]?.id,
        subscription_id: subscriptions[0]?.id,
        month_year: currentMonth,
        contacts_used: 3,
        ai_analyses_used: 2,
        listings_created: 1
      },
      {
        user_id: investors[0]?.id,
        subscription_id: subscriptions[1]?.id,
        month_year: currentMonth,
        contacts_used: 5,
        ai_analyses_used: 1,
        listings_created: 0
      }
    ];

    const { data: usage, error: usageError } = await supabase
      .from('subscription_usage')
      .insert(sampleUsage)
      .select();

    if (usageError) {
      console.error('❌ Error seeding usage data:', usageError);
    } else {
      console.log(`✅ Seeded ${usage.length} usage records`);
    }

    // 6. Create sample contact logs
    console.log('📞 Creating sample contact logs...');
    const sampleContacts = [
      {
        user_id: investors[0]?.id,
        listing_id: listings[0]?.id,
        contact_type: 'email',
        contact_data: {
          buyer_name: 'John Smith',
          buyer_email: 'john@tucsonwholesale.com',
          message: 'Interested in this property. Can we schedule a showing?',
          timestamp: new Date().toISOString()
        }
      },
      {
        user_id: investors[0]?.id,
        listing_id: listings[1]?.id,
        contact_type: 'call',
        contact_data: {
          buyer_name: 'Sarah Johnson',
          buyer_phone: '(520) 555-0102',
          message: 'Called to discuss property details',
          timestamp: new Date().toISOString()
        }
      }
    ];

    const { data: contacts, error: contactsError } = await supabase
      .from('contact_logs')
      .insert(sampleContacts)
      .select();

    if (contactsError) {
      console.error('❌ Error seeding contact logs:', contactsError);
    } else {
      console.log(`✅ Seeded ${contacts.length} contact logs`);
    }

    // 7. Create sample AI analysis logs
    console.log('🤖 Creating sample AI analysis logs...');
    const sampleAnalyses = [
      {
        user_id: wholesalers[0]?.id,
        listing_id: listings[0]?.id,
        analysis_type: 'arv',
        input_data: {
          address: listings[0].address,
          beds: listings[0].beds,
          baths: listings[0].baths,
          sqft: listings[0].sqft
        },
        output_data: {
          arv: { low: 300000, high: 340000, median: 320000, confidence: 0.85 },
          repairs: { total: { low: 20000, high: 30000 } },
          mao: { recommended: 270000 }
        },
        cost_cents: 50
      }
    ];

    const { data: analyses, error: analysesError } = await supabase
      .from('ai_analysis_logs')
      .insert(sampleAnalyses)
      .select();

    if (analysesError) {
      console.error('❌ Error seeding AI analyses:', analysesError);
    } else {
      console.log(`✅ Seeded ${analyses.length} AI analysis logs`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Listings: ${listings?.length || 0}`);
    console.log(`- Wholesalers: ${wholesalers?.length || 0}`);
    console.log(`- Investors: ${investors?.length || 0}`);
    console.log(`- Subscriptions: ${subscriptions?.length || 0}`);
    console.log(`- Usage Records: ${usage?.length || 0}`);
    console.log(`- Contact Logs: ${contacts?.length || 0}`);
    console.log(`- AI Analyses: ${analyses?.length || 0}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
