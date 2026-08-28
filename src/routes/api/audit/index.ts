import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, forbidden, unauthorized } from "@/auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type AuditBody = {
  action?: string;
  entityType?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  details?: unknown;
  sessionId?: string | null;
};

export const Route = createFileRoute("/api/audit/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return unauthorized();
        if (auth.user.role !== "admin" && auth.user.role !== "gerente") {
          return forbidden("Acesso restrito a administradores e gerentes");
        }
        const { data, error } = await supabaseAdmin
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) return Response.json({ error: "Falha ao carregar auditoria" }, { status: 500 });
        return Response.json({ logs: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
      },
      POST: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return unauthorized();
        const body = (await request.json().catch(() => ({}))) as AuditBody;
        const action = typeof body.action === "string" ? body.action.slice(0, 120) : null;
        if (!action) return Response.json({ error: "Ação inválida" }, { status: 400 });

        const ip =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          null;

        const { error } = await supabaseAdmin.from("audit_logs").insert({
          user_id: auth.user.id,
          user_name: auth.user.name,
          user_email: auth.user.email,
          user_role: auth.user.role,
          action,
          entity_type: body.entityType ?? null,
          entity_id: body.entityId != null ? String(body.entityId) : null,
          entity_label: body.entityLabel ?? null,
          details: (body.details ?? null) as never,
          ip_address: ip,
          session_id: body.sessionId ?? null,
        });
        if (error) return Response.json({ error: "Falha ao registrar" }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
