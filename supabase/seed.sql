-- ---------------------------------------------------------------------------
-- Schema completo do sistema de cartuchos (idempotente).
-- Uso: npm run seed-sql   (executa este arquivo em $SUPABASE_DB_URL)
-- No ambiente Lovable o schema é aplicado pelas migrações em supabase/migrations.
-- ---------------------------------------------------------------------------

-- Tipos --------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'gerente', 'vendedor', 'tecnico');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.commercial_profile AS ENUM ('CLIENTE_FINAL', 'REVENDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.error_severity AS ENUM ('baixa', 'media', 'alta', 'critica');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pedido_status AS ENUM ('aberto', 'finalizado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pedido_cartucho_status AS ENUM
    ('em_espera', 'em_andamento', 'processo', 'funcionando', 'circuito_queimado', 'defeito_cabeca', 'garantia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reman_order_status AS ENUM ('aberto', 'em_processamento', 'finalizado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reman_unit_status AS ENUM ('FUNCIONANDO', 'COM_PROBLEMA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Função de updated_at ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Usuários do login próprio (bcrypt + JWT) ----------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  name text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'vendedor',
  active boolean NOT NULL DEFAULT true,
  permissions jsonb,
  last_login timestamptz,
  password_changed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Perfis vinculados ao Supabase Auth ---------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role public.app_role NOT NULL DEFAULT 'user',
  active boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Auditoria -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigserial PRIMARY KEY,
  user_id text,
  user_name text,
  user_email text,
  user_role text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  entity_label text,
  details jsonb,
  ip_address text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Dados da empresa ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.empresa_dados (
  id bigserial PRIMARY KEY,
  owner_id uuid,
  empresa text,
  nome text,
  cep varchar,
  endereco text,
  numero varchar,
  bairro text,
  cidade text,
  estado varchar,
  cnpj_cpf varchar,
  telefone varchar,
  celular varchar,
  email varchar,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa_dados TO authenticated;
GRANT ALL ON public.empresa_dados TO service_role;
ALTER TABLE public.empresa_dados ENABLE ROW LEVEL SECURITY;

-- Clientes ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
  id bigserial PRIMARY KEY,
  owner_id uuid,
  nome text NOT NULL,
  telefone varchar,
  telefone2 varchar,
  endereco text,
  cpf varchar,
  cnpj varchar,
  inscricao_estadual varchar,
  commercial_profile public.commercial_profile NOT NULL DEFAULT 'CLIENTE_FINAL',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Cadastro de modelos de cartucho ------------------------------------------
CREATE TABLE IF NOT EXISTS public.cartuchos_cadastro (
  id bigserial PRIMARY KEY,
  owner_id uuid,
  modelo_01 text NOT NULL,
  modelo_02 text NOT NULL,
  price_final_customer numeric,
  price_reseller numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cartuchos_cadastro TO authenticated;
GRANT ALL ON public.cartuchos_cadastro TO service_role;
ALTER TABLE public.cartuchos_cadastro ENABLE ROW LEVEL SECURITY;

-- Pedidos -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedidos (
  id bigserial PRIMARY KEY,
  owner_id uuid,
  numero varchar NOT NULL,
  cliente_id bigint NOT NULL REFERENCES public.clientes(id),
  status public.pedido_status NOT NULL DEFAULT 'aberto',
  observacao_geral text,
  data_finalizacao timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.pedido_cartuchos (
  id bigserial PRIMARY KEY,
  owner_id uuid,
  pedido_id bigint NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  cartucho_id bigint REFERENCES public.cartuchos_cadastro(id),
  codigo varchar,
  peso_chegada varchar,
  peso_saida varchar,
  protegido smallint NOT NULL DEFAULT 0,
  status public.pedido_cartucho_status NOT NULL DEFAULT 'em_espera',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_cartuchos TO authenticated;
GRANT ALL ON public.pedido_cartuchos TO service_role;
ALTER TABLE public.pedido_cartuchos ENABLE ROW LEVEL SECURITY;

-- Remanufatura --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reman_orders (
  id bigserial PRIMARY KEY,
  owner_id uuid,
  order_number varchar NOT NULL,
  cliente_id bigint NOT NULL REFERENCES public.clientes(id),
  pedido_id bigint REFERENCES public.pedidos(id) ON DELETE CASCADE,
  commercial_profile_snapshot varchar NOT NULL,
  status public.reman_order_status NOT NULL DEFAULT 'aberto',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  observacao_geral text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reman_orders TO authenticated;
GRANT ALL ON public.reman_orders TO service_role;
ALTER TABLE public.reman_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.reman_order_items (
  id bigserial PRIMARY KEY,
  owner_id uuid,
  order_id bigint NOT NULL REFERENCES public.reman_orders(id) ON DELETE CASCADE,
  cartucho_id bigint NOT NULL REFERENCES public.cartuchos_cadastro(id),
  description_snapshot text,
  model_code_snapshot varchar,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  price_source public.commercial_profile NOT NULL,
  line_total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reman_order_items TO authenticated;
GRANT ALL ON public.reman_order_items TO service_role;
ALTER TABLE public.reman_order_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.reman_order_units (
  id bigserial PRIMARY KEY,
  owner_id uuid,
  order_item_id bigint NOT NULL REFERENCES public.reman_order_items(id) ON DELETE CASCADE,
  cartucho_id bigint NOT NULL REFERENCES public.cartuchos_cadastro(id),
  unit_code varchar NOT NULL,
  status public.reman_unit_status NOT NULL,
  defect_type varchar,
  output_weight numeric,
  is_warranty boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reman_order_units TO authenticated;
GRANT ALL ON public.reman_order_units TO service_role;
ALTER TABLE public.reman_order_units ENABLE ROW LEVEL SECURITY;

-- Notificações de WhatsApp --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigserial PRIMARY KEY,
  owner_id uuid,
  pedido_id bigint,
  cliente_id bigint,
  channel text NOT NULL,
  destination text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  external_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id bigserial PRIMARY KEY,
  chave text NOT NULL UNIQUE,
  titulo text NOT NULL,
  corpo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Registro de erros ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.error_logs (
  id bigserial PRIMARY KEY,
  owner_id uuid,
  error_type varchar NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  context jsonb,
  severity public.error_severity NOT NULL DEFAULT 'media',
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Políticas -----------------------------------------------------------------
-- Os dados de negócio são compartilhados entre todos os usuários autenticados.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clientes','cartuchos_cadastro','empresa_dados','pedidos','pedido_cartuchos',
    'reman_orders','reman_order_items','reman_order_units','notifications',
    'whatsapp_templates','error_logs'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      'shared ' || t, t
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END LOOP;
END $$;

DO $$ BEGIN
  CREATE POLICY profiles_select_authenticated ON public.profiles
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY profiles_insert_self ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY profiles_update_self ON public.profiles
    FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Triggers de updated_at ----------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','profiles','clientes','cartuchos_cadastro','empresa_dados','pedidos',
    'pedido_cartuchos','reman_orders','reman_order_items','reman_order_units',
    'notifications','whatsapp_templates','error_logs'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()', t, t);
  END LOOP;
END $$;

-- Usuário administrador inicial --------------------------------------------
-- E-mail: admin@epsolucoes.com  |  Senha: EPS@2026  (troque após o 1º acesso)
INSERT INTO public.users (email, password, name, role, active)
VALUES (
  'admin@epsolucoes.com',
  '$2b$10$jBtMAMUXVEXSFN8qUn6tCOzGys8LfGHGAg5t0tz/3oU/a4egtrif2',
  'Administrador',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;
