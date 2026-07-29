import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Tipo = "geral" | "codigo" | "cliente" | "telefone" | "cpf" | "cnpj" | "pedido";

const CLIENTE_COLS = "id, nome, telefone, cpf, cnpj, commercial_profile";

function clienteToApp(c: any) {
  return {
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    cpf: c.cpf,
    cnpj: c.cnpj,
    commercialProfile: c.commercial_profile,
  };
}

async function pedidosPorFiltro(filter: (q: any) => any) {
  const { data, error } = await filter(supabase.from("pedidos").select("*")).order("id", {
    ascending: false,
  });
  if (error) throw error;
  const rows = data ?? [];
  const clienteIds = Array.from(new Set(rows.map((r: any) => r.cliente_id).filter(Boolean)));
  let nomes = new Map<number, string>();
  if (clienteIds.length) {
    const { data: cs } = await supabase.from("clientes").select("id, nome").in("id", clienteIds as number[]);
    nomes = new Map((cs ?? []).map((c: any) => [c.id, c.nome]));
  }
  return rows.map((r: any) => ({
    id: r.id,
    numero: r.numero,
    clienteId: r.cliente_id,
    clienteNome: nomes.get(r.cliente_id) ?? null,
    status: r.status,
    dataCriacao: r.created_at,
    dataFinalizacao: r.data_finalizacao,
  }));
}

async function cartuchosPorCodigoOuModelo(termo: string, apenasCodigo: boolean) {
  const like = `%${termo}%`;
  let modeloIds: number[] = [];
  if (!apenasCodigo) {
    const { data: mods } = await supabase
      .from("cartuchos_cadastro")
      .select("id")
      .or(`modelo_01.ilike.${like},modelo_02.ilike.${like}`);
    modeloIds = (mods ?? []).map((m: any) => m.id);
  }

  const filtro = apenasCodigo || modeloIds.length === 0
    ? `codigo.ilike.${like}`
    : `codigo.ilike.${like},cartucho_id.in.(${modeloIds.join(",")})`;

  const { data, error } = await supabase
    .from("pedido_cartuchos")
    .select("*")
    .or(filtro)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return [];

  const cartuchoIds = Array.from(new Set(rows.map((r: any) => r.cartucho_id).filter(Boolean)));
  const pedidoIds = Array.from(new Set(rows.map((r: any) => r.pedido_id).filter(Boolean)));

  const [{ data: mods }, { data: peds }] = await Promise.all([
    cartuchoIds.length
      ? supabase.from("cartuchos_cadastro").select("id, modelo_01, modelo_02").in("id", cartuchoIds as number[])
      : Promise.resolve({ data: [] as any[] } as any),
    pedidoIds.length
      ? supabase.from("pedidos").select("id, numero, cliente_id").in("id", pedidoIds as number[])
      : Promise.resolve({ data: [] as any[] } as any),
  ]);

  const clienteIds = Array.from(new Set((peds ?? []).map((p: any) => p.cliente_id).filter(Boolean)));
  let nomes = new Map<number, string>();
  if (clienteIds.length) {
    const { data: cs } = await supabase.from("clientes").select("id, nome").in("id", clienteIds as number[]);
    nomes = new Map((cs ?? []).map((c: any) => [c.id, c.nome]));
  }

  const mapMod = new Map((mods ?? []).map((m: any) => [m.id, m]));
  const mapPed = new Map((peds ?? []).map((p: any) => [p.id, p]));

  return rows.map((r: any) => {
    const ped = mapPed.get(r.pedido_id);
    const mod = mapMod.get(r.cartucho_id);
    return {
      id: r.id,
      codigo: r.codigo,
      modelo01: mod?.modelo_01 ?? null,
      modelo02: mod?.modelo_02 ?? null,
      pedidoNumero: ped?.numero ?? null,
      clienteNome: ped ? nomes.get(ped.cliente_id) ?? null : null,
      dataInclusao: r.created_at,
      pedidoId: r.pedido_id,
    };
  });
}

async function buscar(tipo: Tipo, termo: string) {
  const t = termo.trim();
  if (!t) return { pedidos: [], cartuchos: [], clientes: [] };
  const like = `%${t}%`;

  if (tipo === "codigo") {
    return { pedidos: [], cartuchos: await cartuchosPorCodigoOuModelo(t, true), clientes: [] };
  }

  const colunaCliente: Record<string, string> = {
    cliente: "nome",
    telefone: "telefone",
    cpf: "cpf",
    cnpj: "cnpj",
  };
  if (colunaCliente[tipo]) {
    const { data, error } = await supabase
      .from("clientes")
      .select(CLIENTE_COLS)
      .ilike(colunaCliente[tipo], like)
      .order("nome");
    if (error) throw error;
    return { pedidos: [], cartuchos: [], clientes: (data ?? []).map(clienteToApp) };
  }

  if (tipo === "pedido") {
    return { pedidos: await pedidosPorFiltro((q: any) => q.ilike("numero", like)), cartuchos: [], clientes: [] };
  }

  // geral
  const { data: cli } = await supabase
    .from("clientes")
    .select(CLIENTE_COLS)
    .or(`nome.ilike.${like},telefone.ilike.${like},cpf.ilike.${like},cnpj.ilike.${like}`)
    .order("nome");
  const clientesList = (cli ?? []).map(clienteToApp);
  const clienteIds = clientesList.map((c: any) => c.id);

  const filtroPedidos = clienteIds.length
    ? `numero.ilike.${like},cliente_id.in.(${clienteIds.join(",")})`
    : `numero.ilike.${like}`;

  const [pedidosList, cartuchosList] = await Promise.all([
    pedidosPorFiltro((q: any) => q.or(filtroPedidos)),
    cartuchosPorCodigoOuModelo(t, false),
  ]);

  return { pedidos: pedidosList, cartuchos: cartuchosList, clientes: clientesList };
}

export const buscaApi = {
  avancada: {
    useQuery: (input: { tipo: Tipo; termo: string }, opts?: { enabled?: boolean }) =>
      useQuery({
        queryKey: ["busca", "avancada", input?.tipo, input?.termo],
        enabled: opts?.enabled ?? true,
        queryFn: () => buscar(input?.tipo ?? "geral", input?.termo ?? ""),
      }),
  },
};
