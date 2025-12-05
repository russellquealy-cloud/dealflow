/**
 * Dev-only script to verify /api/markets/snapshot endpoint behavior
 * 
 * Run with: pnpm tsx scripts/test-market-snapshot-api.ts
 * 
 * This script tests:
 * - Single regionId query
 * - List query with sorting (marketStrengthScore desc)
 * - State filter
 * - Default limit enforcement
 * - Error handling
 */

async function testMarketSnapshotAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  console.log('Testing /api/markets/snapshot endpoint...\n');
  console.log(`Base URL: ${baseUrl}\n`);

  // Test 1: Single regionId query
  console.log('Test 1: Single regionId query');
  try {
    const response1 = await fetch(`${baseUrl}/api/markets/snapshot?regionId=394463&regionType=msa`);
    const data1 = await response1.json();
    
    if (response1.ok && data1.regionId) {
      console.log('✅ Single regionId query: SUCCESS');
      console.log(`   Region: ${data1.regionName}, ${data1.stateName}`);
      console.log(`   Market Strength Score: ${data1.marketStrengthScore}`);
    } else {
      console.log(`❌ Single regionId query: FAILED (${response1.status})`);
      console.log(`   Response:`, JSON.stringify(data1, null, 2));
    }
  } catch (error) {
    console.log(`❌ Single regionId query: ERROR`);
    console.log(`   Error:`, error);
  }
  console.log('');

  // Test 2: List query with sorting (marketStrengthScore desc)
  console.log('Test 2: List query with sortBy=marketStrengthScore&sortDir=desc');
  try {
    const response2 = await fetch(`${baseUrl}/api/markets/snapshot?limit=5&sortBy=marketStrengthScore&sortDir=desc&regionType=msa`);
    const data2 = await response2.json();
    
    if (response2.ok && Array.isArray(data2) && data2.length > 0) {
      console.log('✅ List query with sorting: SUCCESS');
      console.log(`   Returned ${data2.length} results`);
      
      // Verify sorting (descending marketStrengthScore)
      const scores = data2.map((s: { marketStrengthScore: number | null }) => s.marketStrengthScore).filter((s: number | null) => s !== null);
      const isDescending = scores.every((score: number, i: number) => i === 0 || scores[i - 1]! >= score);
      
      if (isDescending) {
        console.log('✅ Sorting verified: Results are in descending order by marketStrengthScore');
        console.log(`   Top scores: ${scores.slice(0, 3).join(', ')}`);
      } else {
        console.log('⚠️  Sorting issue: Results may not be in descending order');
      }
      
      console.log(`   First result: ${data2[0]?.regionName}, ${data2[0]?.stateName} (Score: ${data2[0]?.marketStrengthScore})`);
    } else {
      console.log(`❌ List query with sorting: FAILED (${response2.status})`);
      console.log(`   Response:`, JSON.stringify(data2, null, 2));
    }
  } catch (error) {
    console.log(`❌ List query with sorting: ERROR`);
    console.log(`   Error:`, error);
  }
  console.log('');

  // Test 3: State filter
  console.log('Test 3: State filter (California)');
  try {
    const response3 = await fetch(`${baseUrl}/api/markets/snapshot?state=California&regionType=msa&limit=3`);
    const data3 = await response3.json();
    
    if (response3.ok && Array.isArray(data3)) {
      const allCalifornia = data3.every((s: { stateName: string | null }) => s.stateName === 'California');
      
      if (allCalifornia) {
        console.log('✅ State filter: SUCCESS');
        console.log(`   Returned ${data3.length} results, all from California`);
        console.log(`   Regions: ${data3.map((s: { regionName: string }) => s.regionName).join(', ')}`);
      } else {
        console.log('⚠️  State filter: Some results are not from California');
      }
    } else {
      console.log(`❌ State filter: FAILED (${response3.status})`);
      console.log(`   Response:`, JSON.stringify(data3, null, 2));
    }
  } catch (error) {
    console.log(`❌ State filter: ERROR`);
    console.log(`   Error:`, error);
  }
  console.log('');

  // Test 4: Default limit enforcement (should cap at 500)
  console.log('Test 4: Limit enforcement (requesting 1000, should cap at 500)');
  try {
    const response4 = await fetch(`${baseUrl}/api/markets/snapshot?limit=1000&regionType=msa`);
    const data4 = await response4.json();
    
    if (response4.ok && Array.isArray(data4)) {
      if (data4.length <= 500) {
        console.log('✅ Limit enforcement: SUCCESS');
        console.log(`   Requested 1000, got ${data4.length} results (capped at 500)`);
      } else {
        console.log(`⚠️  Limit enforcement: Got ${data4.length} results (expected max 500)`);
      }
    } else {
      console.log(`❌ Limit enforcement: FAILED (${response4.status})`);
      console.log(`   Response:`, JSON.stringify(data4, null, 2));
    }
  } catch (error) {
    console.log(`❌ Limit enforcement: ERROR`);
    console.log(`   Error:`, error);
  }
  console.log('');

  // Test 5: Invalid regionId
  console.log('Test 5: Invalid regionId (should return 404)');
  try {
    const response5 = await fetch(`${baseUrl}/api/markets/snapshot?regionId=999999999&regionType=msa`);
    const data5 = await response5.json();
    
    if (response5.status === 404) {
      console.log('✅ Invalid regionId: SUCCESS (correctly returns 404)');
    } else {
      console.log(`⚠️  Invalid regionId: Expected 404, got ${response5.status}`);
      console.log(`   Response:`, JSON.stringify(data5, null, 2));
    }
  } catch (error) {
    console.log(`❌ Invalid regionId: ERROR`);
    console.log(`   Error:`, error);
  }
  console.log('');

  console.log('Test suite completed.\n');
}

// Run tests if this script is executed directly
testMarketSnapshotAPI().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});

export { testMarketSnapshotAPI };

