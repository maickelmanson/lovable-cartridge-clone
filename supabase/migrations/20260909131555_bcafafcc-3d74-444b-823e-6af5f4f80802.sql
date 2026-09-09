ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS tipo_pessoa text NOT NULL DEFAULT 'FISICA',
  ADD COLUMN IF NOT EXISTS primeiro_nome text,
  ADD COLUMN IF NOT EXISTS sobrenome text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS responsavel_nome text;

UPDATE public.clientes SET primeiro_nome = nome WHERE primeiro_nome IS NULL;
UPDATE public.clientes SET tipo_pessoa = 'JURIDICA' WHERE cnpj IS NOT NULL AND btrim(cnpj) <> '';
UPDATE public.clientes SET razao_social = nome WHERE tipo_pessoa = 'JURIDICA' AND razao_social IS NULL;