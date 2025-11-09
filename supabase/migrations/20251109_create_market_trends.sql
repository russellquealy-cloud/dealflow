-- Market trends table populated from Redfin metro data
-- Created: 2025-11-09

CREATE TABLE IF NOT EXISTS public.market_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL,
  period_end date NOT NULL,
  median_sale_price numeric NOT NULL,
  homes_sold integer NULL,
  median_days_on_market integer NULL,
  avg_sale_to_list numeric NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT market_trends_region_period_unique UNIQUE(region, period_end)
);

CREATE TRIGGER market_trends_handle_updated_at
BEFORE UPDATE ON public.market_trends
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


