ALTER TABLE public.crop_plans
  ADD COLUMN actual_yield_quintal numeric,
  ADD COLUMN harvested_on date;