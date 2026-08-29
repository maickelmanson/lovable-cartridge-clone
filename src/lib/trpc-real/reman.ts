import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/db";
import { requirePermission } from "@/lib/guard";
import { registrarAuditoria, diff } from "@/lib/audit";

async function getOwnerId() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Usuário não autenticado");
  return id;
}

function orderToApp(r: any, clienteNome?: string | null) {
  return {
    id: r.id,
    orderNumber: r.order_number,
    clienteId: r.cliente_id,
    clienteNome: clienteNome ?? null,
    commercialProfileSnapshot: r.commercial_profile_snapshot,
    status: r.status,
    subtotal: r.subtotal,
    discount: r.discount,
    total: r.total,
    notes: r.notes,
    criadoEm: r.created_at,
    atualizadoEm: r.updated_at,
  };
}

function itemToApp(r: any) {
  return {
    id: r.id,
    orderId: r.order_id,
    cartuchoId: r.cartucho_id,
    descriptionSnapshot: r.description_snapshot,
    modelCodeSnapshot: r.model_code_snapshot,
    // modelo01 = descrição completa, modelo02 = código abreviado
    modelo01: r.description_snapshot,
    modelo02: r.model_code_snapshot,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    priceSource: r.price_source,
    lineTotal: r.line_total,
    criadoEm: r.created_at,
  };
}

function unitToApp(r: any, modelo?: { modelo_01?: string | null; modelo_02?: string | null } | null) {
  return {
    id: r.id,
    orderItemId: r.order_item_id,
    cartuchoId: r.cartucho_id,
    unitCode: r.unit_code,
    status: r.status,
    defectType: r.defect_type,
    outputWeight: r.output_weight,
    isGarantia: !!r.is_warranty,
    modelo01: modelo?.modelo_01 ?? null,
    modelo02: modelo?.modelo_02 ?? null,
    notes: r.notes,
    criadoEm: r.created_at,
  };
}


async function proximoOrderNumber() {
  const { data, error } = await supabase
    .from("reman_orders")
    .select("order_number")
    .order("id", { ascending: false })
    .limit(1);
  if (error) throw error;
  const last = data?.[0]?.order_number;
  const n = last ? parseInt(String(last).replace(/\D/g, ""), 10) : 0;
  return `RM-${String((isNaN(n) ? 0 : n) + 1).padStart(4, "0")}`;
}

async function recomputeTotals(orderId: number) {
  const { data: items } = await supabase.from("reman_order_items").select("line_total").eq("order_id", orderId);
  const subtotal = (items ?? []).reduce((s: number, r: any) => s + Number(r.line_total || 0), 0);
  const { data: current } = await supabase
    .from("reman_orders")
    .select("discount")
    .eq("id", orderId)
    .maybeSingle();
  const discount = Number(current?.discount || 0);
  const total = Math.max(0, subtotal - discount);
  await supabase
    .from("reman_orders")
    .update({ subtotal: subtotal.toFixed(2), total: total.toFixed(2) } as any)
    .eq("id", orderId);
}

