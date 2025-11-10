-- Profile enrichment for investor/wholesaler buy box and trust metadata

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_photo_url') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_photo_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
    ALTER TABLE public.profiles ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN phone_verified boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_pro_subscriber') THEN
    ALTER TABLE public.profiles ADD COLUMN is_pro_subscriber boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'license_info') THEN
    ALTER TABLE public.profiles ADD COLUMN license_info text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'buy_markets') THEN
    ALTER TABLE public.profiles ADD COLUMN buy_markets text[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'buy_property_types') THEN
    ALTER TABLE public.profiles ADD COLUMN buy_property_types text[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'buy_price_min') THEN
    ALTER TABLE public.profiles ADD COLUMN buy_price_min numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'buy_price_max') THEN
    ALTER TABLE public.profiles ADD COLUMN buy_price_max numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'buy_strategy') THEN
    ALTER TABLE public.profiles ADD COLUMN buy_strategy text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'buy_condition') THEN
    ALTER TABLE public.profiles ADD COLUMN buy_condition text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'capital_available') THEN
    ALTER TABLE public.profiles ADD COLUMN capital_available numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wholesale_markets') THEN
    ALTER TABLE public.profiles ADD COLUMN wholesale_markets text[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deal_arbands') THEN
    ALTER TABLE public.profiles ADD COLUMN deal_arbands text[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deal_discount_target') THEN
    ALTER TABLE public.profiles ADD COLUMN deal_discount_target numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'assignment_methods') THEN
    ALTER TABLE public.profiles ADD COLUMN assignment_methods text[] DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avg_days_to_buyer') THEN
    ALTER TABLE public.profiles ADD COLUMN avg_days_to_buyer integer;
  END IF;
END
$$;


