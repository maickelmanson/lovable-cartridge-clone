import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, getSessionId } from "@/lib/authClient";

export type AuditEntry = {
  action: string;
  entityType?: string | null;
  entityId?: string | number | null;
  entityLabel?: string | null;
  /** Alterações no formato { antes, depois } ou qualquer detalhe extra. */
  details?: Record<string, unknown> | null;
};

let cachedIp: string | null = null;

async function getIp(): Promise<string | null> {
  if (cachedIp !== null) return cachedIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const json = (await res.json()) as { ip?: string };
    cachedIp = json.ip ?? "";
  } catch {
    cachedIp = "";
  }
  return cachedIp || null;
}

/**
 * Registra uma ação no histórico de auditoria.
 * Nunca lança erro e nunca bloqueia a operação principal.
 */
export async function registrarAuditoria(entry: AuditEntry): Promise<void> {
  try {
    const user = getCurrentUser();
    const ip = await getIp();
    await supabase.from("audit_logs").insert({
      user_id: user?.id ?? null,
      user_name: user?.name ?? null,
      user_email: user?.email ?? null,
      user_role: user?.role ?? null,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId != null ? String(entry.entityId) : null,
      entity_label: entry.entityLabel ?? null,
      details: (entry.details ?? null) as any,
      ip_address: ip,
      session_id: getSessionId(),
    } as any);
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
