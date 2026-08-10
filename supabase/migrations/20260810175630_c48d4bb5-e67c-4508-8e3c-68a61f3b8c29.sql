-- Remover permissão de execução pública por padrão (anon) das funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;

-- Garantir que apenas o service_role e o sistema possam executar internamente se necessário
-- Embora a função seja usada em políticas de RLS (onde o owner da política executa),
-- restringimos a chamada direta.
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
