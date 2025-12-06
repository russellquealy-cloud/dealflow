/**
 * Distress score calculation utilities
 * 
 * Computes a numeric distress score (0-10) for listings or areas based on:
 * - Days on market (longer = more distress)
 * - Price per sqft vs market average (lower = more distress)
 * - Market-level indicators (price cuts, days to close)
 */

export interface DistressFactors {
  daysOnMarket: number;
  pricePerSqft: number | null;
  marketPricePerSqft: number | null;
  marketPriceCutPct: number | null;
  marketDaysToClose: number | null;
  hasPriceReduction?: boolean;
}

/**
 * Calculate distress score for a single listing
 * 
 * @param factors - Distress factors for the listing
 * @returns Distress score from 0-10 (higher = more distressed)
 */
export function calculateDistressScore(factors: DistressFactors): number {
  let score = 0;

  // Factor 1: Days on market (0-2 points)
  // More than 90 days = 2 points, 60-90 = 1 point, <60 = 0
  if (factors.daysOnMarket >= 90) {
    score += 2;
  } else if (factors.daysOnMarket >= 60) {
    score += 1;
  }

  // Factor 2: Price per sqft vs market average (0-2 points)
  // If listing is >20% below market average = 2 points, 10-20% = 1 point
  if (factors.pricePerSqft != null && factors.marketPricePerSqft != null && factors.marketPricePerSqft > 0) {
    const discountPct = ((factors.marketPricePerSqft - factors.pricePerSqft) / factors.marketPricePerSqft) * 100;
    if (discountPct >= 20) {
      score += 2;
    } else if (discountPct >= 10) {
      score += 1;
    }
  }

  // Factor 3: Market-level price cuts (0-2 points)
  // If market has >30% price cuts = 2 points, 20-30% = 1 point
  if (factors.marketPriceCutPct != null) {
    if (factors.marketPriceCutPct >= 30) {
      score += 2;
    } else if (factors.marketPriceCutPct >= 20) {
      score += 1;
    }
  }

  // Factor 4: Market-level days to close (0-2 points)
  // If market has >60 days to close = 2 points, 45-60 = 1 point
  if (factors.marketDaysToClose != null) {
    if (factors.marketDaysToClose >= 60) {
      score += 2;
    } else if (factors.marketDaysToClose >= 45) {
      score += 1;
    }
  }

  // Factor 5: Explicit price reduction flag (0-2 points)
  if (factors.hasPriceReduction) {
    score += 2;
  }

  // Normalize to 0-10 range (cap at 10)
  return Math.min(10, Math.max(0, score));
}

/**
 * Calculate days on market from created_at timestamp
 */
export function calculateDaysOnMarket(createdAt: string | null | undefined): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate price per sqft
 */
export function calculatePricePerSqft(price: number | null, sqft: number | null): number | null {
  if (price == null || sqft == null || sqft <= 0) return null;
  return price / sqft;
}
