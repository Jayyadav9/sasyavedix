CREATE TABLE public.farmer_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  village text,
  district text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmer_groups TO authenticated;
GRANT ALL ON public.farmer_groups TO service_role;

CREATE TABLE public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.farmer_groups(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, farmer_id)
);
GRANT SELECT, INSERT, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;

CREATE TABLE public.group_pools (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.farmer_groups(id) ON DELETE CASCADE,
  crop text NOT NULL,
  variety text,
  expected_price numeric,
  status text NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_pools TO authenticated;
GRANT ALL ON public.group_pools TO service_role;

CREATE TABLE public.pool_contributions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id uuid NOT NULL REFERENCES public.group_pools(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pool_id, farmer_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pool_contributions TO authenticated;
GRANT ALL ON public.pool_contributions TO service_role;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _farmer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = _group_id AND farmer_id = _farmer_id
  ) OR EXISTS (
    SELECT 1 FROM public.farmer_groups WHERE id = _group_id AND created_by = _farmer_id
  )
$$;

ALTER TABLE public.farmer_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read groups" ON public.farmer_groups FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.is_group_member(id, auth.uid()));
CREATE POLICY "creator manages group" ON public.farmer_groups FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read members" ON public.group_members FOR SELECT TO authenticated USING (farmer_id = auth.uid() OR public.is_group_member(group_id, auth.uid()));
CREATE POLICY "join group" ON public.group_members FOR INSERT TO authenticated WITH CHECK (farmer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.farmer_groups g WHERE g.id = group_id AND g.created_by = auth.uid()));
CREATE POLICY "leave group" ON public.group_members FOR DELETE TO authenticated USING (farmer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.farmer_groups g WHERE g.id = group_id AND g.created_by = auth.uid()));

ALTER TABLE public.group_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read pools" ON public.group_pools FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "members create pools" ON public.group_pools FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "creator manages pool" ON public.group_pools FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "creator deletes pool" ON public.group_pools FOR DELETE TO authenticated USING (created_by = auth.uid());

ALTER TABLE public.pool_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pool members read contributions" ON public.pool_contributions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.group_pools p WHERE p.id = pool_contributions.pool_id AND public.is_group_member(p.group_id, auth.uid())));
CREATE POLICY "own contribution" ON public.pool_contributions FOR INSERT TO authenticated WITH CHECK (farmer_id = auth.uid());
CREATE POLICY "own contribution update" ON public.pool_contributions FOR UPDATE TO authenticated USING (farmer_id = auth.uid()) WITH CHECK (farmer_id = auth.uid());
CREATE POLICY "own contribution delete" ON public.pool_contributions FOR DELETE TO authenticated USING (farmer_id = auth.uid());

CREATE TABLE public.loans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'kcc',
  bank text,
  sanctioned numeric,
  outstanding numeric,
  interest_pct numeric,
  due_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own loans" ON public.loans FOR ALL TO authenticated USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);

CREATE TABLE public.insurance_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop text NOT NULL,
  season text NOT NULL DEFAULT 'Kharif',
  area_acres numeric,
  sum_insured numeric,
  premium numeric,
  insurer text,
  status text NOT NULL DEFAULT 'enrolled',
  claim_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_policies TO authenticated;
GRANT ALL ON public.insurance_policies TO service_role;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own insurance" ON public.insurance_policies FOR ALL TO authenticated USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);