export const remanOrdersApi = {
  obterProximoNumero: {
    useQuery: () =>
      useQuery({ queryKey: ["remanOrders", "proximoNumero"], queryFn: proximoOrderNumber }),
  },
  listar: {
    useQuery: () =>
      useQuery({
        queryKey: ["remanOrders", "listar"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("reman_orders")
            .select("*")
            .order("id", { ascending: false });
          if (error) throw error;
          const ids = Array.from(new Set((data ?? []).map((r: any) => r.cliente_id))) as number[];
          const { data: clientes } = ids.length
            ? await supabase.from("clientes").select("id, nome").in("id", ids)
            : { data: [] as any[] };
          const map = new Map<number, string>((clientes ?? []).map((c: any) => [c.id, c.nome]));
          return (data ?? []).map((r: any) => orderToApp(r, map.get(r.cliente_id) ?? null));
        },
      }),
  },
  buscar: {
    useQuery: (id: number) =>
      useQuery({
        queryKey: ["remanOrders", "buscar", id],
        enabled: Number.isFinite(id) && id > 0,
        queryFn: async () => {
          const { data, error } = await supabase.from("reman_orders").select("*").eq("id", id).maybeSingle();
          if (error) throw error;
          if (!data) return null;
          const { data: cli } = await supabase
            .from("clientes")
            .select("nome, endereco, telefone, telefone2")
            .eq("id", data.cliente_id)
            .maybeSingle();
          return {
            ...orderToApp(data, cli?.nome ?? null),
            clienteEndereco: cli?.endereco ?? null,
            clienteTelefone: cli?.telefone ?? null,
            clienteTelefone2: cli?.telefone2 ?? null,
            observacaoGeral: (data as any).observacao_geral ?? null,
          };
        },
      }),
  },
  relatorio: {
    useQuery: (id: number) =>
      useQuery({
        queryKey: ["remanOrders", "relatorio", id],
        enabled: Number.isFinite(id) && id > 0,
        queryFn: async () => {
          const { data: items } = await supabase
            .from("reman_order_items")
            .select("*")
            .eq("order_id", id);
          const itemIds = (items ?? []).map((i: any) => i.id);
          const { data: units } = itemIds.length
            ? await supabase
                .from("reman_order_units")
                .select("*")
                .in("order_item_id", itemIds)
                .order("id", { ascending: true })
            : { data: [] as any[] };

          // Buscar modelos (modelo01/modelo02) das unidades
          const cartuchoIds = Array.from(
            new Set((units ?? []).map((u: any) => u.cartucho_id).filter(Boolean)),
          ) as number[];
          const { data: mods } = cartuchoIds.length
            ? await supabase
                .from("cartuchos_cadastro")
                .select("id, modelo_01, modelo_02")
                .in("id", cartuchoIds)
            : { data: [] as any[] };
          const mapMod = new Map<number, any>((mods ?? []).map((m: any) => [m.id, m]));

          // Dados de origem (peso de chegada / protegido) vindos do pedido original
          const codigos = Array.from(
            new Set((units ?? []).map((u: any) => u.unit_code).filter(Boolean)),
          ) as string[];
          const { data: origem } = codigos.length
            ? await supabase
                .from("pedido_cartuchos")
                .select("codigo, peso_chegada, protegido")
                .in("codigo", codigos)
            : { data: [] as any[] };
          const mapOrigem = new Map<string, any>(
            (origem ?? []).map((o: any) => [String(o.codigo), o]),
          );

          const todas = (units ?? []).map((u: any) => {
            const base = unitToApp(u, mapMod.get(u.cartucho_id) ?? null);
            const o = mapOrigem.get(String(u.unit_code));
            return {
              ...base,
              inputWeight: o?.peso_chegada ?? null,
              protegido: !!(o?.protegido),
            };
          });
          const funcionando = todas.filter((u) => u.status === "FUNCIONANDO" && !u.isGarantia);
          const garantia = todas.filter((u) => u.status === "FUNCIONANDO" && u.isGarantia);
          const comProblema = todas.filter((u) => u.status === "COM_PROBLEMA");

          return {
            totalItens: items?.length || 0,
            totalUnidades: todas.length,
            funcionando,
            garantia,
            comProblema,
          };
        },
      }),
  },

  criar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const owner_id = await getOwnerId();
          const { data: cli, error: eCli } = await supabase
            .from("clientes")
            .select("commercial_profile")
            .eq("id", input.clienteId)
            .single();
          if (eCli) throw eCli;
          const orderNumber = input.numero || (await proximoOrderNumber());
          const { data, error } = await supabase
            .from("reman_orders")
            .insert({
              owner_id,
              order_number: orderNumber,
              cliente_id: input.clienteId,
              commercial_profile_snapshot: cli.commercial_profile,
              status: "aberto",
              notes: input.notes || null,
            })
            .select("*")
            .single();
          if (error) throw error;
          return { insertId: data.id, ...orderToApp(data) };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["remanOrders"] }),
      });
    },
  },
  atualizar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { id, ...rest } = input;
          const patch: any = {};
          if ("status" in rest) patch.status = rest.status;
          if ("discount" in rest) patch.discount = String(rest.discount).replace(",", ".");
          if ("notes" in rest) patch.notes = rest.notes;
          const { data, error } = await supabase
            .from("reman_orders")
            .update(patch)
            .eq("id", id)
            .select("*")
            .single();
          if (error) throw error;
          if ("discount" in rest) await recomputeTotals(id);
          await registrarAuditoria({
            action: rest.status === "finalizado" ? "reman.finalizar" : "reman.alterar",
            entityType: "reman_orders",
            entityId: id,
            entityLabel: data.order_number,
            details: { depois: patch },
          });
          return orderToApp(data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["remanOrders"] }),
      });
    },
  },
  reabrir: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          requirePermission("pedido.reabrir");
          const { error } = await supabase.from("reman_orders").update({ status: "aberto" }).eq("id", id);
          if (error) throw error;
          await registrarAuditoria({
            action: "reman.reabrir",
            entityType: "reman_orders",
            entityId: id,
            details: { depois: { status: "aberto" } },
          });
          return { id };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["remanOrders"] }),
      });
    },
  },
  deletar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          const { data: items } = await supabase.from("reman_order_items").select("id").eq("order_id", id);
          const itemIds = (items ?? []).map((i: any) => i.id);
          if (itemIds.length) {
            await supabase.from("reman_order_units").delete().in("order_item_id", itemIds);
          }
          await supabase.from("reman_order_items").delete().eq("order_id", id);
          requirePermission("pedido.deletar");
          const { error } = await supabase.from("reman_orders").delete().eq("id", id);
          if (error) throw error;
          await registrarAuditoria({
            action: "reman.deletar",
            entityType: "reman_orders",
            entityId: id,
            details: { antes: { id }, depois: null },
          });
          return { id };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["remanOrders"] }),
      });
    },
  },
};

