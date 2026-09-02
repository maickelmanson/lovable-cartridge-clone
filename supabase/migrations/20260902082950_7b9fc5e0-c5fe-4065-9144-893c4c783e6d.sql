ALTER TABLE public.reman_orders
  ADD COLUMN IF NOT EXISTS pedido_id bigint REFERENCES public.pedidos(id) ON DELETE CASCADE;

UPDATE public.reman_orders r
SET pedido_id = p.id
FROM public.pedidos p
WHERE r.pedido_id IS NULL
  AND r.order_number = 'REM-' || p.numero;

DELETE FROM public.reman_order_units u
USING public.reman_order_items i, public.reman_orders r
WHERE u.order_item_id = i.id
  AND i.order_id = r.id
  AND r.pedido_id IS NULL
  AND r.order_number LIKE 'REM-%';

DELETE FROM public.reman_order_items i
USING public.reman_orders r
WHERE i.order_id = r.id
  AND r.pedido_id IS NULL
  AND r.order_number LIKE 'REM-%';

DELETE FROM public.reman_orders r
WHERE r.pedido_id IS NULL
  AND r.order_number LIKE 'REM-%';

CREATE UNIQUE INDEX IF NOT EXISTS reman_orders_pedido_id_uidx
  ON public.reman_orders (pedido_id)
  WHERE pedido_id IS NOT NULL;