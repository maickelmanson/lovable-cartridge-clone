DROP POLICY IF EXISTS "own error_logs" ON public.error_logs;
CREATE POLICY "shared error_logs"
  ON public.error_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);