export const remanOrderItemsApi = {
  listar: {
    useQuery: (orderId: number) =>
      useQuery({
        queryKey: ["remanOrderItems", "listar", orderId],
        enabled: Number.isFinite(orderId) && orderId > 0,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("reman_order_items")
            .select("*")
            .eq("order_id", orderId)
            .order("id", { ascending: true });
          if (error) throw error;
          return (data ?? []).map(itemToApp);
        },
      }),
  },
  criar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const owner_id = await getOwnerId();
          const { data: order, error: eO } = await supabase
            .from("reman_orders")
            .select("commercial_profile_snapshot")
            .eq("id", input.orderId)
            .single();
          if (eO) throw eO;
          const { data: cart, error: eC } = await supabase
            .from("cartuchos_cadastro")
            .select("*")
            .eq("id", input.cartuchoId)
            .single();
          if (eC) throw eC;
          const priceSource = order.commercial_profile_snapshot;
          const unitPrice = Number(
            priceSource === "REVENDA" ? cart.price_reseller || 0 : cart.price_final_customer || 0,
          );
          const quantity = Number(input.quantity || 1);
          const lineTotal = unitPrice * quantity;
          const { data, error } = await supabase
            .from("reman_order_items")
            .insert({
              owner_id,
              order_id: input.orderId,
              cartucho_id: input.cartuchoId,
              description_snapshot: cart.modelo_01,
              model_code_snapshot: cart.modelo_02,
              quantity,
              unit_price: unitPrice.toFixed(2),
              price_source: priceSource,
              line_total: lineTotal.toFixed(2),
            } as any)
            .select("*")
            .single();
          if (error) throw error;
          await recomputeTotals(input.orderId);
          return itemToApp(data);
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["remanOrderItems"] });
          qc.invalidateQueries({ queryKey: ["remanOrders"] });
        },
      });
    },
  },
  deletar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const id = typeof input === "number" ? input : input.id;
          const orderId = typeof input === "number" ? null : input.orderId;
          await supabase.from("reman_order_units").delete().eq("order_item_id", id);
          const { error } = await supabase.from("reman_order_items").delete().eq("id", id);
          if (error) throw error;
          if (orderId) await recomputeTotals(orderId);
          return { id };
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["remanOrderItems"] });
          qc.invalidateQueries({ queryKey: ["remanOrders"] });
        },
      });
    },
  },
};

export const remanOrderUnitsApi = {
  listar: {
    useQuery: (orderItemId: number) =>
      useQuery({
        queryKey: ["remanOrderUnits", "listar", orderItemId],
        enabled: Number.isFinite(orderItemId) && orderItemId > 0,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("reman_order_units")
            .select("*")
            .eq("order_item_id", orderItemId)
            .order("id", { ascending: true });
          if (error) throw error;
          return (data ?? []).map((u: any) => unitToApp(u));
        },
      }),
  },
  criar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const owner_id = await getOwnerId();
          const { data, error } = await supabase
            .from("reman_order_units")
            .insert({
              owner_id,
              order_item_id: input.orderItemId,
              cartucho_id: input.cartuchoId,
              unit_code: input.unitCode,
              status: input.status || "FUNCIONANDO",
              defect_type: input.defectType || null,
              output_weight:
                input.outputWeight != null && input.outputWeight !== ""
                  ? String(input.outputWeight).replace(",", ".")
                  : null,
              notes: input.notes || null,
              is_warranty: !!input.isGarantia,

            } as any)
            .select("*")
            .single();
          if (error) throw error;
          return unitToApp(data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["remanOrderUnits"] }),
      });
    },
  },
  deletar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          const { error } = await supabase.from("reman_order_units").delete().eq("id", id);
          if (error) throw error;
          return { id };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["remanOrderUnits"] }),
      });
    },
  },
};
