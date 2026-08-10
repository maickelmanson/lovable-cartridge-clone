-- Revogar execução direta por usuários autenticados para evitar chamadas maliciosas
-- As políticas de RLS continuarão funcionando pois são executadas pelo owner da tabela (geralmente postgres/service_role)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
