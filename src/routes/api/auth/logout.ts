import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest } from "@/auth.server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // JWT é stateless: o cliente descarta o token. Apenas confirmamos.
        await authenticateRequest(request);
        return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
