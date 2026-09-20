ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS vehicle_no text,
  ADD COLUMN IF NOT EXISTS driver_phone text,
  ADD COLUMN IF NOT EXISTS dispatched_on date,
  ADD COLUMN IF NOT EXISTS delivered_on date;

CREATE OR REPLACE FUNCTION public.stamp_order_dates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'dispatched' AND OLD.status IS DISTINCT FROM 'dispatched' AND NEW.dispatched_on IS NULL THEN
    NEW.dispatched_on := CURRENT_DATE;
  END IF;
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' AND NEW.delivered_on IS NULL THEN
    NEW.delivered_on := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_dates ON public.orders;
CREATE TRIGGER trg_order_dates
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.stamp_order_dates();