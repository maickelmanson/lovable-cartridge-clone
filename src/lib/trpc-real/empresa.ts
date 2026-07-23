import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function toApp(r: any) {
  return {
    id: r.id,
    empresa: r.empresa,
    cep: r.cep,
    endereco: r.endereco,
    numero: r.numero,
    bairro: r.bairro,
    cidade: r.cidade,
    estado: r.estado,
    cnpjCpf: r.cnpj_cpf,
    telefone: r.telefone,
    celular: r.celular,
    email: r.email,
    nome: r.nome,
    logoUrl: r.logo_url,
    atualizadoEm: r.updated_at,
  };
}

function toDb(i: any) {
  return {
    empresa: i.empresa || null,
    cep: i.cep || null,
    endereco: i.endereco || null,
    numero: i.numero || null,
    bairro: i.bairro || null,
    cidade: i.cidade || null,
    estado: i.estado || null,
    cnpj_cpf: i.cnpjCpf || null,
    telefone: i.telefone || null,
    celular: i.celular || null,
    email: i.email || null,
    nome: i.nome || null,
    logo_url: i.logoUrl || null,
  };
}

export const empresaApi = {
  obter: {
    useQuery: () =>
      useQuery({
        queryKey: ["empresa", "obter"],
        queryFn: async () => {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) return null;
          const { data, error } = await supabase
            .from("empresa_dados")
            .select("*")
            .eq("owner_id", userData.user.id)
            .maybeSingle();
          if (error) throw error;
          return data ? toApp(data) : null;
        },
      }),
  },
  salvar: {
    useMutation: (opts?: { onSuccess?: () => void; onError?: (e: any) => void }) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data: userData } = await supabase.auth.getUser();
          const owner_id = userData.user?.id;
          if (!owner_id) throw new Error("Usuário não autenticado");
          const { data: existing } = await supabase
            .from("empresa_dados")
            .select("id")
            .eq("owner_id", owner_id)
            .maybeSingle();
          if (existing) {
            const { data, error } = await supabase
              .from("empresa_dados")
              .update(toDb(input))
              .eq("id", existing.id)
              .select("*")
              .single();
            if (error) throw error;
            return toApp(data);
          }
          const { data, error } = await supabase
            .from("empresa_dados")
            .insert({ ...toDb(input), owner_id })
            .select("*")
            .single();
          if (error) throw error;
          return toApp(data);
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["empresa"] });
          opts?.onSuccess?.();
        },
        onError: (e: any) => opts?.onError?.(e),
      });
    },
  },
};
