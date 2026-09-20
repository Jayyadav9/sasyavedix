CREATE TABLE public.soil_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sample_date date NOT NULL DEFAULT current_date,
  location text,
  ph numeric NOT NULL,
  nitrogen numeric NOT NULL,
  phosphorus numeric NOT NULL,
  potassium numeric NOT NULL,
  organic_carbon numeric,
  ec numeric,
  target_crop text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soil_tests TO authenticated;
GRANT ALL ON public.soil_tests TO service_role;

ALTER TABLE public.soil_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers manage own soil tests" ON public.soil_tests
  FOR ALL TO authenticated
  USING (auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers read own crop images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'crop-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Farmers upload own crop images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crop-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Farmers delete own crop images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'crop-images' AND (storage.foldername(name))[1] = auth.uid()::text);