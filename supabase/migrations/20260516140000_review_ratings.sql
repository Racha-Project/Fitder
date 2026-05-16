
-- ============ REVIEW & RATING AUTOMATION ============

-- 1. Add booking_id to reviews for traceability
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);

-- 2. Function to update trainer rating and review count
CREATE OR REPLACE FUNCTION public.update_trainer_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.trainer_profiles
    SET 
      rating = (
        SELECT AVG(rating)::NUMERIC(3,2)
        FROM public.reviews
        WHERE trainer_id = NEW.trainer_id
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE trainer_id = NEW.trainer_id
      )
    WHERE user_id = NEW.trainer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.trainer_profiles
    SET 
      rating = COALESCE((
        SELECT AVG(rating)::NUMERIC(3,2)
        FROM public.reviews
        WHERE trainer_id = OLD.trainer_id
      ), 0),
      total_reviews = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE trainer_id = OLD.trainer_id
      )
    WHERE user_id = OLD.trainer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update rating on review changes
DROP TRIGGER IF EXISTS trg_update_trainer_rating ON public.reviews;
CREATE TRIGGER trg_update_trainer_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_trainer_rating();
