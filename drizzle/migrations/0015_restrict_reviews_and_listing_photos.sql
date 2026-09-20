-- 1. Reviews: only the two parties of a deal may read the raw review rows
DROP POLICY IF EXISTS "reviews readable" ON public.reviews;
CREATE POLICY "reviews readable by parties"
ON public.reviews FOR SELECT TO authenticated
USING (auth.uid() = rater_id OR auth.uid() = ratee_id);

-- Public trust score: aggregate only, no identities or comments
CREATE OR REPLACE FUNCTION public.rating_summary()
RETURNS TABLE (user_id uuid, avg_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ratee_id, round(avg(rating)::numeric, 2), count(*)
  FROM public.reviews
  GROUP BY ratee_id
$$;

REVOKE ALL ON FUNCTION public.rating_summary() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rating_summary() TO authenticated;

-- 2. Listing photos: only readable while the listing is open, or by the owner
DROP POLICY IF EXISTS "listing photos readable" ON storage.objects;
CREATE POLICY "listing photos readable"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'crop-images'
  AND (storage.foldername(name))[1] = 'listings'
  AND (
    EXISTS (
      SELECT 1 FROM public.crop_listings l
      WHERE l.image_url LIKE '%' || storage.objects.name || '%'
        AND (l.status = 'open' OR l.farmer_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.offers o
      JOIN public.crop_listings l2 ON l2.id = o.listing_id
      WHERE o.buyer_id = auth.uid() AND l2.image_url LIKE '%' || storage.objects.name || '%'
    )
  )
);
