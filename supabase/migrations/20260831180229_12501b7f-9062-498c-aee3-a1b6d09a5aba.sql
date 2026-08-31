CREATE TABLE public.whatsapp_templates (
  id BIGSERIAL PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.whatsapp_templates_id_seq TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
GRANT ALL ON SEQUENCE public.whatsapp_templates_id_seq TO service_role;

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared whatsapp_templates" ON public.whatsapp_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_whatsapp_templates_updated
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.whatsapp_templates (chave, titulo, corpo) VALUES
  ('pedido_em_andamento', 'Pedido em andamento', 'Olá {cliente}, seu pedido #{pedido} está em andamento. Qualquer dúvida estamos à disposição.'),
  ('pedido_finalizado', 'Pedido finalizado', 'Olá {cliente}, seu pedido #{pedido} está finalizado. Qualquer dúvida estamos à disposição.'),
  ('mensagem_livre', 'Mensagem livre', 'Olá {cliente}, aqui é da {empresa}. Podemos falar sobre o pedido #{pedido}?');