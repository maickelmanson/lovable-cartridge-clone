import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/db";
import { requirePermission } from "@/lib/guard";
import { registrarAuditoria, diff } from "@/lib/audit";

function rest_keys(input: any) {
  const { id, ...rest } = input ?? {};
  return rest;
}

async function getOwnerId() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Usuário não autenticado");
  return id;
}

function toApp(r: any, modelo?: { modelo_01: string; modelo_02: string } | null) {
  return {
    id: r.id,
    pedidoId: r.pedido_id,
    cartuchoId: r.cartucho_id,
    codigo: r.codigo,
    pesoChegada: r.peso_chegada,
    pesoSaida: r.peso_saida,
    protegido: r.protegido,
    status: r.status,
    observacoes: r.observacoes,
    usuarioId: r.usuario_id ?? null,
    dataInclusao: r.created_at,
    modelo01: modelo?.modelo_01 ?? null,
    modelo02: modelo?.modelo_02 ?? null,
  };
}

function toDb(i: any) {
  const o: any = {};
  if ("cartuchoId" in i) o.cartucho_id = i.cartuchoId ?? null;
  if ("codigo" in i) o.codigo = i.codigo || null;
  if ("pesoChegada" in i)
    o.peso_chegada = i.pesoChegada != null && i.pesoChegada !== "" ? String(i.pesoChegada).replace(",", ".") : null;
  if ("pesoSaida" in i)
    o.peso_saida = i.pesoSaida != null && i.pesoSaida !== "" ? String(i.pesoSaida).replace(",", ".") : null;
  if ("protegido" in i) o.protegido = i.protegido ? 1 : 0;
  if ("status" in i) o.status = i.status;
  if ("observacoes" in i) o.observacoes = i.observacoes || null;
  if ("usuarioId" in i) o.usuario_id = i.usuarioId || null;
  return o;
}


export const pedidoCartuchosApi = {
  listar: {
    useQuery: (pedidoId: number) =>
      useQuery({
        queryKey: ["pedidoCartuchos", "listar", pedidoId],
        enabled: Number.isFinite(pedidoId) && pedidoId > 0,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("pedido_cartuchos")
            .select("*")
            .eq("pedido_id", pedidoId)
            .order("id", { ascending: true });
          if (error) throw error;
          const ids = Array.from(new Set((data ?? []).map((r: any) => r.cartucho_id).filter(Boolean))) as number[];
          let mapModelos = new Map<number, any>();
          if (ids.length) {
            const { data: mods, error: e2 } = await supabase
              .from("cartuchos_cadastro")
              .select("id, modelo_01, modelo_02")
              .in("id", ids);
            if (e2) throw e2;
            mapModelos = new Map((mods ?? []).map((m: any) => [m.id, m]));
          }
          return (data ?? []).map((r: any) => toApp(r, r.cartucho_id ? mapModelos.get(r.cartucho_id) : null));
        },
      }),
  },
  adicionar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          requirePermission("cartucho.editar");
          const owner_id = await getOwnerId();
          const { data, error } = await supabase
            .from("pedido_cartuchos")
            .insert({
              owner_id,
              pedido_id: input.pedidoId,
              ...toDb(input),
              status: input.status || "em_espera",
              protegido: input.protegido ? 1 : 0,
            })
            .select("*")
            .single();
          if (error) throw error;
          await registrarAuditoria({
            action: "pedidoCartucho.adicionar",
            entityType: "pedido_cartuchos",
            entityId: data.id,
            entityLabel: data.codigo,
            details: { depois: data },
          });
          return toApp(data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidoCartuchos"] }),
      });
    },
  },
  atualizar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const somenteStatus = Object.keys(rest_keys(input)).every((k) => k === "status");
          requirePermission(somenteStatus ? "cartucho.status" : "cartucho.editar");
          const { id, ...rest } = input;
          const { data: antes } = await supabase.from("pedido_cartuchos").select("*").eq("id", id).maybeSingle();
          const { data, error } = await supabase
            .from("pedido_cartuchos")
            .update(toDb(rest))
            .eq("id", id)
            .select("*")
            .single();
          if (error) throw error;
          await registrarAuditoria({
            action: "pedidoCartucho.alterar",
            entityType: "pedido_cartuchos",
            entityId: id,
            entityLabel: data.codigo,
            details: diff(antes as any, data as any),
          });
          return toApp(data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidoCartuchos"] }),
      });
    },
  },
  remover: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          requirePermission("cartucho.editar");
          const { data: antes } = await supabase.from("pedido_cartuchos").select("*").eq("id", id).maybeSingle();
          const { error } = await supabase.from("pedido_cartuchos").delete().eq("id", id);
          if (error) throw error;
          await registrarAuditoria({
            action: "pedidoCartucho.remover",
            entityType: "pedido_cartuchos",
            entityId: id,
            entityLabel: (antes as any)?.codigo ?? null,
            details: { antes, depois: null },
          });
          return { id };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidoCartuchos"] }),
      });
    },
  },
};
