import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function resumoGeral() {
  const [pedidos, clientes, finalizados] = await Promise.all([
    supabase.from("pedidos").select("id", { count: "exact", head: true }),
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("status", "finalizado"),
  ]);
  const totalPedidos = pedidos.count ?? 0;
  const pedidosFinalizados = finalizados.count ?? 0;
  return {
    totalPedidos,
    totalClientes: clientes.count ?? 0,
    pedidosFinalizados,
    pedidosPendentes: totalPedidos - pedidosFinalizados,
  };
}

async function pedidosPorPeriodo(dataInicio: Date, dataFim: Date) {
  const fim = new Date(dataFim);
  fim.setHours(23, 59, 59, 999);
  const { data, error } = await supabase
    .from("pedidos")
    .select("created_at")
    .gte("created_at", new Date(dataInicio).toISOString())
    .lte("created_at", fim.toISOString());
  if (error) throw error;
  const map = new Map<string, number>();
  for (const r of data ?? []) {
    const dia = String((r as any).created_at).slice(0, 10);
    map.set(dia, (map.get(dia) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data_, total]) => ({ data: data_, total }));
}

async function clientesMaisAtivos(limite = 10) {
  const [{ data: cls, error: e1 }, { data: peds, error: e2 }] = await Promise.all([
    supabase.from("clientes").select("id, nome"),
    supabase.from("pedidos").select("cliente_id"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const counts = new Map<number, number>();
  for (const p of peds ?? []) {
    const id = (p as any).cliente_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return (cls ?? [])
    .map((c: any) => ({ clienteId: c.id, nomeCliente: c.nome, totalPedidos: counts.get(c.id) ?? 0 }))
    .sort((a, b) => b.totalPedidos - a.totalPedidos)
    .slice(0, limite);
}

async function modelosMaisSolicitados(limite = 10) {
  const [{ data: mods, error: e1 }, { data: itens, error: e2 }] = await Promise.all([
    supabase.from("cartuchos_cadastro").select("id, modelo_01, modelo_02"),
    supabase.from("pedido_cartuchos").select("cartucho_id"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const counts = new Map<number, number>();
  for (const i of itens ?? []) {
    const id = (i as any).cartucho_id;
    if (id == null) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return (mods ?? [])
    .map((m: any) => ({
      cartuchoId: m.id,
      modelo01: m.modelo_01,
      modelo02: m.modelo_02,
      totalSolicitacoes: counts.get(m.id) ?? 0,
    }))
    .sort((a, b) => b.totalSolicitacoes - a.totalSolicitacoes)
    .slice(0, limite);
}

async function statusPedidos() {
  const { data, error } = await supabase.from("pedidos").select("status");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    const s = (r as any).status;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([status, total]) => ({ status, total }));
}

export const analiseApi = {
  resumoGeral: {
    useQuery: () => useQuery({ queryKey: ["analise", "resumoGeral"], queryFn: resumoGeral }),
  },
  pedidosPorPeriodo: {
    useQuery: (input: { dataInicio: Date; dataFim: Date }) =>
      useQuery({
        queryKey: [
          "analise",
          "pedidosPorPeriodo",
          new Date(input.dataInicio).toISOString(),
          new Date(input.dataFim).toISOString(),
        ],
        queryFn: () => pedidosPorPeriodo(input.dataInicio, input.dataFim),
      }),
  },
  clientesMaisAtivos: {
    useQuery: (input?: { limite?: number }) =>
      useQuery({
        queryKey: ["analise", "clientesMaisAtivos", input?.limite ?? 10],
        queryFn: () => clientesMaisAtivos(input?.limite ?? 10),
      }),
  },
  modelosMaisSolicitados: {
    useQuery: (input?: { limite?: number }) =>
      useQuery({
        queryKey: ["analise", "modelosMaisSolicitados", input?.limite ?? 10],
        queryFn: () => modelosMaisSolicitados(input?.limite ?? 10),
      }),
  },
  statusPedidos: {
    useQuery: () => useQuery({ queryKey: ["analise", "statusPedidos"], queryFn: statusPedidos }),
  },
};
