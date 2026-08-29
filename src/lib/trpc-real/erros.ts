import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/db";

function toApp(r: any) {
  return {
    id: r.id,
    errorType: r.error_type,
    errorMessage: r.error_message,
    errorStack: r.error_stack,
    context: r.context,
    severity: r.severity,
    resolved: r.resolved,
    resolvedAt: r.resolved_at,
    resolvedBy: r.resolved_by,
    notes: r.notes,
    criadoEm: r.created_at,
  };
}

export const errosApi = {
  obterResumo: {
    useQuery: () =>
      useQuery({
        queryKey: ["erros", "obterResumo"],
        queryFn: async () => {
          const { data, error } = await supabase.from("error_logs").select("severity").eq("resolved", false);
          if (error) throw error;
          const base = { critica: 0, alta: 0, media: 0, baixa: 0, total: 0 } as Record<string, number>;
          for (const r of data ?? []) {
            const s = (r as any).severity as string;
            base[s] = (base[s] ?? 0) + 1;
            base.total += 1;
          }
          return base as any;
        },
      }),
  },
  obterEstatisticas: {
    useQuery: () =>
      useQuery({
        queryKey: ["erros", "obterEstatisticas"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("error_logs")
            .select("error_type, severity, created_at")
            .order("created_at", { ascending: false });
          if (error) throw error;
          const map = new Map<string, { errorType: string; count: number; severity: string; lastOccurrence: string }>();
          for (const r of (data ?? []) as any[]) {
            const cur = map.get(r.error_type);
            if (cur) cur.count += 1;
            else
              map.set(r.error_type, {
                errorType: r.error_type,
                count: 1,
                severity: r.severity,
                lastOccurrence: r.created_at,
              });
          }
          return Array.from(map.values()).sort((a, b) => b.count - a.count);
        },
      }),
  },
  obterNaoResolvidos: {
    useQuery: () =>
      useQuery({
        queryKey: ["erros", "obterNaoResolvidos"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("error_logs")
            .select("*")
            .eq("resolved", false)
            .order("created_at", { ascending: false });
          if (error) throw error;
          return (data ?? []).map(toApp);
        },
      }),
  },
  obterRecentes: {
    useQuery: (input?: { limite?: number }) =>
      useQuery({
        queryKey: ["erros", "obterRecentes", input?.limite ?? 50],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("error_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(input?.limite ?? 50);
          if (error) throw error;
          return (data ?? []).map(toApp);
        },
      }),
  },
  registrar: {
    useMutation: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: any) => {
          const { data: userData } = await supabase.auth.getUser();
          const owner_id = userData.user?.id;
          if (!owner_id) throw new Error("Usuário não autenticado");
          const { data, error } = await supabase
            .from("error_logs")
            .insert({
              owner_id,
              error_type: input.errorType,
              error_message: input.errorMessage,
              error_stack: input.errorStack ?? null,
              context: input.context ?? null,
              severity: input.severity ?? "media",
            })
            .select("*")
            .single();
          if (error) throw error;
          return toApp(data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["erros"] }),
      });
    },
  },
  marcarResolvido: {
    useMutation: (opts?: { onSuccess?: () => void; onError?: (e: any) => void }) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (input: { erroId: number; notes?: string }) => {
          const { data: userData } = await supabase.auth.getUser();
          const { data, error } = await supabase
            .from("error_logs")
            .update({
              resolved: true,
              resolved_at: new Date().toISOString(),
              resolved_by: userData.user?.email ?? userData.user?.id ?? null,
              notes: input.notes ?? null,
            })
            .eq("id", input.erroId)
            .select("*")
            .single();
          if (error) throw error;
          return toApp(data);
        },
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["erros"] });
          opts?.onSuccess?.();
        },
        onError: (e) => opts?.onError?.(e),
      });
    },
  },
};
