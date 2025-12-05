'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import UserAnalyticsDashboard from '@/components/UserAnalyticsDashboard';
import type { UserAnalytics } from '@/lib/analytics';
import Link from 'next/link';
import type { SubscriptionTier } from '@/lib/stripe';
import { getProfileCompleteness, type AnyProfile, type UserRole, type ProfileCompletenessResult } from '@/lib/profileCompleteness';

// AI Usage Panel Component
function AIUsagePanel({ user }: { user: { id: string; email?: string } | null }) {
  const [usage, setUsage] = useState<{
    used: number;
    limit: number | null;
    remaining: number | null;
    resetsOn: string;
    tier?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadUsage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const headers: HeadersInit = {};
        if (session.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/ai-usage', {
          headers,
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error('Failed to load AI usage');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setUsage(data);
      } catch (error) {
        console.error('Error loading AI usage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [user]);

  if (loading) {
    return (
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        background: '#fff'
      }}>
        <div style={{ color: '#64748b' }}>Loading AI usage...</div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const isUnlimited = usage.limit === null;
  const limit = usage.limit ?? 0;
  const percentageUsed = isUnlimited ? 0 : limit > 0 ? (usage.used / limit) * 100 : 0;
  const isLowRemaining = !isUnlimited && usage.remaining !== null && usage.limit !== null && (usage.remaining / limit) < 0.2;
  const resetsDate = new Date(usage.resetsOn);
  const resetsFormatted = resetsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{
      border: isLowRemaining ? '1px solid #f59e0b' : '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 24,
      marginBottom: 24,
      background: isLowRemaining ? '#fffbeb' : '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>AI Usage</h2>
        {isLowRemaining && (
          <span style={{
            padding: '4px 12px',
            borderRadius: 12,
            background: '#fef3c7',
            color: '#92400e',
            fontSize: 12,
            fontWeight: 600
          }}>
            ⚠️ Low Remaining
          </span>
        )}
      </div>

      {isUnlimited ? (
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#059669', marginBottom: 8 }}>
            Unlimited
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
            You have unlimited AI analyses on your current plan.
          </p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: isLowRemaining ? '#dc2626' : '#1f2937' }}>
                {usage.used}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>of {usage.limit} used</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: isLowRemaining ? '#dc2626' : '#059669' }}>
                {usage.remaining}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>remaining</div>
            </div>
          </div>

          <div style={{ height: 8, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden', marginBottom: 12 }}>
            <div
              style={{
                width: `${Math.min(100, percentageUsed)}%`,
                height: '100%',
                background: isLowRemaining ? '#f59e0b' : percentageUsed > 80 ? '#dc2626' : '#059669',
                borderRadius: 999,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {isLowRemaining && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              marginBottom: 12
            }}>
              <p style={{ margin: 0, fontSize: 14, color: '#92400e', fontWeight: 500 }}>
                ⚠️ You have less than 20% of your AI usage remaining. Consider upgrading your plan for more analyses.
              </p>
            </div>
          )}

          <div style={{ fontSize: 13, color: '#6b7280' }}>
            Resets on {resetsFormatted}
          </div>
        </div>
      )}
    </div>
  );
}

const sectionStyle: CSSProperties = {
  marginTop: 24,
  padding: 16,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 12,
};

const fieldRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 12,
};

const badgeRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
};

const badgeBaseStyle: CSSProperties = {
  fontSize: 11,
  padding: '4px 8px',
  borderRadius: 999,
  border: '1px solid #cbd5f5',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontWeight: 500,
};

const propertyTypeOptions = ['SFR', 'Duplex', 'Triplex', '4-Plex', 'Small MF (5-20)', 'Land', 'Other'] as const;
const strategyOptions = ['Flip', 'BRRRR', 'Buy-and-Hold', 'Wholesale', 'Other'] as const;
const conditionOptions = ['Light Rehab', 'Medium Rehab', 'Heavy Rehab', 'Full Gut'] as const;

const wholesalerArvOptions = ['<150k', '150–300k', '300–500k', '500k+'] as const;
const assignmentOptions = ['Assignment', 'Double Close', 'Novation', 'Wholetail'] as const;

const chipRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid #cbd5f5',
  background: '#fff',
  color: '#1e3a8a',
  fontSize: 12,
  cursor: 'pointer',
};

const chipSelectedStyle: CSSProperties = {
  ...chipStyle,
  border: '1px solid #2563eb',
  background: '#dbeafe',
  color: '#1d4ed8',
};

