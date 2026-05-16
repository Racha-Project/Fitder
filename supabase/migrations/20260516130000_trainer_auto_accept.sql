
-- ============ TRAINER AUTO ACCEPT SYSTEM ============

-- 1. Add auto_accept field to trainer_profiles
ALTER TABLE public.trainer_profiles 
ADD COLUMN IF NOT EXISTS auto_accept BOOLEAN DEFAULT false;

-- 2. Create function to handle auto acceptance
CREATE OR REPLACE FUNCTION public.handle_booking_auto_accept()
RETURNS TRIGGER AS $$
DECLARE
  trainer_auto_accept BOOLEAN;
BEGIN
  -- Check if the trainer has auto_accept enabled
  SELECT auto_accept INTO trainer_auto_accept
  FROM public.trainer_profiles
  WHERE user_id = NEW.trainer_id;

  -- If auto_accept is true, update the booking status to accepted
  IF trainer_auto_accept = true THEN
    NEW.booking_status := 'accepted';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger to run BEFORE insert on bookings
DROP TRIGGER IF EXISTS trg_handle_booking_auto_accept ON public.bookings;
CREATE TRIGGER trg_handle_booking_auto_accept
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_booking_auto_accept();
