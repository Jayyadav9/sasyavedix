-- Ratings & trust: both parties rate each other after a deal
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL,
  ratee_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, rater_id)
);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews readable" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "order party rates" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = rater_id
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.buyer_id = auth.uid() OR o.farmer_id = auth.uid())
        AND o.status IN ('dispatched', 'delivered', 'paid')
    )
  );

-- Farm expenses per crop
CREATE TABLE public.farm_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  amount numeric NOT NULL,
  spent_on date NOT NULL DEFAULT CURRENT_DATE,
  acres numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_expenses TO authenticated;
GRANT ALL ON public.farm_expenses TO service_role;
ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own farm expenses" ON public.farm_expenses FOR ALL TO authenticated
  USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);