const missingKeyLabels: Record<string, string> = {
  full_name: 'Add your name',
  company_name: 'Add your company name',
  profile_photo_url: 'Upload a profile photo',
  phone_verified: 'Verify your phone number',
  license_info: 'Add license information',
  buy_markets: 'Define your target buy markets',
  buy_property_types: 'Select buy box property types',
  buy_price_min: 'Set minimum buy price',
  buy_price_max: 'Set maximum buy price',
  buy_strategy: 'Choose a buy strategy',
  buy_condition: 'Specify preferred property condition',
  capital_available: 'Provide available capital',
  wholesale_markets: 'List your wholesaling markets',
  deal_arbands: 'Select typical ARV bands',
  deal_discount_target: 'Enter your discount target',
  assignment_methods: 'Select assignment methods',
  avg_days_to_buyer: 'Indicate average days to find buyer',
};

type ProfileFormState = {
  full_name: string;
  company_name: string;
  profile_photo_url: string;
  license_info: string;
  buy_markets: string[];
  buy_property_types: string[];
  buy_price_min: string;
  buy_price_max: string;
  buy_strategy: string;
  buy_condition: string;
  capital_available: string;
  wholesale_markets: string[];
  deal_arbands: string[];
  deal_discount_target: string;
  assignment_methods: string[];
  avg_days_to_buyer: string;
};

const emptyFormState: ProfileFormState = {
  full_name: '',
  company_name: '',
  profile_photo_url: '',
  license_info: '',
  buy_markets: [],
  buy_property_types: [],
  buy_price_min: '',
  buy_price_max: '',
  buy_strategy: '',
  buy_condition: '',
  capital_available: '',
  wholesale_markets: [],
  deal_arbands: [],
  deal_discount_target: '',
  assignment_methods: [],
  avg_days_to_buyer: '',
};

function parseNumberFromString(value: string): number | null {
  if (!value) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : item != null ? String(item).trim() : ''))
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  return [];
}

function buildCompletenessProfile(
  role: UserRole,
  id: string,
  state: ProfileFormState,
  extras: {
    phone_verified?: boolean | null;
    license_info?: string | null;
    profile_photo_url?: string | null;
    company_name?: string | null;
    full_name?: string | null;
    is_pro_subscriber?: boolean | null;
  }
): AnyProfile {
  const base = {
    id,
    role,
    full_name: state.full_name || extras.full_name || null,
    company_name: state.company_name || extras.company_name || null,
    profile_photo_url: state.profile_photo_url || extras.profile_photo_url || null,
    phone_verified: extras.phone_verified ?? null,
    license_info: state.license_info || extras.license_info || null,
    is_pro_subscriber: extras.is_pro_subscriber ?? null,
  };

  if (role === 'investor') {
    return {
      ...base,
      role: 'investor',
      buy_markets: state.buy_markets,
      buy_property_types: state.buy_property_types,
      buy_price_min: parseNumberFromString(state.buy_price_min),
      buy_price_max: parseNumberFromString(state.buy_price_max),
      buy_strategy: state.buy_strategy || null,
      buy_condition: state.buy_condition || null,
      capital_available: parseNumberFromString(state.capital_available),
    };
  }

  return {
    ...base,
    role: 'wholesaler',
    wholesale_markets: state.wholesale_markets,
    deal_arbands: state.deal_arbands,
    deal_discount_target: parseNumberFromString(state.deal_discount_target),
    assignment_methods: state.assignment_methods,
    avg_days_to_buyer: parseNumberFromString(state.avg_days_to_buyer),
  };
}

