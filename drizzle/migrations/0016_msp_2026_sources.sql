ALTER TABLE public.msp_rates ADD COLUMN IF NOT EXISTS source_url text;

INSERT INTO public.msp_rates (crop, season, msp, year, source, source_url) VALUES
  ('Wheat',   'Rabi',   2585, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2173566'),
  ('Gram',    'Rabi',   5875, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2173566'),
  ('Mustard', 'Rabi',   6200, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2173566'),
  ('Lentil',  'Rabi',   7000, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2173566'),
  ('Barley',  'Rabi',   2150, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2173566'),
  ('Paddy',   'Kharif', 2441, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618'),
  ('Maize',   'Kharif', 2410, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618'),
  ('Bajra',   'Kharif', 2900, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618'),
  ('Tur',     'Kharif', 8450, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618'),
  ('Moong',   'Kharif', 8780, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618'),
  ('Urad',    'Kharif', 8200, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618'),
  ('Soybean', 'Kharif', 5708, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618'),
  ('Cotton',  'Kharif', 8267, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618'),
  ('Groundnut','Kharif',7517, '2026-27', 'pib', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618')
ON CONFLICT (crop, season, year) DO UPDATE SET msp = EXCLUDED.msp, source = EXCLUDED.source, source_url = EXCLUDED.source_url;

UPDATE public.msp_rates SET source_url = 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2173566' WHERE season = 'Rabi' AND source_url IS NULL;
UPDATE public.msp_rates SET source_url = 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260618' WHERE season = 'Kharif' AND source_url IS NULL;
UPDATE public.msp_rates SET source_url = 'https://farmer.gov.in/mspstatements.aspx' WHERE source_url IS NULL;