import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/db";

function toApp(r: any) {
  return {
    id: r.id,
    modelo01: r.modelo_01,
    modelo02: r.modelo_02,
    priceFinalCustomer: r.price_final_customer ?? null,
    priceReseller: r.price_reseller ?? null,
    criadoEm: r.created_at,
  };
}

function toDb(i: any) {
  const o: any = {};
  if ("modelo01" in i) o.modelo_01 = i.modelo01;
  if ("modelo02" in i) o.modelo_02 = i.modelo02;
  if ("priceFinalCustomer" in i)
    o.price_final_customer = i.priceFinalCustomer === "" || i.priceFinalCustomer == null ? null : i.priceFinalCustomer;
  if ("priceReseller" in i)
    o.price_reseller = i.priceReseller === "" || i.priceReseller == null ? null : i.priceReseller;
  return o;
}

const KEY = ["cartuchos", "listar"] as const;

export const cartuchosApi = {
  listar: {
    useQuery: () =>
      useQuery({
        queryKey: KEY,
        queryFn: async () => {
          const { data, error } = await supabase
            .from("cartuchos_cadastro")
            .select("*")
            .order("modelo_02", { ascending: true });
          if (error) throw error;
          return (data ?? []).map(toApp);
        },
      }),
  },
  buscarPorId: {
    useQuery: (id: number) =>
      useQuery({
        queryKey: ["cartuchos", "buscar", id],
        enabled: id > 0,
        queryFn: async () => {
          const { data, error } = await supabase.from("cartuchos_cadastro").select("*").eq("id", id).maybeSingle();
          if (error) throw error;
          return data ? toApp(data) : null;
        },
      }),
  },
  criar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data: userData } = await supabase.auth.getUser();
          const owner_id = userData.user?.id;
          if (!owner_id) throw new Error("Usuário não autenticado");
          const { data, error } = await supabase
            .from("cartuchos_cadastro")
            .insert({ ...toDb(input), owner_id })
            .select("*")
            .single();
          if (error) throw error;
          return toApp(data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["cartuchos"] }),
      });
    },
  },
  atualizar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { id, ...rest } = input;
          const { data, error } = await supabase
            .from("cartuchos_cadastro")
            .update(toDb(rest))
            .eq("id", id)
            .select("*")
            .single();
          if (error) throw error;
          return toApp(data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["cartuchos"] }),
      });
    },
  },
  deletar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: number) => {
          const { error } = await supabase.from("cartuchos_cadastro").delete().eq("id", id);
          if (error) throw error;
          return { id };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["cartuchos"] }),
      });
    },
  },
};
