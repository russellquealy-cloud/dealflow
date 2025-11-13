export type UserRole = 'investor' | 'wholesaler';

export interface BaseProfile {
  id: string;
  role: UserRole;
  full_name?: string | null;
  company_name?: string | null;
  profile_photo_url?: string | null;
  phone_verified?: boolean | null;
  license_info?: string | null;
  is_pro_subscriber?: boolean | null;
}

export interface InvestorProfile extends BaseProfile {
  role: 'investor';
  buy_markets?: string[] | null;
  buy_property_types?: string[] | null;
  buy_price_min?: number | null;
  buy_price_max?: number | null;
  buy_strategy?: string | null;
  buy_condition?: string | null;
  capital_available?: number | null;
}

export interface WholesalerProfile extends BaseProfile {
  role: 'wholesaler';
  wholesale_markets?: string[] | null;
  deal_arbands?: string[] | null;
  deal_discount_target?: number | null;
  assignment_methods?: string[] | null;
  avg_days_to_buyer?: number | null;
}

export type AnyProfile = InvestorProfile | WholesalerProfile;

export interface ProfileCompletenessResult {
  score: number;
  missingKeys: string[];
}

const baseFields: Array<keyof BaseProfile> = [
  'full_name',
  'company_name',
  'profile_photo_url',
];

const trustFields: Array<keyof BaseProfile> = ['phone_verified', 'license_info'];

const investorFields: Array<keyof InvestorProfile> = [
  'buy_markets',
  'buy_property_types',
  'buy_price_min',
  'buy_price_max',
  'buy_strategy',
  'buy_condition',
  'capital_available',
];

const wholesalerFields: Array<keyof WholesalerProfile> = [
  'wholesale_markets',
  'deal_arbands',
  'deal_discount_target',
  'assignment_methods',
  'avg_days_to_buyer',
];

const groupWeights = {
  base: 30,
  trust: 20,
  role: 50,
} as const;

const arrayHasValues = (value?: string[] | null) => Array.isArray(value) && value.length > 0;

const numberIsSet = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const stringIsSet = (value?: string | null) => !!value && value.trim().length > 0;

export function getProfileCompleteness(profile: AnyProfile): ProfileCompletenessResult {
  let score = 0;
  const missingKeys: string[] = [];

  const baseWeightPerField = groupWeights.base / baseFields.length;
  baseFields.forEach((field) => {
    const value = profile[field] as string | null | undefined;
    if (stringIsSet(value)) {
      score += baseWeightPerField;
    } else {
      missingKeys.push(field);
    }
  });

  const trustWeightPerField = groupWeights.trust / trustFields.length;
  trustFields.forEach((field) => {
    const value = profile[field];
    if (field === 'phone_verified') {
      if (value) {
        score += trustWeightPerField;
      } else {
        missingKeys.push(field);
      }
    } else if (stringIsSet(value as string | null | undefined)) {
      score += trustWeightPerField;
    } else {
      missingKeys.push(field);
    }
  });

  const roleFields = profile.role === 'investor' ? investorFields : wholesalerFields;
  const roleWeightPerField = groupWeights.role / roleFields.length;
  roleFields.forEach((field) => {
    const value = (profile as unknown as Record<string, unknown>)[field as string];
    let filled = false;
    if (Array.isArray(value)) {
      filled = arrayHasValues(value as string[]);
    } else if (typeof value === 'number') {
      filled = numberIsSet(value as number);
    } else if (typeof value === 'string') {
      filled = stringIsSet(value as string);
    }

    if (filled) {
      score += roleWeightPerField;
    } else {
      missingKeys.push(field as string);
    }
  });

  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, missingKeys };
}


