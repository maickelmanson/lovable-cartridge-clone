import { createFileRoute } from "@tanstack/react-router";
import {
  comparePassword,
  generateToken,
  issueDataSessionToken,
  publicUser,
  type DbUser,
} from "@/auth.server";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let body: { email?: string; password?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Requisição inválida" }, { status: 400 });
        }

        const email = (body.email ?? "").trim().toLowerCase();
        const password = body.password ?? "";
        if (!email || !password) {
          return Response.json({ error: "Informe e-mail e senha" }, { status: 400 });
        }

        const { data } = await supabaseAdmin
          .from("users")
          .select("*")
          .ilike("email", email)
          .maybeSingle();

        const user = data as DbUser | null;
        const genericError = Response.json({ error: "E-mail ou senha inválidos" }, { status: 401 });
        if (!user) return genericError;
        if (!(await comparePassword(password, user.password))) return genericError;
        if (!user.active) {
          return Response.json({ error: "Usuário desativado. Fale com um administrador." }, { status: 403 });
        }

        await supabaseAdmin
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", user.id);

        const token = await generateToken({
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        });

        return Response.json(
          {
            token,
            user: publicUser(user),
            dataSessionToken: await issueDataSessionToken(),
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
