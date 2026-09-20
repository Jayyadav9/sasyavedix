-- 1. Notifications ---------------------------------------------------------
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'info',
  title_en text NOT NULL,
  title_hi text NOT NULL,
  body_en text,
  body_hi text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- notify farmer when a buyer sends an offer
CREATE OR REPLACE FUNCTION public.notify_new_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title_en, title_hi, body_en, body_hi, link)
  VALUES (
    NEW.farmer_id, 'offer',
    'New offer received', 'नया प्रस्ताव मिला',
    'A buyer offered Rs ' || NEW.price_per_quintal || '/quintal for ' || NEW.quantity || ' quintal.',
    'खरीदार ने ' || NEW.quantity || ' क्विंटल के लिए ₹' || NEW.price_per_quintal || '/क्विंटल का प्रस्ताव दिया।',
    '/orders'
  );
  RETURN NEW;
END $$;
CREATE TRIGGER offers_notify_farmer AFTER INSERT ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_new_offer();

-- notify the counterparty when an order moves forward
CREATE OR REPLACE FUNCTION public.notify_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target := NEW.buyer_id;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    target := CASE WHEN NEW.status IN ('dispatched') THEN NEW.buyer_id ELSE NEW.farmer_id END;
  ELSE
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (user_id, kind, title_en, title_hi, body_en, body_hi, link)
  VALUES (
    target, 'order',
    'Order update: ' || NEW.status, 'ऑर्डर अपडेट: ' || NEW.status,
    NEW.crop || ' · ' || NEW.quantity || ' quintal · Rs ' || NEW.total_amount,
    NEW.crop || ' · ' || NEW.quantity || ' क्विंटल · ₹' || NEW.total_amount,
    '/orders'
  );
  RETURN NEW;
END $$;
CREATE TRIGGER orders_notify AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_status();

-- 2. Price alerts -----------------------------------------------------------
CREATE TABLE public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop text NOT NULL,
  market text,
  direction text NOT NULL DEFAULT 'above',
  target_price numeric NOT NULL,
  active boolean NOT NULL DEFAULT true,
  last_notified_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_alerts TO authenticated;
GRANT ALL ON public.price_alerts TO service_role;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own price alerts" ON public.price_alerts FOR ALL TO authenticated
USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);

-- 3. Crop calendar ----------------------------------------------------------
CREATE TABLE public.crop_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop text NOT NULL,
  variety text,
  sowing_date date NOT NULL,
  harvest_date date,
  area_acres numeric,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_plans TO authenticated;
GRANT ALL ON public.crop_plans TO service_role;
ALTER TABLE public.crop_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own crop plans" ON public.crop_plans FOR ALL TO authenticated
USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);

CREATE TABLE public.crop_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.crop_plans(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'general',
  title_en text NOT NULL,
  title_hi text NOT NULL,
  due_date date NOT NULL,
  done boolean NOT NULL DEFAULT false,
  done_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crop_tasks_farmer_due_idx ON public.crop_tasks (farmer_id, due_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_tasks TO authenticated;
GRANT ALL ON public.crop_tasks TO service_role;
ALTER TABLE public.crop_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own crop tasks" ON public.crop_tasks FOR ALL TO authenticated
USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);

-- 4. Payments & invoices ----------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_no text;

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  amount numeric NOT NULL,
  method text NOT NULL DEFAULT 'upi',
  reference text,
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON public.payments (order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment parties select" ON public.payments FOR SELECT TO authenticated
USING (auth.uid() = farmer_id OR auth.uid() = buyer_id);
CREATE POLICY "payment parties insert" ON public.payments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = farmer_id OR auth.uid() = buyer_id);
CREATE POLICY "payment parties update" ON public.payments FOR UPDATE TO authenticated
USING (auth.uid() = farmer_id OR auth.uid() = buyer_id)
WITH CHECK (auth.uid() = farmer_id OR auth.uid() = buyer_id);

-- invoice number on order creation
CREATE OR REPLACE FUNCTION public.set_invoice_no()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.invoice_no IS NULL THEN
    NEW.invoice_no := 'SVX-' || to_char(now(), 'YYYYMM') || '-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_invoice_no BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_invoice_no();

UPDATE public.orders SET invoice_no = 'SVX-' || to_char(created_at, 'YYYYMM') || '-' || upper(substr(replace(id::text, '-', ''), 1, 6)) WHERE invoice_no IS NULL;
