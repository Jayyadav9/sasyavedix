CREATE UNIQUE INDEX IF NOT EXISTS market_prices_unique_obs
  ON public.market_prices (crop, COALESCE(variety, ''), market, location, observed_on, source);