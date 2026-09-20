DROP POLICY IF EXISTS "buyers read seller profiles" ON public.profiles;
CREATE POLICY "buyers read related farmer profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'buyer')
  AND (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.farmer_id = profiles.id AND o.buyer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.farmer_id = profiles.id AND o.buyer_id = auth.uid()
    )
  )
);