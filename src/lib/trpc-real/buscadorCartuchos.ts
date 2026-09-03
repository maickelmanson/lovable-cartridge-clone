import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/db";

async function listar(dataInicio: Date, dataFim: Date, usuarioId?: string | null) {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  fim.setHours(23, 59, 59, 999);

  let query = supabase
    .from("pedido_cartuchos")
    .select("*")
    .eq("status", "funcionando");
  if (usuarioId) query = query.eq("usuario_id", usuarioId);

  const { data, error } = await query
    .gte("updated_at", inicio.toISOString())
    .lte("updated_at", fim.toISOString())
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as any[];
  const ids = Array.from(new Set(rows.map((r) => r.cartucho_id).filter(Boolean))) as number[];
  let mods = new Map<number, any>();
  if (ids.length) {
    const { data: m, error: e2 } = await supabase
      .from("cartuchos_cadastro")
      .select("id, modelo_01, modelo_02, price_final_customer")
      .in("id", ids);
    if (e2) throw e2;
    mods = new Map<number, any>((m ?? []).map((x: any) => [x.id, x]));
  }

  const cartuchos = rows.map((r) => {
    const mod = r.cartucho_id ? mods.get(r.cartucho_id) : null;
    return {
      id: r.id,
      codigo: r.codigo,
      modelo01: mod?.modelo_01 ?? null,
      modelo02: mod?.modelo_02 ?? r.codigo ?? null,
      preco: mod?.price_final_customer != null ? Number(mod.price_final_customer) : 0,
      usuarioId: r.usuario_id ?? null,
      dataFuncionando: r.updated_at,
    };
  });

  return {
    cartuchos,
    quantidade: cartuchos.length,
    valorTotal: cartuchos.reduce((s, c) => s + (c.preco ?? 0), 0),
    dataInicio: inicio.toISOString(),
    dataFim: fim.toISOString(),
  };
}

export const buscadorCartuchosApi = {
  listar: {
    useQuery: (
      input: { dataInicio: Date; dataFim: Date; usuarioId?: string | null },
      opts?: { enabled?: boolean },
    ) =>
      useQuery({
        queryKey: [
          "buscadorCartuchos",
          "listar",
          new Date(input.dataInicio).toISOString(),
          new Date(input.dataFim).toISOString(),
          input.usuarioId ?? "todos",
        ],
        enabled: opts?.enabled ?? true,
        queryFn: () => listar(input.dataInicio, input.dataFim, input.usuarioId ?? null),
      }),
  },
};
