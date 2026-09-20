CREATE UNIQUE INDEX IF NOT EXISTS market_prices_unique_cols
  ON public.market_prices (crop, variety, market, location, observed_on, source)
  NULLS NOT DISTINCT;