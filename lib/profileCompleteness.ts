// lib/profileCompleteness.ts

export type AnyProfile = {
  id: string;
  email?: string | null;
  role?: string | null;
  segment?: string | null;
  tier?: string | null;
  membership_tier?: string | null;

  // Investor preference fields
  buy_markets?: string[] | null;
  buy_property_types?: string[] | null;
  buy_price_min?: number | null;
  buy_price_max?: number | null;
  buy_strategy?: string | null;
  buy_condition?: string | null;
  capital_available?: number | null;

  // Add common fields that might appear later:
  sell_markets?: string[] | null;
  sell_property_types?: string[] | null;
  sell_price_min?: number | null;
  sell_price_max?: number | null;

  // Generic flexible catch-all for future profile attributes
  [key: string]: unknown;
};

export type UserRole = "admin" | "investor" | "wholesaler" | "guest";

export type ProfileCompletenessResult = {
  completeness: number;       // 0–100
  score: number;              // alias of completeness
  missingFields: string[];    // existing field
  missingKeys: string[];      // alias for UI in account page
};

export function getProfileCompleteness(profile: AnyProfile): ProfileCompletenessResult {
  // Minimal implementation — expand later.
  const missing: string[] = [];

  if (!profile.email) missing.push("email");
  if (!profile.role) missing.push("role");

  const completeness = Math.max(0, 100 - missing.length * 20);

  return {
    completeness,
    score: completeness,
    missingFields: missing,
    missingKeys: missing,
  };
}

