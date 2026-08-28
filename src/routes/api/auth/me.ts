import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, issueDataSessionToken, publicUser, unauthorized } from "@/auth.server";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return unauthorized();
        return Response.json(
          { user: publicUser(auth.user), dataSessionToken: await issueDataSessionToken() },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
