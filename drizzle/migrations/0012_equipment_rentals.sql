CREATE TABLE public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'tractor',
  rate_per_day numeric NOT NULL,
  location text,
  district text,
  description text,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment TO authenticated;
GRANT ALL ON public.equipment TO service_role;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can browse equipment"
  ON public.equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners manage their equipment"
  ON public.equipment FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE public.equipment_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  days int NOT NULL DEFAULT 1,
  total_amount numeric NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_bookings TO authenticated;
GRANT ALL ON public.equipment_bookings TO service_role;
ALTER TABLE public.equipment_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties see their bookings"
  ON public.equipment_bookings FOR SELECT TO authenticated
  USING (farmer_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Farmers request bookings"
  ON public.equipment_bookings FOR INSERT TO authenticated
  WITH CHECK (farmer_id = auth.uid());
CREATE POLICY "Owner or farmer updates booking"
  ON public.equipment_bookings FOR UPDATE TO authenticated
  USING (farmer_id = auth.uid() OR owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target := NEW.owner_id;
  ELSE
    target := CASE WHEN NEW.status = 'accepted' THEN NEW.farmer_id ELSE NEW.owner_id END;
  END IF;
  INSERT INTO public.notifications (user_id, kind, title_en, title_hi, body_en, body_hi, link)
  VALUES (
    target,
    'booking',
    'Equipment booking update',
    'उपकरण बुकिंग अपडेट',
    'A booking for your equipment was ' || NEW.status || '.',
    'आपके उपकरण की बुकिंग ' || NEW.status || ' हुई।',
    '/equipment'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booking_ins AFTER INSERT ON public.equipment_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking();
CREATE TRIGGER trg_notify_booking_upd AFTER UPDATE OF status ON public.equipment_bookings
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_booking();