import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, generateToken, publicUser, unauthorized } from "@/auth.server";

/**
 * Renova o token do usuário autenticado, emitindo outro válido por 7 dias.
 * Não altera login nem logout: apenas prolonga uma sessão que ainda é válida.
 */
export const Route = createFileRoute("/api/auth/refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return unauthorized();
        const token = await generateToken({
          sub: auth.user.id,
          email: auth.user.email,
          name: auth.user.name,
          role: auth.user.role,
        });
        return Response.json(
          { token, user: publicUser(auth.user) },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
