import { createFileRoute } from "@tanstack/react-router";
import { hashPassword, publicUser, requireAdmin, type AppRole, type DbUser } from "@/auth.server";

const ROLES: AppRole[] = ["admin", "gerente", "vendedor", "tecnico"];

export const Route = createFileRoute("/api/auth/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const guard = await requireAdmin(request);
        if ("response" in guard) return guard.response;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data, error } = await supabaseAdmin
          .from("users")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json(
          { users: ((data ?? []) as DbUser[]).map(publicUser) },
          { headers: { "Cache-Control": "no-store" } },
        );
      },

      POST: async ({ request }) => {
        const guard = await requireAdmin(request);
        if ("response" in guard) return guard.response;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let body: { email?: string; password?: string; name?: string; role?: string; active?: boolean };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Requisição inválida" }, { status: 400 });
        }

        const email = (body.email ?? "").trim().toLowerCase();
        const name = (body.name ?? "").trim();
        const password = body.password ?? "";
        const role = (body.role ?? "vendedor") as AppRole;

        if (!email || !name || password.length < 6) {
          return Response.json(
            { error: "Informe nome, e-mail e senha com ao menos 6 caracteres" },
            { status: 400 },
          );
        }
        if (!ROLES.includes(role)) {
          return Response.json({ error: "Papel inválido" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from("users")
          .insert({
            email,
            name,
            role,
            active: body.active ?? true,
            password: await hashPassword(password),
          })
          .select("*")
          .single();

        if (error) {
          const duplicated = error.code === "23505";
          return Response.json(
            { error: duplicated ? "Já existe um usuário com esse e-mail" : error.message },
            { status: duplicated ? 409 : 500 },
          );
        }

        return Response.json({ user: publicUser(data as DbUser) }, { status: 201 });
      },
    },
  },
});
