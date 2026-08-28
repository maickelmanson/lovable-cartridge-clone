ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS observacao_geral text;
ALTER TABLE public.reman_orders ADD COLUMN IF NOT EXISTS observacao_geral text;