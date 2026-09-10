ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS credito_pendente numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credito_observacao text;