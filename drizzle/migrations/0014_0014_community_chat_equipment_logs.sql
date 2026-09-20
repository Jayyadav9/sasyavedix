CREATE TABLE public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts read all" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts insert own" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "posts delete own" ON public.community_posts FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_replies TO authenticated;
GRANT ALL ON public.community_replies TO service_role;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies read all" ON public.community_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "replies insert own" ON public.community_replies FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "replies delete own" ON public.community_replies FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_name text,
  body text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_messages TO authenticated;
GRANT ALL ON public.order_messages TO service_role;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages read parties" ON public.order_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.farmer_id = auth.uid() OR o.buyer_id = auth.uid())));
CREATE POLICY "messages insert parties" ON public.order_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.farmer_id = auth.uid() OR o.buyer_id = auth.uid())));

CREATE TABLE public.equipment_logs (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  used_on date not null default current_date,
  hours numeric,
  note text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_logs TO authenticated;
GRANT ALL ON public.equipment_logs TO service_role;
ALTER TABLE public.equipment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs own" ON public.equipment_logs FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_order_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record; target uuid;
BEGIN
  SELECT farmer_id, buyer_id, crop INTO o FROM public.orders WHERE id = NEW.order_id;
  target := CASE WHEN NEW.sender_id = o.farmer_id THEN o.buyer_id ELSE o.farmer_id END;
  INSERT INTO public.notifications (user_id, kind, title_en, title_hi, body_en, body_hi, link)
  VALUES (target, 'message', 'New message on your order', 'आपके ऑर्डर पर नया संदेश',
    COALESCE(NEW.sender_name,'Someone') || ': ' || left(NEW.body, 80),
    COALESCE(NEW.sender_name,'किसी ने') || ': ' || left(NEW.body, 80),
    '/orders');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_order_message AFTER INSERT ON public.order_messages FOR EACH ROW EXECUTE FUNCTION public.notify_order_message();