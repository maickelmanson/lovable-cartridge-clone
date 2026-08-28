import { apiFetch, getSessionId } from "@/lib/authClient";

export type AuditEntry = {
  action: string;
  entityType?: string | null;
  entityId?: string | number | null;
  entityLabel?: string | null;
  /** Alterações no formato { antes, depois } ou qualquer detalhe extra. */
  details?: Record<string, unknown> | null;
};

/**
 * Registra uma ação no histórico de auditoria (via servidor, que identifica
 * o usuário pelo JWT e grava com privilégio de serviço).
 * Nunca lança erro e nunca bloqueia a operação principal.
 */
export async function registrarAuditoria(entry: AuditEntry): Promise<void> {
  try {
    await apiFetch("/api/audit", {
      method: "POST",
      body: JSON.stringify({
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId != null ? String(entry.entityId) : null,
        entityLabel: entry.entityLabel ?? null,
        details: entry.details ?? null,
        sessionId: getSessionId(),
      }),
    });
  } catch (err) {
    console.warn("Falha ao registrar auditoria", err);
  }
}


/** Dispara a auditoria sem esperar (fire and forget). */
export function auditar(entry: AuditEntry) {
  void registrarAuditoria(entry);
}

/** Monta o objeto de diferenças { antes, depois } apenas com os campos alterados. */
export function diff(antes: Record<string, any> | null, depois: Record<string, any> | null) {
  if (!antes || !depois) return { antes, depois };
  const a: Record<string, any> = {};
  const d: Record<string, any> = {};
  for (const key of Object.keys(depois)) {
    if (JSON.stringify(antes[key]) !== JSON.stringify(depois[key])) {
      a[key] = antes[key] ?? null;
      d[key] = depois[key] ?? null;
    }
  }
  return { antes: a, depois: d };
}
