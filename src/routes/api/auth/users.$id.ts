import { createFileRoute } from "@tanstack/react-router";
import { hashPassword, publicUser, requireAdmin, type AppRole, type DbUser } from "@/auth.server";

const ROLES: AppRole[] = ["admin", "gerente", "vendedor", "tecnico"];

export const Route = createFileRoute("/api/auth/users/$id")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        const guard = await requireAdmin(request);
        if ("response" in guard) return guard.response;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let body: { email?: string; password?: string; name?: string; role?: string; active?: boolean };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Requisição inválida" }, { status: 400 });
        }

        type UserPatch = {
          email?: string;
          name?: string;
          active?: boolean;
          role?: AppRole;
          password?: string;
          password_changed_at?: string;
        };
        const patch: UserPatch = {};
        if (body.email !== undefined) patch.email = body.email.trim().toLowerCase();
        if (body.name !== undefined) patch.name = body.name.trim();
        if (body.active !== undefined) patch.active = body.active;
        if (body.role !== undefined) {
          if (!ROLES.includes(body.role as AppRole)) {
            return Response.json({ error: "Papel inválido" }, { status: 400 });
          }
          patch.role = body.role as AppRole;
        }
        if (body.password) {
          if (body.password.length < 6) {
            return Response.json({ error: "A senha precisa ter ao menos 6 caracteres" }, { status: 400 });
          }
          patch.password = await hashPassword(body.password);
          // Invalida tokens emitidos antes da troca de senha.
          patch.password_changed_at = new Date().toISOString();
        }

        if (Object.keys(patch).length === 0) {
          return Response.json({ error: "Nada para atualizar" }, { status: 400 });
        }

        if (patch.active === false && params.id === guard.user.id) {
          return Response.json({ error: "Você não pode desativar a própria conta" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from("users")
          .update(patch)
          .eq("id", params.id)
          .select("*")
          .maybeSingle();

        if (error) return Response.json({ error: error.message }, { status: 500 });
        if (!data) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
        return Response.json({ user: publicUser(data as DbUser) });
      },

      DELETE: async ({ request, params }) => {
        const guard = await requireAdmin(request);
        if ("response" in guard) return guard.response;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (params.id === guard.user.id) {
          return Response.json({ error: "Você não pode desativar a própria conta" }, { status: 400 });
        }

        // Desativa em vez de excluir, preservando o histórico.
        const { data, error } = await supabaseAdmin
          .from("users")
          .update({ active: false })
          .eq("id", params.id)
          .select("*")
          .maybeSingle();

        if (error) return Response.json({ error: error.message }, { status: 500 });
        if (!data) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
        return Response.json({ user: publicUser(data as DbUser) });
      },
    },
  },
});
