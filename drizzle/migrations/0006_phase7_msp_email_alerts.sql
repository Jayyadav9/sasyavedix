CREATE TABLE public.msp_rates (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  season text not null,
  msp numeric not null,
  year text not null default '2025-26',
  source text not null default 'cacp',
  created_at timestamptz not null default now(),
  unique (crop, season, year)
);
GRANT SELECT ON public.msp_rates TO anon, authenticated;
GRANT ALL ON public.msp_rates TO service_role;
ALTER TABLE public.msp_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp readable" ON public.msp_rates FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.price_alerts ADD COLUMN IF NOT EXISTS notify_email boolean not null default false;