
-- Enums
CREATE TYPE public.commercial_profile AS ENUM ('CLIENTE_FINAL','REVENDA');
CREATE TYPE public.pedido_status AS ENUM ('aberto','finalizado');
CREATE TYPE public.pedido_cartucho_status AS ENUM ('em_espera','em_andamento','processo','funcionando','circuito_queimado','defeito_cabeca');
CREATE TYPE public.reman_order_status AS ENUM ('aberto','em_processamento','finalizado','cancelado');
CREATE TYPE public.reman_unit_status AS ENUM ('FUNCIONANDO','COM_PROBLEMA');

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- clientes
CREATE TABLE public.clientes (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone VARCHAR(20),
  telefone2 VARCHAR(20),
  endereco TEXT,
  cpf VARCHAR(14),
  cnpj VARCHAR(18),
  inscricao_estadual VARCHAR(20),
  commercial_profile public.commercial_profile NOT NULL DEFAULT 'CLIENTE_FINAL',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.clientes_id_seq TO authenticated;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clientes" ON public.clientes FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- cartuchos_cadastro
CREATE TABLE public.cartuchos_cadastro (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  modelo_01 TEXT NOT NULL,
  modelo_02 TEXT NOT NULL,
  price_final_customer NUMERIC(10,2),
  price_reseller NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cartuchos_cadastro TO authenticated;
GRANT ALL ON public.cartuchos_cadastro TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.cartuchos_cadastro_id_seq TO authenticated;
ALTER TABLE public.cartuchos_cadastro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cartuchos" ON public.cartuchos_cadastro FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_cartuchos_updated BEFORE UPDATE ON public.cartuchos_cadastro FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- pedidos
CREATE TABLE public.pedidos (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  numero VARCHAR(20) NOT NULL,
  cliente_id BIGINT NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  status public.pedido_status NOT NULL DEFAULT 'aberto',
  data_finalizacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.pedidos_id_seq TO authenticated;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pedidos" ON public.pedidos FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- pedido_cartuchos
CREATE TABLE public.pedido_cartuchos (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  pedido_id BIGINT NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  cartucho_id BIGINT REFERENCES public.cartuchos_cadastro(id) ON DELETE SET NULL,
  codigo VARCHAR(100),
  peso_chegada VARCHAR(20),
  peso_saida VARCHAR(20),
  protegido SMALLINT NOT NULL DEFAULT 0,
  status public.pedido_cartucho_status NOT NULL DEFAULT 'em_espera',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_cartuchos TO authenticated;
GRANT ALL ON public.pedido_cartuchos TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.pedido_cartuchos_id_seq TO authenticated;
ALTER TABLE public.pedido_cartuchos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pedido_cartuchos" ON public.pedido_cartuchos FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_pedcart_updated BEFORE UPDATE ON public.pedido_cartuchos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- empresa_dados (one row per owner)
CREATE TABLE public.empresa_dados (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa TEXT,
  cep VARCHAR(10),
  endereco TEXT,
  numero VARCHAR(10),
  bairro TEXT,
  cidade TEXT,
  estado VARCHAR(50),
  cnpj_cpf VARCHAR(20),
  telefone VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(320),
  nome TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa_dados TO authenticated;
GRANT ALL ON public.empresa_dados TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.empresa_dados_id_seq TO authenticated;
ALTER TABLE public.empresa_dados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own empresa" ON public.empresa_dados FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_empresa_updated BEFORE UPDATE ON public.empresa_dados FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- reman_orders
CREATE TABLE public.reman_orders (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR(20) NOT NULL,
  cliente_id BIGINT NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  commercial_profile_snapshot VARCHAR(20) NOT NULL,
  status public.reman_order_status NOT NULL DEFAULT 'aberto',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, order_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reman_orders TO authenticated;
GRANT ALL ON public.reman_orders TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.reman_orders_id_seq TO authenticated;
ALTER TABLE public.reman_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reman_orders" ON public.reman_orders FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_reman_orders_updated BEFORE UPDATE ON public.reman_orders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- reman_order_items
CREATE TABLE public.reman_order_items (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES public.reman_orders(id) ON DELETE CASCADE,
  cartucho_id BIGINT NOT NULL REFERENCES public.cartuchos_cadastro(id) ON DELETE RESTRICT,
  description_snapshot TEXT,
  model_code_snapshot VARCHAR(50),
  quantity INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  price_source public.commercial_profile NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reman_order_items TO authenticated;
GRANT ALL ON public.reman_order_items TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.reman_order_items_id_seq TO authenticated;
ALTER TABLE public.reman_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reman_items" ON public.reman_order_items FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_reman_items_updated BEFORE UPDATE ON public.reman_order_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- reman_order_units
CREATE TABLE public.reman_order_units (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_item_id BIGINT NOT NULL REFERENCES public.reman_order_items(id) ON DELETE CASCADE,
  cartucho_id BIGINT NOT NULL REFERENCES public.cartuchos_cadastro(id) ON DELETE RESTRICT,
  unit_code VARCHAR(100) NOT NULL,
  status public.reman_unit_status NOT NULL,
  defect_type VARCHAR(100),
  output_weight NUMERIC(8,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reman_order_units TO authenticated;
GRANT ALL ON public.reman_order_units TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.reman_order_units_id_seq TO authenticated;
ALTER TABLE public.reman_order_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reman_units" ON public.reman_order_units FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_reman_units_updated BEFORE UPDATE ON public.reman_order_units FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Índices úteis
CREATE INDEX idx_clientes_owner ON public.clientes(owner_id);
CREATE INDEX idx_cartuchos_owner ON public.cartuchos_cadastro(owner_id);
CREATE INDEX idx_pedidos_owner_cliente ON public.pedidos(owner_id, cliente_id);
CREATE INDEX idx_pedcart_pedido ON public.pedido_cartuchos(pedido_id);
CREATE INDEX idx_reman_orders_owner_cliente ON public.reman_orders(owner_id, cliente_id);
CREATE INDEX idx_reman_items_order ON public.reman_order_items(order_id);
CREATE INDEX idx_reman_units_item ON public.reman_order_units(order_item_id);
