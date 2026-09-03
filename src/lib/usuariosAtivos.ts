import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/authClient";

export type UsuarioAtivo = { id: string; name: string | null; role: string };

export async function listarUsuariosAtivos(): Promise<UsuarioAtivo[]> {
  const res = await apiFetch("/api/auth/usuarios-ativos");
  if (!res.ok) return [];
  const payload = (await res.json()) as { usuarios?: UsuarioAtivo[] };
  return payload.usuarios ?? [];
}

/** Lista de usuários ativos para os seletores de "usuário responsável". */
export function useUsuariosAtivos() {
  return useQuery({
    queryKey: ["usuariosAtivos"],
    queryFn: listarUsuariosAtivos,
    staleTime: 5 * 60 * 1000,
  });
}