// Helper function to get plan name and features (client-side safe)
function getPlanInfo(segment?: string, tier?: string): { name: string; tier: SubscriptionTier; features: string[] } {
  const segmentUpper = segment?.toUpperCase() || 'INVESTOR';
  const tierUpper = tier?.toUpperCase() || 'FREE';
  
  let subscriptionTier: SubscriptionTier = 'free';
  let planName = 'Free';
  const features: string[] = [];
  
  if (tierUpper === 'FREE') {
    subscriptionTier = 'free';
    planName = 'Free';
    features.push('Browse listings');
    features.push('View basic property details');
  } else if (segmentUpper === 'INVESTOR' && tierUpper === 'BASIC') {
    subscriptionTier = 'basic';
    planName = 'Investor Basic';
    features.push('Unlimited listing views');
    features.push('Contact property owners');
    features.push('10 AI analyses per month');
    features.push('Save favorites & watchlists');
    features.push('Property alerts');
    features.push('Map drawing tools');
    features.push('Satellite view');
  } else if (segmentUpper === 'INVESTOR' && tierUpper === 'PRO') {
    subscriptionTier = 'pro';
    planName = 'Investor Pro';
    features.push('Everything in Basic');
    features.push('Unlimited AI analyses');
    features.push('Export reports (CSV/PDF)');
    features.push('Custom alerts');
    features.push('Advanced analytics');
    features.push('Priority support');
    features.push('API access');
  } else if (segmentUpper === 'WHOLESALER' && tierUpper === 'BASIC') {
    subscriptionTier = 'basic';
    planName = 'Wholesaler Basic';
    features.push('Post up to 10 listings/month');
    features.push('Basic analytics (views, saves)');
    features.push('Property insights');
    features.push('Contact tracking');
    features.push('Email support');
  } else if (segmentUpper === 'WHOLESALER' && tierUpper === 'PRO') {
    subscriptionTier = 'pro';
    planName = 'Wholesaler Pro';
    features.push('Post up to 30 listings/month');
    features.push('AI repair estimator');
    features.push('Investor demand heatmaps');
    features.push('Featured placement');
    features.push('Verified badge');
    features.push('Investor chat');
    features.push('Advanced analytics');
    features.push('Priority support');
  }
  
  return { name: planName, tier: subscriptionTier, features };
}

