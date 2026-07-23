import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function getOwnerId() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Usuário não autenticado");
  return id;
}

function toApp(r: any, clienteNome?: string | null) {
  return {
    id: r.id,
    numero: r.numero,
    clienteId: r.cliente_id,
    clienteNome: clienteNome ?? r.clienteNome ?? null,
    status: r.status,
    dataCriacao: r.created_at,
    dataFinalizacao: r.data_finalizacao,
  };
}

async function fetchClienteNomes(clienteIds: number[]) {
  if (!clienteIds.length) return new Map<number, string>();
  const ids = Array.from(new Set(clienteIds));
  const { data, error } = await supabase.from("clientes").select("id, nome").in("id", ids);
  if (error) throw error;
  return new Map<number, string>((data ?? []).map((c: any) => [c.id, c.nome]));
}

async function proximoNumero() {
  const { data, error } = await supabase
    .from("pedidos")
    .select("numero")
    .order("id", { ascending: false })
    .limit(1);
  if (error) throw error;
  const last = data?.[0]?.numero;
  const n = last ? parseInt(String(last).replace(/\D/g, ""), 10) : 0;
  return String((isNaN(n) ? 0 : n) + 1).padStart(4, "0");
}

async function copiarCartuchosDoPedido(origemId: number, destinoId: number, owner_id: string) {
  const { data: itens, error } = await supabase
    .from("pedido_cartuchos")
    .select("*")
    .eq("pedido_id", origemId);
  if (error) throw error;
  if (!itens?.length) return;
  const rows = itens.map((c: any) => ({
    owner_id,
    pedido_id: destinoId,
    cartucho_id: c.cartucho_id,
    codigo: c.codigo,
    peso_chegada: c.peso_chegada,
    peso_saida: c.peso_saida,
    protegido: c.protegido,
    status: "em_espera",
    observacoes: c.observacoes,
  }));
  const { error: e2 } = await supabase.from("pedido_cartuchos").insert(rows);
  if (e2) throw e2;
}

const LIST_KEY = ["pedidos", "listar"] as const;

export const pedidosApi = {
  listar: {
    useQuery: () =>
      useQuery({
        queryKey: LIST_KEY,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("pedidos")
            .select("*")
            .order("id", { ascending: false });
          if (error) throw error;
          const nomes = await fetchClienteNomes((data ?? []).map((p: any) => p.cliente_id));
          return (data ?? []).map((p: any) => toApp(p, nomes.get(p.cliente_id) ?? null));
        },
      }),
  },
  buscar: {
    useQuery: (id: number) =>
      useQuery({
        queryKey: ["pedidos", "buscar", id],
        enabled: Number.isFinite(id) && id > 0,
        queryFn: async () => {
          const { data, error } = await supabase.from("pedidos").select("*").eq("id", id).maybeSingle();
          if (error) throw error;
          if (!data) return null;
          const nomes = await fetchClienteNomes([data.cliente_id]);
          return toApp(data, nomes.get(data.cliente_id) ?? null);
        },
      }),
  },
  porCliente: {
    useQuery: (clienteId: number) =>
      useQuery({
        queryKey: ["pedidos", "porCliente", clienteId],
        enabled: Number.isFinite(clienteId) && clienteId > 0,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("pedidos")
            .select("*")
            .eq("cliente_id", clienteId)
            .order("id", { ascending: false });
          if (error) throw error;
          return (data ?? []).map((p: any) => toApp(p));
        },
      }),
  },
  obterProximoNumero: {
    useQuery: () =>
      useQuery({
        queryKey: ["pedidos", "obterProximoNumero"],
        queryFn: proximoNumero,
      }),
  },
  criar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const owner_id = await getOwnerId();
          const numero = input.numero || (await proximoNumero());
          const { data, error } = await supabase
            .from("pedidos")
            .insert({ owner_id, numero, cliente_id: input.clienteId, status: "aberto" })
            .select("*")
            .single();
          if (error) throw error;
          if (input.cartuchos?.length) {
            const rows = input.cartuchos.map((c: any) => ({
              owner_id,
              pedido_id: data.id,
              cartucho_id: c.cartuchodId ? Number(c.cartuchodId) : null,
              codigo: c.codigo || null,
              peso_chegada: c.pesoCheagada != null ? String(c.pesoCheagada).replace(",", ".") : null,
              peso_saida: c.pesoSaida != null ? String(c.pesoSaida).replace(",", ".") : null,
              protegido: c.protegido ? 1 : 0,
              status: c.status || "em_espera",
              observacoes: c.observacoes || null,
            }));
            const { error: e2 } = await supabase.from("pedido_cartuchos").insert(rows);
            if (e2) throw e2;
          }
          return toApp(data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
      });
    },
  },
  finalizar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          const { data, error } = await supabase
            .from("pedidos")
            .update({ status: "finalizado", data_finalizacao: new Date().toISOString() })
            .eq("id", id)
            .select("*")
            .single();
          if (error) throw error;
          return { ...toApp(data), remanOrderId: null };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
      });
    },
  },
  reabrir: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          const { data, error } = await supabase
            .from("pedidos")
            .update({ status: "aberto", data_finalizacao: null })
            .eq("id", id)
            .select("*")
            .single();
          if (error) throw error;
          return toApp(data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
      });
    },
  },
  deletar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          await supabase.from("pedido_cartuchos").delete().eq("pedido_id", id);
          const { error } = await supabase.from("pedidos").delete().eq("id", id);
          if (error) throw error;
          return { id };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
      });
    },
  },
  duplicar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          const owner_id = await getOwnerId();
          const { data: origem, error } = await supabase
            .from("pedidos")
            .select("*")
            .eq("id", id)
            .single();
          if (error) throw error;
          const numero = await proximoNumero();
          const { data: novo, error: e2 } = await supabase
            .from("pedidos")
            .insert({
              owner_id,
              numero,
              cliente_id: origem.cliente_id,
              status: "aberto",
            })
            .select("*")
            .single();
          if (e2) throw e2;
          await copiarCartuchosDoPedido(id, novo.id, owner_id);
          return toApp(novo);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
      });
    },
  },
};
