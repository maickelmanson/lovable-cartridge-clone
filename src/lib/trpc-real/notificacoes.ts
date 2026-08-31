import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/authClient";

export interface Notificacao {
  id: number;
  criadoEm: string;
  canal: string;
  destino: string;
  mensagem: string;
  status: string;
  erro: string | null;
  clienteId: number | null;
  pedidoId: number | null;
  clienteNome: string | null;
  pedidoNumero: string | null;
}

function toApp(r: any): Notificacao {
  return {
    id: r.id,
    criadoEm: r.created_at,
    canal: r.channel,
    destino: r.destination,
    mensagem: r.message,
    status: r.status,
    erro: r.error ?? null,
    clienteId: r.cliente_id ?? null,
    pedidoId: r.pedido_id ?? null,
    clienteNome: r.clientes?.nome ?? null,
    pedidoNumero: r.pedidos?.numero ?? null,
  };
}

export type ListarInput = {
  busca?: string;
  status?: string;
  de?: string;
  ate?: string;
  pagina?: number;
  porPagina?: number;
};

export const notificacoesApi = {
  listar: {
    useQuery: (input?: ListarInput, opts?: any) => {
      const pagina = input?.pagina ?? 1;
      const porPagina = input?.porPagina ?? 25;
      return useQuery({
        queryKey: ["notificacoes", "listar", input ?? {}],
        queryFn: async () => {
          let q = supabase
            .from("notifications")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false });

          if (input?.status && input.status !== "todos") q = q.eq("status", input.status);
          if (input?.de) q = q.gte("created_at", new Date(input.de).toISOString());
          if (input?.ate) {
            const fim = new Date(input.ate);
            fim.setHours(23, 59, 59, 999);
            q = q.lte("created_at", fim.toISOString());
          }
          const termo = (input?.busca ?? "").trim();
          if (termo) {
            const like = `%${termo}%`;
            q = q.or(`destination.ilike.${like},message.ilike.${like}`);
          }

          const from = (pagina - 1) * porPagina;
          const { data, error, count } = await q.range(from, from + porPagina - 1);
          if (error) throw error;
          let itens = (data ?? []).map(toApp);
          if (termo) {
            const alvo = termo.toLowerCase();
            const filtrados = itens.filter(
              (n) =>
                n.destino?.toLowerCase().includes(alvo) ||
                n.mensagem?.toLowerCase().includes(alvo) ||
                (n.clienteNome ?? "").toLowerCase().includes(alvo),
            );
            itens = filtrados.length ? filtrados : itens;
          }
          return { itens, total: count ?? itens.length, pagina, porPagina };
        },
        ...(opts ?? {}),
      });
    },
  },

  registrar: {
    useMutation: (opts?: { onSuccess?: () => void; onError?: (e: any) => void }) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: {
          clienteId?: number | null;
          pedidoId?: number | null;
          destino: string;
          mensagem: string;
          status: "enviada" | "falha";
          erro?: string | null;
        }) => {
          const user = getCurrentUser();
          const { data, error } = await supabase
            .from("notifications")
            .insert({
              cliente_id: input.clienteId ?? null,
              pedido_id: input.pedidoId ?? null,
              channel: "whatsapp",
              destination: input.destino,
              message: input.mensagem,
              status: input.status,
              error: input.erro ?? null,
              external_id: user?.id ?? null,
            })
            .select("*")
            .single();
          if (error) throw error;
          return toApp(data);
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["notificacoes"] });
          opts?.onSuccess?.();
        },
        onError: (e: any) => opts?.onError?.(e),
      });
    },
  },
};
