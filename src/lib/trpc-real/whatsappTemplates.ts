import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/db";
import { requirePermission } from "@/lib/guard";
import { registrarAuditoria, diff } from "@/lib/audit";

export interface WhatsAppTemplate {
  id: number;
  chave: string;
  titulo: string;
  corpo: string;
  atualizadoEm?: string;
}

function toApp(r: any): WhatsAppTemplate {
  return {
    id: r.id,
    chave: r.chave,
    titulo: r.titulo,
    corpo: r.corpo,
    atualizadoEm: r.updated_at,
  };
}

export const whatsappTemplatesApi = {
  listar: {
    useQuery: (_input?: any, opts?: any) =>
      useQuery({
        queryKey: ["whatsappTemplates", "listar"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("whatsapp_templates")
            .select("*")
            .order("id", { ascending: true });
          if (error) throw error;
          return (data ?? []).map(toApp);
        },
        ...(opts ?? {}),
      }),
  },
  salvar: {
    useMutation: (opts?: { onSuccess?: () => void; onError?: (e: any) => void }) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: { chave: string; corpo: string; titulo?: string }) => {
          requirePermission("mensagens.editar");
          const { data: antes } = await supabase
            .from("whatsapp_templates")
            .select("*")
            .eq("chave", input.chave)
            .maybeSingle();

          let row: any;
          if (antes) {
            const { data, error } = await supabase
              .from("whatsapp_templates")
              .update({ corpo: input.corpo, ...(input.titulo ? { titulo: input.titulo } : {}) })
              .eq("id", antes.id)
              .select("*")
              .single();
            if (error) throw error;
            row = data;
          } else {
            const { data, error } = await supabase
              .from("whatsapp_templates")
              .insert({ chave: input.chave, titulo: input.titulo || input.chave, corpo: input.corpo })
              .select("*")
              .single();
            if (error) throw error;
            row = data;
          }

          await registrarAuditoria({
            action: "whatsapp.template.salvar",
            entityType: "whatsapp_templates",
            entityId: row.id,
            entityLabel: row.titulo,
            details: antes ? diff(antes, row) : { depois: row },
          });
          return toApp(row);
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["whatsappTemplates"] });
          opts?.onSuccess?.();
        },
        onError: (e: any) => opts?.onError?.(e),
      });
    },
  },
};
