#!/usr/bin/env tsx
/**
 * Vercel Domain Verification Script
 * 
 * Verifies and optionally adds domains to your Vercel project.
 * Uses Vercel REST API to check domain configuration.
 * 
 * Usage:
 *   npx tsx scripts/vercel-verify-domain.ts
 * 
 * Required environment variables:
 *   VERCEL_TOKEN - Your Vercel API token
 *   VERCEL_PROJECT_ID - Your Vercel project ID
 *   NEXT_PUBLIC_SITE_URL - Expected domain (e.g., https://www.offaxisdeals.com)
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable is required');
  process.exit(1);
}

if (!VERCEL_PROJECT_ID) {
  console.error('❌ VERCEL_PROJECT_ID environment variable is required');
  process.exit(1);
}

if (!SITE_URL) {
  console.error('❌ NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL environment variable is required');
  process.exit(1);
}

// Extract domain from URL
const domainMatch = SITE_URL.match(/https?:\/\/(?:www\.)?([^/]+)/);
if (!domainMatch) {
  console.error('❌ Could not extract domain from SITE_URL:', SITE_URL);
  process.exit(1);
}

const primaryDomain = domainMatch[1];
const wwwDomain = `www.${primaryDomain}`;

interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: number | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
}

interface VercelProject {
  id: string;
  name: string;
  domains: VercelDomain[];
}

async function getProjectDomains(): Promise<VercelDomain[]> {
  const response = await fetch(
    `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains`,
    {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch domains: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.domains || [];
}

async function addDomain(domain: string): Promise<VercelDomain> {
  const response = await fetch(
    `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to add domain: ${response.status} ${JSON.stringify(error)}`);
  }

  return await response.json();
}

async function main() {
  console.log('🔍 Checking Vercel domain configuration...\n');
  console.log(`Project ID: ${VERCEL_PROJECT_ID}`);
  console.log(`Expected domain: ${primaryDomain}`);
  console.log(`Expected www: ${wwwDomain}\n`);

  try {
    const domains = await getProjectDomains();
    const domainNames = domains.map(d => d.name);

    console.log(`📋 Found ${domains.length} domain(s) configured:\n`);
    domains.forEach(domain => {
      const status = domain.verified ? '✅ Verified' : '⚠️  Not Verified';
      console.log(`  ${domain.name} - ${status}`);
      if (domain.verification && domain.verification.length > 0) {
        domain.verification.forEach(v => {
          console.log(`    ${v.type}: ${v.value}`);
        });
      }
    });

    const hasPrimary = domainNames.includes(primaryDomain);
    const hasWww = domainNames.includes(wwwDomain);

    console.log('\n📊 Domain Status:');
    console.log(`  ${primaryDomain}: ${hasPrimary ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  ${wwwDomain}: ${hasWww ? '✅ Configured' : '❌ Missing'}`);

    if (!hasPrimary && !hasWww) {
      console.log('\n⚠️  No matching domains found!');
      console.log('\n📝 DNS Configuration Required:\n');
      
      if (primaryDomain.startsWith('www.')) {
        // If primary is www, use CNAME
        console.log(`For ${primaryDomain}:`);
        console.log(`  Type: CNAME`);
        console.log(`  Name: @ or www`);
        console.log(`  Value: cname.vercel-dns.com`);
      } else {
        // If primary is apex, use A record
        console.log(`For ${primaryDomain}:`);
        console.log(`  Type: A`);
        console.log(`  Name: @`);
        console.log(`  Value: 76.76.21.21`);
        console.log(`\nFor www.${primaryDomain}:`);
        console.log(`  Type: CNAME`);
        console.log(`  Name: www`);
        console.log(`  Value: cname.vercel-dns.com`);
      }

      console.log('\n💡 To add domains via API, set VERCEL_TOKEN and run with --add flag');
      console.log('   (This script does not auto-add domains for safety)');
    } else if (!hasPrimary || !hasWww) {
      console.log('\n⚠️  Partial domain configuration detected.');
      if (!hasPrimary) {
        console.log(`\n📝 To add ${primaryDomain}, add via Vercel Dashboard or use:`);
        console.log(`   curl -X POST https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains \\`);
        console.log(`     -H "Authorization: Bearer $VERCEL_TOKEN" \\`);
        console.log(`     -H "Content-Type: application/json" \\`);
        console.log(`     -d '{"name": "${primaryDomain}"}'`);
      }
      if (!hasWww) {
        console.log(`\n📝 To add ${wwwDomain}, add via Vercel Dashboard or use:`);
        console.log(`   curl -X POST https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains \\`);
        console.log(`     -H "Authorization: Bearer $VERCEL_TOKEN" \\`);
        console.log(`     -H "Content-Type: application/json" \\`);
        console.log(`     -d '{"name": "${wwwDomain}"}'`);
      }
    } else {
      console.log('\n✅ All domains are configured!');
      
      // Check verification status
      const unverifiedDomains = domains.filter(d => !d.verified && (d.name === primaryDomain || d.name === wwwDomain));
      if (unverifiedDomains.length > 0) {
        console.log('\n⚠️  Some domains are not verified. DNS changes may take 24-48 hours to propagate.');
        unverifiedDomains.forEach(d => {
          if (d.verification && d.verification.length > 0) {
            console.log(`\n${d.name} verification required:`);
            d.verification.forEach(v => {
              console.log(`  ${v.type}: Add ${v.value} to your DNS`);
            });
          }
        });
      } else {
        console.log('✅ All domains are verified!');
      }
    }

    console.log('\n📚 Next Steps:');
    console.log('1. Ensure NEXT_PUBLIC_SITE_URL is set in Vercel environment variables');
    console.log('2. Redeploy after setting environment variables');
    console.log('3. Test domain at https://' + primaryDomain);
    
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

