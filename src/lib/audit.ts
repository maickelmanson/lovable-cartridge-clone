import { supabase } from "@/integrations/supabase/client";

export type AuditEntry = {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
};

/**
 * Registra uma ação no histórico de auditoria.
 * Nunca lança erro: falha de auditoria não deve quebrar a operação do usuário.
 */
export async function registrarAuditoria(entry: AuditEntry): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      details: (entry.details ?? null) as any,
    });
  } catch (err) {
    console.warn("Falha ao registrar auditoria", err);
  }
}
