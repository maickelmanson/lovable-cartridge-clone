// Real Supabase-backed hooks that emulate the tRPC `clientes` namespace surface.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requirePermission } from "@/lib/guard";
import { registrarAuditoria, diff } from "@/lib/audit";

type ClienteRow = {
  id: number;
  nome: string;
  telefone: string | null;
  telefone2: string | null;
  endereco: string | null;
  cpf: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  commercial_profile: "CLIENTE_FINAL" | "REVENDA";
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

type ClienteApp = {
  id: number;
  nome: string;
  telefone: string | null;
  telefone2: string | null;
  endereco: string | null;
  cpf: string | null;
  cnpj: string | null;
  inscricaoEstadual: string | null;
  commercialProfile: "CLIENTE_FINAL" | "REVENDA";
  observacoes: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

function toApp(r: ClienteRow): ClienteApp {
  return {
    id: r.id,
    nome: r.nome,
    telefone: r.telefone,
    telefone2: r.telefone2,
    endereco: r.endereco,
    cpf: r.cpf,
    cnpj: r.cnpj,
    inscricaoEstadual: r.inscricao_estadual,
    commercialProfile: r.commercial_profile,
    observacoes: r.observacoes,
    criadoEm: r.created_at,
    atualizadoEm: r.updated_at,
  };
}

function toDb(input: any) {
  const out: any = {};
  if ("nome" in input) out.nome = input.nome;
  if ("telefone" in input) out.telefone = input.telefone || null;
  if ("telefone2" in input) out.telefone2 = input.telefone2 || null;
  if ("endereco" in input) out.endereco = input.endereco || null;
  if ("cpf" in input) out.cpf = input.cpf || null;
  if ("cnpj" in input) out.cnpj = input.cnpj || null;
  if ("inscricaoEstadual" in input) out.inscricao_estadual = input.inscricaoEstadual || null;
  if ("commercialProfile" in input) out.commercial_profile = input.commercialProfile || "CLIENTE_FINAL";
  if ("observacoes" in input) out.observacoes = input.observacoes || null;
  return out;
}

const LIST_KEY = ["clientes", "listar"] as const;
const ITEM_KEY = (id: number) => ["clientes", "buscar", id] as const;

export const clientesApi = {
  listar: {
    useQuery: () =>
      useQuery({
        queryKey: LIST_KEY,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("clientes")
            .select("*")
            .order("nome", { ascending: true });
          if (error) throw error;
          return (data as ClienteRow[]).map(toApp);
        },
      }),
  },
  buscar: {
    useQuery: (id: number) =>
      useQuery({
        queryKey: ITEM_KEY(id),
        enabled: Number.isFinite(id) && id > 0,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("clientes")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (error) throw error;
          return data ? toApp(data as ClienteRow) : null;
        },
      }),
  },
  criar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          requirePermission("cliente.criar");
          const { data: userData } = await supabase.auth.getUser();
          const owner_id = userData.user?.id;
          if (!owner_id) throw new Error("Usuário não autenticado");
          const payload = { ...toDb(input), owner_id };
          const { data, error } = await supabase
            .from("clientes")
            .insert(payload)
            .select("*")
            .single();
          if (error) throw error;
          await registrarAuditoria({
            action: "cliente.criar",
            entityType: "clientes",
            entityId: data.id,
            entityLabel: data.nome,
            details: { depois: data },
          });
          return toApp(data as ClienteRow);
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["clientes"] });
        },
      });
    },
  },
  atualizar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          requirePermission("cliente.editar");
          const { id, ...rest } = input;
          const { data: antes } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
          const { data, error } = await supabase
            .from("clientes")
            .update(toDb(rest))
            .eq("id", id)
            .select("*")
            .single();
          if (error) throw error;
          await registrarAuditoria({
            action: "cliente.alterar",
            entityType: "clientes",
            entityId: id,
            entityLabel: data.nome,
            details: diff(antes as any, data as any),
          });
          return toApp(data as ClienteRow);
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["clientes"] });
        },
      });
    },
  },
  deletar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          requirePermission("cliente.deletar");
          const { data: antes } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
          const { error } = await supabase.from("clientes").delete().eq("id", id);
          if (error) throw error;
          await registrarAuditoria({
            action: "cliente.deletar",
            entityType: "clientes",
            entityId: id,
            entityLabel: (antes as any)?.nome ?? null,
            details: { antes, depois: null },
          });
          return { id };
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["clientes"] });
        },
      });
    },
  },
};
