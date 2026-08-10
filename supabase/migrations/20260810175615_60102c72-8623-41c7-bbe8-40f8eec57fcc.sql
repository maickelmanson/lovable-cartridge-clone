-- Primeiro, criamos o enum para os papéis se ele ainda não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END
$$;

-- Tabela de papéis de usuários
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Atualizando políticas de RLS das tabelas de negócio para permitir acesso compartilhado
-- Clientes
DROP POLICY IF EXISTS "own clientes" ON public.clientes;
CREATE POLICY "shared clientes" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Cartuchos Cadastro
DROP POLICY IF EXISTS "own cartuchos" ON public.cartuchos_cadastro;
CREATE POLICY "shared cartuchos" ON public.cartuchos_cadastro FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pedidos
DROP POLICY IF EXISTS "own pedidos" ON public.pedidos;
CREATE POLICY "shared pedidos" ON public.pedidos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pedido Cartuchos
DROP POLICY IF EXISTS "own pedido_cartuchos" ON public.pedido_cartuchos;
CREATE POLICY "shared pedido_cartuchos" ON public.pedido_cartuchos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Empresa Dados
DROP POLICY IF EXISTS "own empresa" ON public.empresa_dados;
CREATE POLICY "shared empresa" ON public.empresa_dados FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reman Orders
DROP POLICY IF EXISTS "own reman_orders" ON public.reman_orders;
CREATE POLICY "shared reman_orders" ON public.reman_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reman Order Items
DROP POLICY IF EXISTS "own reman_items" ON public.reman_order_items;
CREATE POLICY "shared reman_order_items" ON public.reman_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reman Order Units
DROP POLICY IF EXISTS "own reman_units" ON public.reman_order_units;
CREATE POLICY "shared reman_order_units" ON public.reman_order_units FOR ALL TO authenticated USING (true) WITH CHECK (true);
