CREATE TYPE public.error_severity AS ENUM ('baixa','media','alta','critica');

CREATE TABLE public.error_logs (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB,
  severity public.error_severity NOT NULL DEFAULT 'media',
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.error_logs_id_seq TO authenticated;
GRANT ALL ON public.error_logs TO service_role;
GRANT ALL ON SEQUENCE public.error_logs_id_seq TO service_role;

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own error_logs" ON public.error_logs
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX error_logs_owner_created_idx ON public.error_logs (owner_id, created_at DESC);

CREATE TRIGGER error_logs_set_updated_at
  BEFORE UPDATE ON public.error_logs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();