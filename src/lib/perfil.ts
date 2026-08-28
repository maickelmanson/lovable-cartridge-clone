import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type AppRole = "admin" | "gerente" | "vendedor" | "tecnico" | "user";

export type Perfil = {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  active: boolean;
  lastLogin: string | null;
};

function toPerfil(r: any): Perfil {
  return {
    id: r.id,
    email: r.email,
    name: r.name ?? null,
    role: r.role as AppRole,
    active: r.active,
    lastLogin: r.last_login ?? null,
  };
}

export async function obterPerfilAtual(): Promise<Perfil | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, role, active, last_login")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    // Perfil ausente (conta criada antes do módulo de perfis): cria na hora.
    const meta = (user.user_metadata ?? {}) as Record<string, any>;
    const { data: criado, error: eIns } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
        name: meta.full_name ?? meta.name ?? null,
      })
      .select("id, email, name, role, active, last_login")
      .single();
    if (eIns) throw eIns;
    return toPerfil(criado);
  }

  return toPerfil(data);
}

export async function registrarUltimoAcesso(userId: string) {
  await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", userId);
}

export function usePerfilAtual() {
  return useQuery({
    queryKey: ["perfil", "atual"],
    queryFn: obterPerfilAtual,
    staleTime: 60_000,
  });
}

export function useEquipe() {
  return useQuery({
    queryKey: ["perfil", "equipe"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, role, active, last_login")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(toPerfil);
    },
  });
}
