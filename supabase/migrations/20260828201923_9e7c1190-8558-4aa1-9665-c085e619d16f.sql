ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
DROP POLICY IF EXISTS audit_logs_insert_authenticated ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;
ALTER TABLE public.audit_logs ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_role text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_label text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS session_id text;

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.audit_logs_id_seq TO authenticated;

CREATE POLICY audit_logs_insert_authenticated ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY audit_logs_select_authenticated ON public.audit_logs
  FOR SELECT TO authenticated USING (true);