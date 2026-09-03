import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, unauthorized } from "@/auth.server";

/**
 * Lista mínima de usuários ativos (id, nome, papel) para preencher seletores
 * de "usuário responsável". Disponível para qualquer usuário autenticado —
 * a listagem completa (com e-mail e permissões) continua restrita ao admin.
 */
export const Route = createFileRoute("/api/auth/usuarios-ativos")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return unauthorized();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data, error } = await supabaseAdmin
          .from("users")
          .select("id, name, role")
          .eq("active", true)
          .order("name", { ascending: true });

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json(
          { usuarios: data ?? [] },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
