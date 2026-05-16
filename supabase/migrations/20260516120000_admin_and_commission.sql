
-- ============ ADMIN & COMMISSION UPDATES ============

-- 1. Default trainers to not approved
ALTER TABLE public.trainer_profiles 
ALTER COLUMN is_approved SET DEFAULT false;

-- 2. Add commission fields to bookings if not exists
-- We'll store the commission amount (10%) at the time of booking
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='commission_amount') THEN
    ALTER TABLE public.bookings ADD COLUMN commission_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='trainer_net_amount') THEN
    ALTER TABLE public.bookings ADD COLUMN trainer_net_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- 3. Update existing bookings to calculate commission (10%)
UPDATE public.bookings 
SET 
  commission_amount = total_price * 0.1,
  trainer_net_amount = total_price * 0.9
WHERE commission_amount = 0;

-- 4. Function to automatically calculate commission on insert
CREATE OR REPLACE FUNCTION public.calculate_booking_commission()
RETURNS TRIGGER AS $$
BEGIN
  NEW.commission_amount := NEW.total_price * 0.1;
  NEW.trainer_net_amount := NEW.total_price * 0.9;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_commission
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.calculate_booking_commission();

-- 5. Policies for admin to manage everything
CREATE POLICY "Admins manage all trainer profiles" ON public.trainer_profiles 
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all availability slots" ON public.availability_slots 
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
