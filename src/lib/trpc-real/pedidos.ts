import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/db";
import { registrarAuditoria, diff } from "@/lib/audit";
import { requirePermission } from "@/lib/guard";

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
    observacaoGeral: r.observacao_geral ?? null,
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
  // Usa o MAIOR número já utilizado (não o último registro) para nunca
  // reaproveitar o número de um pedido excluído.
  const { data, error } = await supabase.from("pedidos").select("numero");
  if (error) throw error;
  const max = (data ?? []).reduce((m: number, r: any) => {
    const n = parseInt(String(r.numero).replace(/\D/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return String(max + 1).padStart(4, "0");
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
  const { error: e2 } = await supabase.from("pedido_cartuchos").insert(rows as any);
  if (e2) throw e2;
}

const DEFEITO_STATUS = ["circuito_queimado", "defeito_cabeca"] as const;

function defeitoLabel(status: string) {
  return status === "circuito_queimado" ? "CIRCUITO QUEIMADO" : "DEFEITO NA CABEÇA";
}

/**
 * Gera (ou regenera) o pedido de remanufatura a partir de um pedido normal finalizado.
 * Mantém o mesmo número (REM-<numero do pedido>) para não duplicar pedidos ao reabrir/finalizar.
 */
async function gerarRemanAPartirDoPedido(pedidoId: number) {
  const owner_id = await getOwnerId();

  const { data: pedido, error: ePed } = await supabase
    .from("pedidos")
    .select("id, numero, cliente_id, observacao_geral")
    .eq("id", pedidoId)
    .single();
  if (ePed) throw ePed;

  const { data: cliente, error: eCli } = await supabase
    .from("clientes")
    .select("id, commercial_profile")
    .eq("id", pedido.cliente_id)
    .single();
  if (eCli) throw eCli;

  const profile = cliente.commercial_profile || "CLIENTE_FINAL";
  const orderNumber = `REM-${pedido.numero}`;

  // Reaproveitar pedido reman existente pelo VÍNCULO com o pedido (não pelo número),
  // evitando que um pedido novo caia dentro do reman de outro pedido.
  const { data: existente } = await supabase
    .from("reman_orders")
    .select("id")
    .eq("pedido_id", pedidoId)
    .maybeSingle();

  let remanOrderId: number;
  if (existente) {
    remanOrderId = (existente as any).id;
    await supabase
      .from("reman_orders")
      .update({
        order_number: orderNumber,
        observacao_geral: (pedido as any).observacao_geral ?? null,
      } as any)
      .eq("id", remanOrderId);
    const { data: oldItems } = await supabase
      .from("reman_order_items")
      .select("id")
      .eq("order_id", remanOrderId);
    const oldIds = (oldItems ?? []).map((i: any) => i.id);
    if (oldIds.length) await supabase.from("reman_order_units").delete().in("order_item_id", oldIds);
    await supabase.from("reman_order_items").delete().eq("order_id", remanOrderId);
  } else {
    const { data: novo, error: eNovo } = await supabase
      .from("reman_orders")
      .insert({
        owner_id,
        pedido_id: pedidoId,
        order_number: orderNumber,
        cliente_id: pedido.cliente_id,

        commercial_profile_snapshot: profile,
        status: "finalizado",
        subtotal: "0",
        discount: "0",
        total: "0",
        notes: `Gerado automaticamente a partir do Pedido #${pedido.numero}`,
        observacao_geral: (pedido as any).observacao_geral ?? null,
      } as any)
      .select("id")
      .single();
    if (eNovo) throw eNovo;
    remanOrderId = novo.id;
  }

  const { data: cartuchos, error: eCart } = await supabase
    .from("pedido_cartuchos")
    .select("*")
    .eq("pedido_id", pedidoId);
  if (eCart) throw eCart;

  const modeloIds = Array.from(
    new Set((cartuchos ?? []).map((c: any) => c.cartucho_id).filter(Boolean)),
  ) as number[];
  const { data: modelos } = modeloIds.length
    ? await supabase
        .from("cartuchos_cadastro")
        .select("id, modelo_01, modelo_02, price_final_customer, price_reseller")
        .in("id", modeloIds)
    : { data: [] as any[] };
  const mapModelo = new Map<number, any>((modelos ?? []).map((m: any) => [m.id, m]));

  type Grupo = {
    cartuchoId: number;
    modelo: any;
    unidades: { codigo: string | null; pesoSaida: string | null; garantia: boolean; defeito: string | null }[];
  };
  const grupos = new Map<number, Grupo>();

  for (const c of cartuchos ?? []) {
    const isDefeito = (DEFEITO_STATUS as readonly string[]).includes(c.status);
    const isGarantia = c.status === "garantia";
    if (c.status !== "funcionando" && !isDefeito && !isGarantia) continue;
    const key = c.cartucho_id || 0;
    if (!grupos.has(key)) {
      grupos.set(key, { cartuchoId: key, modelo: mapModelo.get(key) ?? null, unidades: [] });
    }
    grupos.get(key)!.unidades.push({
      codigo: c.codigo,
      pesoSaida: c.peso_saida,
      garantia: isGarantia,
      defeito: isDefeito ? defeitoLabel(c.status) : null,
    });
  }

  let subtotal = 0;

  for (const grupo of Array.from(grupos.values())) {
    const unitPrice = Number(
      profile === "REVENDA"
        ? grupo.modelo?.price_reseller || 0
        : grupo.modelo?.price_final_customer || 0,
    );
    // Cobrança apenas de cartuchos funcionando e fora de garantia
    const cobraveis = grupo.unidades.filter((u) => !u.defeito && !u.garantia).length;
    const lineTotal = unitPrice * cobraveis;
    subtotal += lineTotal;

    const { data: item, error: eItem } = await supabase
      .from("reman_order_items")
      .insert({
        owner_id,
        order_id: remanOrderId,
        cartucho_id: grupo.cartuchoId,
        description_snapshot: grupo.modelo?.modelo_01 || "SEM MODELO",
        model_code_snapshot: grupo.modelo?.modelo_02 || null,
        quantity: cobraveis,
        unit_price: unitPrice.toFixed(2),
        price_source: profile,
        line_total: lineTotal.toFixed(2),
      } as any)
      .select("id")
      .single();
    if (eItem) throw eItem;

    const rows = grupo.unidades.map((u) => ({
      owner_id,
      order_item_id: item.id,
      cartucho_id: grupo.cartuchoId,
      unit_code: u.codigo || "SEM-CODIGO",
      status: u.defeito ? "COM_PROBLEMA" : "FUNCIONANDO",
      defect_type: u.defeito,
      output_weight: u.defeito ? null : u.pesoSaida,
      is_warranty: u.garantia && !u.defeito,
    }));
    if (rows.length) {
      const { error: eUnits } = await supabase.from("reman_order_units").insert(rows as any);
      if (eUnits) throw eUnits;
    }
  }

  const { data: atual } = await supabase
    .from("reman_orders")
    .select("discount")
    .eq("id", remanOrderId)
    .maybeSingle();
  const discount = Number(atual?.discount || 0);
  await supabase
    .from("reman_orders")
    .update({
      subtotal: subtotal.toFixed(2),
      total: Math.max(0, subtotal - discount).toFixed(2),
    } as any)
    .eq("id", remanOrderId);

  return { remanOrderId, orderNumber };
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
          requirePermission("pedido.criar");
          const owner_id = await getOwnerId();
          const numero = input.numero || (await proximoNumero());
          const { data, error } = await supabase
            .from("pedidos")
            .insert({
              owner_id,
              numero,
              cliente_id: input.clienteId,
              status: "aberto",
              observacao_geral: input.observacaoGeral || null,
            })
            .select("*")
            .single();
          if (error) throw error;
          if (input.cartuchos?.length) {
            const rows = input.cartuchos.map((c: any) => ({
              owner_id,
              pedido_id: data.id,
              cartucho_id: c.cartuchoId ? Number(c.cartuchoId) : null,
              codigo: c.codigo || null,
              peso_chegada:
                c.pesoChegada != null && c.pesoChegada !== ""
                  ? String(c.pesoChegada).replace(",", ".")
                  : null,
              peso_saida:
                c.pesoSaida != null && c.pesoSaida !== ""
                  ? String(c.pesoSaida).replace(",", ".")
                  : null,
              protegido: c.protegido ? 1 : 0,
              status: c.status || "em_espera",
              observacoes: c.observacoes || null,
            }));
            // Insert único = atômico. Se falhar, desfaz o pedido para não deixar registro órfão.
            const { error: e2 } = await supabase.from("pedido_cartuchos").insert(rows);
            if (e2) {
              await supabase.from("pedidos").delete().eq("id", data.id);
              throw e2;
            }
          }
          await registrarAuditoria({
            action: "pedido.criar",
            entityType: "pedidos",
            entityId: String(data.id),
            entityLabel: `Pedido #${numero}`,
            details: { numero, clienteId: input.clienteId, itens: input.cartuchos?.length ?? 0 },
          });
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
          requirePermission("pedido.finalizar");
          const { data, error } = await supabase
            .from("pedidos")
            .update({ status: "finalizado", data_finalizacao: new Date().toISOString() })
            .eq("id", id)
            .select("*")
            .single();
          if (error) throw error;
          const reman = await gerarRemanAPartirDoPedido(id);
          await registrarAuditoria({
            action: "pedido.finalizar",
            entityType: "pedidos",
            entityId: id,
            entityLabel: `Pedido #${data.numero}`,
            details: { depois: { status: "finalizado", remanOrderNumber: reman.orderNumber } },
          });
          await registrarAuditoria({
            action: "reman.finalizar",
            entityType: "reman_orders",
            entityId: reman.remanOrderId,
            entityLabel: reman.orderNumber,
          });
          return { ...toApp(data), remanOrderId: reman.remanOrderId, remanOrderNumber: reman.orderNumber };
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["pedidos"] });
          qc.invalidateQueries({ queryKey: ["remanOrders"] });
          qc.invalidateQueries({ queryKey: ["remanOrderItems"] });
        },

      });
    },
  },
  reabrir: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          requirePermission("pedido.reabrir");
          const { data, error } = await supabase
            .from("pedidos")
            .update({ status: "aberto", data_finalizacao: null })
            .eq("id", id)
            .select("*")
            .single();
          if (error) throw error;
          await registrarAuditoria({
            action: "pedido.reabrir",
            entityType: "pedidos",
            entityId: id,
            entityLabel: `Pedido #${data.numero}`,
            details: { antes: { status: "finalizado" }, depois: { status: "aberto" } },
          });
          return toApp(data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pedidos"] }),
      });
    },
  },
  atualizarObservacao: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: { id: number; observacaoGeral: string | null }) => {
          requirePermission("pedido.editar");
          const { data: antes } = await supabase
            .from("pedidos")
            .select("*")
            .eq("id", input.id)
            .maybeSingle();
          const { data, error } = await supabase
            .from("pedidos")
            .update({ observacao_geral: input.observacaoGeral || null } as any)
            .eq("id", input.id)
            .select("*")
            .single();
          if (error) throw error;
          await registrarAuditoria({
            action: "pedido.editar",
            entityType: "pedidos",
            entityId: input.id,
            entityLabel: `Pedido #${data.numero}`,
            details: diff(antes ?? {}, data),
          });
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
          requirePermission("pedido.deletar");
          const { data: antes } = await supabase.from("pedidos").select("*").eq("id", id).maybeSingle();
          await supabase.from("pedido_cartuchos").delete().eq("pedido_id", id);
          const { error } = await supabase.from("pedidos").delete().eq("id", id);
          if (error) throw error;
          await registrarAuditoria({
            action: "pedido.deletar",
            entityType: "pedidos",
            entityId: id,
            entityLabel: (antes as any)?.numero ? `Pedido #${(antes as any).numero}` : null,
            details: { antes, depois: null },
          });
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
          requirePermission("pedido.criar");
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
