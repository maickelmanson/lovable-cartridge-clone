ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions jsonb;
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);