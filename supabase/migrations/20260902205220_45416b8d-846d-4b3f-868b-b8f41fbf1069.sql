ALTER TABLE public.pedido_cartuchos
  ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pedido_cartuchos_usuario_id
  ON public.pedido_cartuchos (usuario_id);