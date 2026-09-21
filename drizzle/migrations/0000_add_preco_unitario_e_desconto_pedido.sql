ALTER TABLE public.pedido_cartuchos ADD COLUMN IF NOT EXISTS preco_unitario numeric;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS desconto numeric NOT NULL DEFAULT 0;