CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE public.notifications (
  id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  pedido_id bigint,
  cliente_id bigint,
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  destination text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  external_id text,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.notifications_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.notifications_id_seq TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared notifications" ON public.notifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_notifications_updated
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();