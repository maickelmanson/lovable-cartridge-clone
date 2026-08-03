ALTER TABLE public.reman_order_units
  ADD COLUMN IF NOT EXISTS is_warranty boolean NOT NULL DEFAULT false;