import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Tipo = "geral" | "codigo" | "cliente" | "telefone" | "cpf" | "cnpj" | "pedido";

/** Normaliza texto removendo acentos e caixa, para busca insensível a acentuação */
function norm(v: unknown) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matches(termo: string, ...campos: unknown[]) {
  const t = norm(termo);
  if (!t) return false;
  return campos.some((c) => norm(c).includes(t));
}

const CLIENTE_COLS = "id, nome, telefone, telefone2, cpf, cnpj, commercial_profile";


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

/** Busca cartuchos de pedidos por código ou modelo, ignorando acentos e caixa */
async function cartuchosPorCodigoOuModelo(termo: string, apenasCodigo: boolean) {
  const { data: mods } = await supabase
    .from("cartuchos_cadastro")
    .select("id, modelo_01, modelo_02");
  const mapMod = new Map<number, any>((mods ?? []).map((m: any) => [m.id, m]));
  const modeloIds = apenasCodigo
    ? []
    : (mods ?? [])
        .filter((m: any) => matches(termo, m.modelo_01, m.modelo_02))
        .map((m: any) => m.id);

  const { data, error } = await supabase
    .from("pedido_cartuchos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []).filter(
    (r: any) => matches(termo, r.codigo) || modeloIds.includes(r.cartucho_id),
  );
  if (!rows.length) return [];

  const pedidoIds = Array.from(new Set(rows.map((r: any) => r.pedido_id).filter(Boolean)));
  const { data: peds } = pedidoIds.length
    ? await supabase.from("pedidos").select("id, numero, cliente_id").in("id", pedidoIds as number[])
    : { data: [] as any[] };

  const clienteIds = Array.from(new Set((peds ?? []).map((p: any) => p.cliente_id).filter(Boolean)));
  let nomes = new Map<number, string>();
  if (clienteIds.length) {
    const { data: cs } = await supabase.from("clientes").select("id, nome").in("id", clienteIds as number[]);
    nomes = new Map((cs ?? []).map((c: any) => [c.id, c.nome]));
  }
  const mapPed = new Map<number, any>((peds ?? []).map((p: any) => [p.id, p]));

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

async function clientesFiltrados(termo: string, campos: string[]) {
  const { data, error } = await supabase.from("clientes").select(CLIENTE_COLS).order("nome");
  if (error) throw error;
  return (data ?? [])
    .filter((c: any) => matches(termo, ...campos.map((f) => c[f])))
    .map(clienteToApp);
}

async function buscar(tipo: Tipo, termo: string) {
  const t = termo.trim();
  if (!t) return { pedidos: [], cartuchos: [], clientes: [] };

  if (tipo === "codigo") {
    return { pedidos: [], cartuchos: await cartuchosPorCodigoOuModelo(t, true), clientes: [] };
  }

  const camposCliente: Record<string, string[]> = {
    cliente: ["nome"],
    telefone: ["telefone", "telefone2"],
    cpf: ["cpf"],
    cnpj: ["cnpj"],
  };
  if (camposCliente[tipo]) {
    return { pedidos: [], cartuchos: [], clientes: await clientesFiltrados(t, camposCliente[tipo]) };
  }

  if (tipo === "pedido") {
    const pedidos = await pedidosPorFiltro((q: any) => q);
    return { pedidos: pedidos.filter((p: any) => matches(t, p.numero)), cartuchos: [], clientes: [] };
  }

  // geral
  const clientesList = await clientesFiltrados(t, ["nome", "telefone", "telefone2", "cpf", "cnpj"]);
  const clienteIds = new Set(clientesList.map((c: any) => c.id));

  const [todosPedidos, cartuchosList] = await Promise.all([
    pedidosPorFiltro((q: any) => q),
    cartuchosPorCodigoOuModelo(t, false),
  ]);
  const pedidosList = todosPedidos.filter(
    (p: any) => matches(t, p.numero, p.clienteNome) || clienteIds.has(p.clienteId),
  );

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
