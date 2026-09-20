CREATE TABLE public.farm_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  acres numeric NOT NULL,
  village text,
  district text,
  soil_type text,
  irrigation text DEFAULT 'rainfed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_fields TO authenticated;
GRANT ALL ON public.farm_fields TO service_role;
ALTER TABLE public.farm_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers manage their fields"
  ON public.farm_fields FOR ALL TO authenticated
  USING (farmer_id = auth.uid()) WITH CHECK (farmer_id = auth.uid());

ALTER TABLE public.crop_plans ADD COLUMN field_id uuid REFERENCES public.farm_fields(id) ON DELETE SET NULL;
ALTER TABLE public.farm_expenses ADD COLUMN field_id uuid REFERENCES public.farm_fields(id) ON DELETE SET NULL;
CREATE INDEX idx_crop_plans_field ON public.crop_plans(field_id);
CREATE INDEX idx_farm_expenses_field ON public.farm_expenses(field_id);