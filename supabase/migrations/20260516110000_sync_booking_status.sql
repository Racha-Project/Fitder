
-- ============ SYNC BOOKING STATUS TO SLOT ============

-- Function to sync booking status to availability slot
CREATE OR REPLACE FUNCTION public.sync_booking_to_slot()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changes to accepted, mark slot as booked
  IF NEW.booking_status = 'accepted' THEN
    UPDATE public.availability_slots
    SET is_booked = true
    WHERE id = NEW.slot_id;
  
  -- If status changes to rejected or cancelled, mark slot as available
  ELSIF NEW.booking_status IN ('rejected', 'cancelled') THEN
    UPDATE public.availability_slots
    SET is_booked = false
    WHERE id = NEW.slot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after booking status update
DROP TRIGGER IF EXISTS trg_sync_booking_to_slot ON public.bookings;
CREATE TRIGGER trg_sync_booking_to_slot
AFTER UPDATE OF booking_status ON public.bookings
FOR EACH ROW
WHEN (OLD.booking_status IS DISTINCT FROM NEW.booking_status)
EXECUTE FUNCTION public.sync_booking_to_slot();
