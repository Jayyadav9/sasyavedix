-- Roles ---------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('farmer', 'buyer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own roles select" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Assign role at signup from signup metadata (defaults to farmer)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Farmer'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'buyer' THEN 'buyer'::public.app_role
         ELSE 'farmer'::public.app_role END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

-- Offers --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.crop_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  price_per_quintal numeric NOT NULL,
  quantity numeric NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer parties select" ON public.offers
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);
CREATE POLICY "buyer creates offer" ON public.offers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "offer parties update" ON public.offers
  FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = farmer_id);

-- Orders --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.crop_listings(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop text NOT NULL,
  variety text,
  quantity numeric NOT NULL,
  price_per_quintal numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'accepted',
  pickup_location text,
  delivery_date date,
  payment_method text,
  payment_ref text,
  farmer_note text,
  buyer_note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order parties select" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);
CREATE POLICY "order parties insert" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id OR auth.uid() = farmer_id);
CREATE POLICY "order parties update" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = farmer_id);

CREATE INDEX IF NOT EXISTS orders_farmer_idx ON public.orders(farmer_id);
CREATE INDEX IF NOT EXISTS orders_buyer_idx ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS offers_listing_idx ON public.offers(listing_id);

-- Buyers can browse open listings --------------------------------------
CREATE POLICY "buyers browse open listings" ON public.crop_listings
  FOR SELECT TO authenticated
  USING (status = 'open' AND public.has_role(auth.uid(), 'buyer'));

-- Buyers can read the farmer's public contact-lite profile fields
CREATE POLICY "buyers read seller profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'buyer'));

-- Listing photos are readable by any signed-in user ---------------------
CREATE POLICY "listing photos readable" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'crop-images' AND (storage.foldername(name))[1] = 'listings');

CREATE POLICY "own listing photo upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'crop-images'
    AND (storage.foldername(name))[1] = 'listings'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );