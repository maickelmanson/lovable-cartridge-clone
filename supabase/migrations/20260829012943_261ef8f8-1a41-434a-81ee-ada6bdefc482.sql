DO $$
DECLARE t text; c record;
BEGIN
  FOREACH t IN ARRAY ARRAY['clientes','pedidos','pedido_cartuchos','cartuchos_cadastro','empresa_dados','reman_orders','reman_order_items','reman_order_units','notifications','error_logs']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN owner_id DROP NOT NULL', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN owner_id DROP DEFAULT', t);
    FOR c IN
      SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class cl ON cl.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = cl.relnamespace
       WHERE n.nspname = 'public' AND cl.relname = t AND con.contype = 'f'
         AND con.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = cl.oid AND attname = 'owner_id')]
    LOOP
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', t, c.conname);
    END LOOP;
  END LOOP;
END $$;