// Helper to get next tier for upgrade
function getNextTier(segment?: string, tier?: string): { name: string; href: string } | null {
  const segmentUpper = segment?.toUpperCase() || 'INVESTOR';
  const tierUpper = tier?.toUpperCase() || 'FREE';
  
  if (tierUpper === 'FREE') {
    if (segmentUpper === 'INVESTOR') {
      return { name: 'Investor Basic', href: '/pricing?segment=investor&tier=basic' };
    } else {
      return { name: 'Wholesaler Basic', href: '/pricing?segment=wholesaler&tier=basic' };
    }
  } else if (tierUpper === 'BASIC') {
    if (segmentUpper === 'INVESTOR') {
      return { name: 'Investor Pro', href: '/pricing?segment=investor&tier=pro' };
    } else {
      return { name: 'Wholesaler Pro', href: '/pricing?segment=wholesaler&tier=pro' };
    }
  }
  
  return null;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ 
    id?: string;
    role?: string;
    segment?: string;
    tier?: string;
    membership_tier?: string; 
    company_name?: string | null;
    full_name?: string | null;
    verified?: boolean;
    phone_verified?: boolean | null;
    profile_photo_url?: string | null;
    license_info?: string | null;
    buy_markets?: string[] | null;
    buy_property_types?: string[] | null;
    buy_price_min?: number | null;
    buy_price_max?: number | null;
    buy_strategy?: string | null;
    buy_condition?: string | null;
    capital_available?: number | null;
    wholesale_markets?: string[] | null;
    deal_arbands?: string[] | null;
    deal_discount_target?: number | null;
    assignment_methods?: string[] | null;
    avg_days_to_buyer?: number | null;
    is_pro_subscriber?: boolean | null;
  } | null>(null);
  const [analyticsStats, setAnalyticsStats] = useState<UserAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isProTier, setIsProTier] = useState(false);
  const [formState, setFormState] = useState<ProfileFormState>(emptyFormState);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState<ProfileCompletenessResult | null>(null);
  const profileRole = ((profile?.segment || profile?.role) ?? 'investor') as UserRole;
  const completenessScore = completeness?.score ?? 0;
  const strengthLabel =
    completenessScore >= 80 ? 'Strong' : completenessScore >= 50 ? 'Good' : 'Needs work';
  const strengthColor =
    completenessScore >= 80 ? '#15803d' : completenessScore >= 50 ? '#1d4ed8' : '#b91c1c';

  const nextSteps = useMemo(() => {
    if (!completeness) return [];
    return completeness.missingKeys
      .map((key) => missingKeyLabels[key] ?? key)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .slice(0, 4);
  }, [completeness]);

  const badgeStyles = useMemo(() => {
    const roleBadge =
      profileRole === 'wholesaler'
        ? { ...badgeBaseStyle, border: '1px solid #f59e0b', background: '#fef3c7', color: '#b45309' }
        : { ...badgeBaseStyle, border: '1px solid #60a5fa', background: '#dbeafe', color: '#1d4ed8' };
    const proBadge = { ...badgeBaseStyle, border: '1px solid #c084fc', background: '#f3e8ff', color: '#7c3aed' };
    const verifiedBadge = { ...badgeBaseStyle, border: '1px solid #34d399', background: '#d1fae5', color: '#047857' };
    const licenseBadge = { ...badgeBaseStyle, border: '1px solid #fca5a5', background: '#fee2e2', color: '#b91c1c' };
    return { roleBadge, proBadge, verifiedBadge, licenseBadge };
  }, [profileRole]);

  const badges = useMemo(() => {
    const items: Array<{ label: string; style: React.CSSProperties }> = [];
    items.push({
      label: profileRole === 'wholesaler' ? 'Wholesaler' : 'Investor',
      style: badgeStyles.roleBadge,
    });
    if (profile?.is_pro_subscriber) {
      items.push({ label: 'Pro Subscriber', style: badgeStyles.proBadge });
    }
    if (profile?.phone_verified) {
      items.push({ label: 'Phone Verified', style: badgeStyles.verifiedBadge });
    }
    if (profile?.license_info) {
      items.push({ label: 'License on File', style: badgeStyles.licenseBadge });
    }
    return items;
  }, [badgeStyles, profile, profileRole]);

  const hydrateProfileState = (profileRecord: Record<string, unknown> | null, sessionUserId: string) => {
    const role = ((profileRecord?.segment || profileRecord?.role) ?? 'investor') as UserRole;
    const buyPriceMinValue = profileRecord?.buy_price_min as number | string | null | undefined;
    const buyPriceMaxValue = profileRecord?.buy_price_max as number | string | null | undefined;
    const capitalValue = profileRecord?.capital_available as number | string | null | undefined;
    const dealDiscountValue = profileRecord?.deal_discount_target as number | string | null | undefined;
    const avgDaysValue = profileRecord?.avg_days_to_buyer as number | string | null | undefined;
    const nextFormState: ProfileFormState = {
      full_name: (profileRecord?.full_name as string) ?? '',
      company_name: (profileRecord?.company_name as string) ?? '',
      profile_photo_url: (profileRecord?.profile_photo_url as string) ?? '',
      license_info: (profileRecord?.license_info as string) ?? '',
      buy_markets: toStringArray(profileRecord?.buy_markets),
      buy_property_types: toStringArray(profileRecord?.buy_property_types),
      buy_price_min: buyPriceMinValue != null ? String(buyPriceMinValue) : '',
      buy_price_max: buyPriceMaxValue != null ? String(buyPriceMaxValue) : '',
      buy_strategy: (profileRecord?.buy_strategy as string) ?? '',
      buy_condition: (profileRecord?.buy_condition as string) ?? '',
      capital_available: capitalValue != null ? String(capitalValue) : '',
      wholesale_markets: toStringArray(profileRecord?.wholesale_markets),
      deal_arbands: toStringArray(profileRecord?.deal_arbands),
      deal_discount_target: dealDiscountValue != null ? String(dealDiscountValue) : '',
      assignment_methods: toStringArray(profileRecord?.assignment_methods),
      avg_days_to_buyer: avgDaysValue != null ? String(avgDaysValue) : '',
    };
    setFormState(nextFormState);
    const completenessProfile = buildCompletenessProfile(role, profileRecord?.id ? String(profileRecord.id) : sessionUserId, nextFormState, {
      phone_verified: (profileRecord?.phone_verified as boolean | null) ?? null,
      license_info: (profileRecord?.license_info as string) ?? null,
      profile_photo_url: (profileRecord?.profile_photo_url as string) ?? null,
      company_name: (profileRecord?.company_name as string) ?? null,
      full_name: (profileRecord?.full_name as string) ?? null,
      is_pro_subscriber: (profileRecord?.is_pro_subscriber as boolean | null) ?? null,
    });
    setCompleteness(getProfileCompleteness(completenessProfile));
  };

  const handleTextFieldChange =
    (field: Exclude<keyof ProfileFormState, 'buy_markets' | 'buy_property_types' | 'wholesale_markets' | 'deal_arbands' | 'assignment_methods'>) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { value } = event.target;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

  const handleArrayInputChange =
    (field: 'buy_markets' | 'wholesale_markets') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      const items = value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      setFormState((prev) => ({ ...prev, [field]: items }));
    };

  const toggleOption = (
    field: 'buy_property_types' | 'deal_arbands' | 'assignment_methods',
    option: string
  ) => {
    setFormState((prev) => {
      const current = new Set(prev[field]);
      if (current.has(option)) {
        current.delete(option);
      } else {
        current.add(option);
      }
      return { ...prev, [field]: Array.from(current) };
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Account load timeout - setting loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        if (!session) {
          clearTimeout(timeoutId);
          router.push('/login?next=/account');
          return;
        }
        
        setUser(session.user);
        
        // Load user profile with error handling
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Profile error:', profileError);
          // Create a basic profile if none exists
          if (profileError.code === 'PGRST116') {
            console.log('No profile found, creating basic profile...');
            try {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  role: 'investor',
                  segment: 'investor',
                  tier: 'free',
                  membership_tier: 'free',
                  verified: false
                })
                .select()
                .single();
              if (createError) {
                console.error('Error creating profile:', createError);
                const fallbackProfile = {
                  id: session.user.id,
                  role: 'investor',
                  segment: 'investor',
                  tier: 'free',
                  membership_tier: 'free',
                };
                setProfile(fallbackProfile);
                hydrateProfileState(fallbackProfile, session.user.id);
              } else {
                console.log('Profile loaded:', newProfile);
                setProfile(newProfile);
                hydrateProfileState(newProfile, session.user.id);
              }
            } catch (createErr) {
              console.error('Exception creating profile:', createErr);
              const fallbackProfile = {
                id: session.user.id,
                role: 'investor',
                segment: 'investor',
                tier: 'free',
                membership_tier: 'free',
              };
              setProfile(fallbackProfile);
              hydrateProfileState(fallbackProfile, session.user.id);
            }
          } else {
            // Other error - set default profile
            console.error('Unexpected profile error:', profileError);
            const fallbackProfile = {
              id: session.user.id,
              role: 'investor',
              segment: 'investor',
              tier: 'free',
              membership_tier: 'free',
            };
            setProfile(fallbackProfile);
            hydrateProfileState(fallbackProfile, session.user.id);
          }
        } else {
          console.log('Profile loaded successfully:', profileData);
          console.log('Segment:', profileData?.segment, 'Tier:', profileData?.tier);
          setProfile(profileData);
          const tierValue = (profileData?.tier || profileData?.membership_tier || '').toLowerCase();
          setIsProTier(tierValue.includes('pro') || tierValue.includes('enterprise'));

          hydrateProfileState(profileData, session.user.id);

          try {
            setAnalyticsLoading(true);
            setAnalyticsError(null);

            const headers: HeadersInit = {};
            if (session.access_token) {
              headers.Authorization = `Bearer ${session.access_token}`;
            }

            const response = await fetch('/api/analytics', {
              headers,
              credentials: 'include',
              cache: 'no-store',
            });

            if (!response.ok) {
              const text = await response.text().catch(() => '');
              throw new Error(`Analytics fetch failed: ${response.status} ${text}`);
            }

            const data = await response.json();
            setAnalyticsStats(data.stats);
            setIsProTier(data.isPro);
          } catch (analyticsError) {
            console.error('Error loading analytics:', analyticsError);
            setAnalyticsStats(null);
            setAnalyticsError('Analytics unavailable right now.');
          } finally {
            setAnalyticsLoading(false);
          }
        }
        
        setLoading(false);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Account loading error:', err);
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const role = ((profile?.segment || profile?.role) ?? 'investor') as UserRole;
    const completenessProfile = buildCompletenessProfile(role, profile?.id ?? user.id, formState, {
      phone_verified: profile?.phone_verified ?? null,
      license_info: formState.license_info || (profile?.license_info ?? null),
      profile_photo_url: formState.profile_photo_url || (profile?.profile_photo_url ?? null),
      company_name: formState.company_name || (profile?.company_name ?? null),
      full_name: formState.full_name || (profile?.full_name ?? null),
      is_pro_subscriber: profile?.is_pro_subscriber ?? null,
    });
    setCompleteness(getProfileCompleteness(completenessProfile));
  }, [formState, profile, user]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setSaveMessage(null);
    try {
      const updates = {
        full_name: formState.full_name || null,
        company_name: formState.company_name || null,
        profile_photo_url: formState.profile_photo_url || null,
        license_info: formState.license_info || null,
        buy_markets: formState.buy_markets,
        buy_property_types: formState.buy_property_types,
        buy_price_min: parseNumberFromString(formState.buy_price_min),
        buy_price_max: parseNumberFromString(formState.buy_price_max),
        buy_strategy: formState.buy_strategy || null,
        buy_condition: formState.buy_condition || null,
        capital_available: parseNumberFromString(formState.capital_available),
        wholesale_markets: formState.wholesale_markets,
        deal_arbands: formState.deal_arbands,
        deal_discount_target: parseNumberFromString(formState.deal_discount_target),
        assignment_methods: formState.assignment_methods,
        avg_days_to_buyer: parseNumberFromString(formState.avg_days_to_buyer),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error', error);
        setSaveMessage('Failed to save profile changes.');
      } else {
        setSaveMessage('Profile updated successfully.');
        setProfile((prev) => {
          const merged = { ...(prev ?? {}), ...updates, id: prev?.id ?? user.id };
          hydrateProfileState(merged, user.id);
          return merged;
        });
      }
    } catch (error) {
      console.error('Profile save exception', error);
      setSaveMessage('Unexpected error saving profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const newPassword = prompt('Enter your new password:');
    if (!newPassword) {
      return; // User cancelled
    }
    
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    const confirmPassword = prompt('Confirm your new password:');
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('Password update error:', error);
        alert(`Failed to update password: ${error.message}`);
        return;
      }
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Password update exception:', error);
      alert('Failed to update password. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 65px)' }}>
        <div>Loading account...</div>
      </div>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Link 
          href="/listings" 
          style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8,
            background: '#0ea5e9',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: 16
          }}
        >
          ← Back to Listings
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Account Settings</h1>
        <Link 
          href="/settings/notifications" 
          style={{
            padding: '10px 20px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            color: '#374151',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🔔 Notification Preferences
        </Link>
      </div>

      {profile && completeness && (
        <div style={{ ...sectionStyle, marginTop: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, color: '#4b5563', fontWeight: 500 }}>Profile strength</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: strengthColor }}>
                {completenessScore}% · {strengthLabel}
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${completenessScore}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2563eb, #22d3ee)',
                    borderRadius: 999,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {badges.length > 0 && (
              <div style={badgeRowStyle}>
                {badges.map((badge) => (
                  <span key={badge.label} style={badge.style}>
                    {badge.label}
                  </span>
                ))}
              </div>
            )}

            {nextSteps.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                  Next best steps
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#4b5563', fontSize: 13, lineHeight: 1.6 }}>
                  {nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Info & Profile Form */}
      <form
        onSubmit={handleProfileSubmit}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Profile Information</h2>
        <div style={fieldRowStyle}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Email</label>
          <div
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              background: '#f9fafb',
              color: '#4b5563',
              fontSize: 14,
            }}
          >
            {user?.email}
          </div>
        </div>

        <div style={fieldRowStyle}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Full name</label>
          <input
            type="text"
            value={formState.full_name}
            onChange={handleTextFieldChange('full_name')}
            placeholder="Jane Doe"
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
          />
        </div>

        <div style={fieldRowStyle}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Company name</label>
          <input
            type="text"
            value={formState.company_name}
            onChange={handleTextFieldChange('company_name')}
            placeholder="Off Axis Capital"
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
          />
        </div>

        <div style={fieldRowStyle}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>Profile photo URL</label>
          <input
            type="url"
            value={formState.profile_photo_url}
            onChange={handleTextFieldChange('profile_photo_url')}
            placeholder="https://..."
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
          />
        </div>

        <div style={fieldRowStyle}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>License info (optional)</label>
          <input
            type="text"
            value={formState.license_info}
            onChange={handleTextFieldChange('license_info')}
            placeholder="e.g. CA DRE #123456"
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
          />
        </div>

        <div style={{ fontSize: 12, color: '#6b7280' }}>
          Phone verification is handled through our onboarding team.
          {profile?.phone_verified ? ' ✅ Verified.' : ' Not verified yet.'}
        </div>

        {profileRole === 'investor' ? (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Buy Box</div>
            <div style={fieldRowStyle}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Markets</label>
              <textarea
                value={formState.buy_markets.join(', ')}
                onChange={handleArrayInputChange('buy_markets')}
                placeholder="Comma-separated cities, counties, or ZIPs"
                rows={2}
                style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14, resize: 'vertical' }}
              />
              <span style={{ fontSize: 12, color: '#6b7280' }}>Example: Phoenix AZ, Maricopa County, 85224</span>
            </div>

            <div style={fieldRowStyle}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Property types</label>
              <div style={chipRowStyle}>
                {propertyTypeOptions.map((option) => {
                  const selected = formState.buy_property_types.includes(option);
                  return (
                    <label
                      key={option}
                      style={selected ? chipSelectedStyle : chipStyle}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOption('buy_property_types', option)}
                        style={{ display: 'none' }}
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ ...fieldRowStyle, flex: '1 1 160px', marginBottom: 0 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Min price</label>
                <input
                  type="number"
                  value={formState.buy_price_min}
                  onChange={handleTextFieldChange('buy_price_min')}
                  placeholder="50000"
                  style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
                />
              </div>
              <div style={{ ...fieldRowStyle, flex: '1 1 160px', marginBottom: 0 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Max price</label>
                <input
                  type="number"
                  value={formState.buy_price_max}
                  onChange={handleTextFieldChange('buy_price_max')}
                  placeholder="500000"
                  style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ ...fieldRowStyle, flex: '1 1 200px', marginBottom: 0 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Strategy</label>
                <select
                  value={formState.buy_strategy}
                  onChange={handleTextFieldChange('buy_strategy')}
                  style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
                >
                  <option value="">Select strategy</option>
                  {strategyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ ...fieldRowStyle, flex: '1 1 200px', marginBottom: 0 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Condition</label>
                <select
                  value={formState.buy_condition}
                  onChange={handleTextFieldChange('buy_condition')}
                  style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
                >
                  <option value="">Select condition</option>
                  {conditionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={fieldRowStyle}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Capital available (USD)</label>
              <input
                type="number"
                value={formState.capital_available}
                onChange={handleTextFieldChange('capital_available')}
                placeholder="250000"
                style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
              />
            </div>
          </div>
        ) : (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Deal Profile</div>
            <div style={fieldRowStyle}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Markets</label>
              <textarea
                value={formState.wholesale_markets.join(', ')}
                onChange={handleArrayInputChange('wholesale_markets')}
                placeholder="Comma-separated cities or counties"
                rows={2}
                style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14, resize: 'vertical' }}
              />
            </div>

            <div style={fieldRowStyle}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Typical ARV bands</label>
              <div style={chipRowStyle}>
                {wholesalerArvOptions.map((option) => {
                  const selected = formState.deal_arbands.includes(option);
                  return (
                    <label key={option} style={selected ? chipSelectedStyle : chipStyle}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOption('deal_arbands', option)}
                        style={{ display: 'none' }}
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={fieldRowStyle}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Discount target (% below ARV)</label>
              <input
                type="number"
                value={formState.deal_discount_target}
                onChange={handleTextFieldChange('deal_discount_target')}
                placeholder="15"
                style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
              />
            </div>

            <div style={fieldRowStyle}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Assignment methods</label>
              <div style={chipRowStyle}>
                {assignmentOptions.map((option) => {
                  const selected = formState.assignment_methods.includes(option);
                  return (
                    <label key={option} style={selected ? chipSelectedStyle : chipStyle}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOption('assignment_methods', option)}
                        style={{ display: 'none' }}
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={fieldRowStyle}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Average days to find buyer</label>
              <input
                type="number"
                value={formState.avg_days_to_buyer}
                onChange={handleTextFieldChange('avg_days_to_buyer')}
                placeholder="14"
                style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5f5', fontSize: 14 }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="submit"
            disabled={savingProfile}
            style={{
              alignSelf: 'flex-start',
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              background: savingProfile ? '#9ca3af' : '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: savingProfile ? 'not-allowed' : 'pointer',
            }}
          >
            {savingProfile ? 'Saving...' : 'Save profile'}
          </button>
          {saveMessage && (
            <span style={{ fontSize: 13, color: saveMessage.includes('successfully') ? '#15803d' : '#b91c1c' }}>
              {saveMessage}
            </span>
          )}
        </div>
      </form>

      {/* AI Usage */}
      <AIUsagePanel user={user} />

      {/* Subscription Level */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        background: '#fff'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Subscription</h2>
        {(() => {
          const planInfo = getPlanInfo(profile?.segment, profile?.tier);
          const nextTier = getNextTier(profile?.segment, profile?.tier);
          const isFree = (profile?.tier?.toUpperCase() || 'FREE') === 'FREE';
          const isBasic = (profile?.tier?.toUpperCase() || '') === 'BASIC';
          
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  padding: '4px 12px', 
                  borderRadius: 20, 
                  background: isFree ? '#6b7280' : isBasic ? '#3b82f6' : '#10b981', 
                  color: '#fff', 
                  fontSize: 14, 
                  fontWeight: 600 
                }}>
                  {planInfo.name}
                </div>
                {nextTier && (
                  <span style={{ color: '#6b7280', fontSize: 14 }}>
                    Upgrade to {nextTier.name} for more features
                  </span>
                )}
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Current Plan Features</h3>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#374151', fontSize: 14, lineHeight: 1.8 }}>
                  {planInfo.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              {nextTier && (
                <Link 
                  href={nextTier.href}
                  style={{ 
                    display: 'inline-block',
                    marginTop: 16,
                    padding: '10px 20px', 
                    border: '1px solid #3b82f6', 
                    borderRadius: 8, 
                    background: '#3b82f6', 
                    color: '#fff', 
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  Upgrade to {nextTier.name} →
                </Link>
              )}
            </>
          );
        })()}
      </div>

      {/* Profile Type */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        background: '#fff'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Profile Type</h2>
        {profile ? (
          <div>
            <div style={{ 
              padding: '8px 16px', 
              borderRadius: 8, 
              background: (profile.segment || profile.role) === 'wholesaler' ? '#fef3c7' : '#dbeafe',
              color: (profile.segment || profile.role) === 'wholesaler' ? '#92400e' : '#1e40af',
              fontWeight: 600,
              display: 'inline-block',
              marginBottom: 16
            }}>
              {(profile.segment || profile.role) === 'wholesaler' ? '🏠 Wholesaler' : '💰 Investor'}
            </div>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
              {(profile.segment || profile.role) === 'wholesaler' 
                ? 'You can post deals and find investors for your properties.'
                : 'You can browse deals and find investment opportunities.'
              }
            </p>
          </div>
        ) : (
          <div>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>No profile type set. Choose your role:</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link 
                href="/portal/wholesaler"
                style={{ 
                  padding: '12px 24px', 
                  border: '1px solid #f59e0b', 
                  borderRadius: 8, 
                  background: '#fef3c7', 
                  color: '#92400e', 
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                🏠 Wholesaler
              </Link>
              <Link 
                href="/portal/investor"
                style={{ 
                  padding: '12px 24px', 
                  border: '1px solid #3b82f6', 
                  borderRadius: 8, 
                  background: '#dbeafe', 
                  color: '#1e40af', 
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                💰 Investor
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Analytics */}
      {(() => {
        if (analyticsLoading) {
          return (
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
                background: '#fff',
              }}
            >
              <div style={{ color: '#64748b' }}>Loading analytics…</div>
            </div>
          );
        }

        if (analyticsError) {
          return (
            <div
              style={{
                border: '1px solid #fee2e2',
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
                background: '#fff5f5',
                color: '#b91c1c',
              }}
            >
              {analyticsError}
            </div>
          );
        }

        if (!analyticsStats) {
          return null;
        }

        return (
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
              background: '#fff',
            }}
          >
            <UserAnalyticsDashboard stats={analyticsStats} isPro={isProTier} userProfile={profile} />
          </div>
        );
      })()}

      {/* Account Actions */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 12, 
        padding: 24, 
        marginBottom: 24,
        background: '#fff'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Account Actions</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button 
            onClick={handleChangePassword}
            style={{ 
              padding: '8px 16px', 
              border: '1px solid #6b7280', 
              borderRadius: 8, 
              background: '#fff', 
              color: '#374151', 
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Change Password
          </button>
          <Link
            href="/profile"
            style={{ 
              padding: '8px 16px', 
              border: '1px solid #6b7280', 
              borderRadius: 8, 
              background: '#fff', 
              color: '#374151', 
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Update Profile
          </Link>
          <Link
            href="/billing"
            style={{ 
              padding: '8px 16px', 
              border: '1px solid #6b7280', 
              borderRadius: 8, 
              background: '#fff', 
              color: '#374151', 
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Manage Billing
          </Link>
          <button 
            onClick={handleSignOut}
            style={{ 
              padding: '8px 16px', 
              border: '1px solid #dc2626', 
              borderRadius: 8, 
              background: '#dc2626', 
              color: '#fff', 
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
