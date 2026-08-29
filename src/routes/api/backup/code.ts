import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/auth.server";

const REPO_ZIP = "https://codeload.github.com/maickelmanson/lovable-cartridge-clone/zip/refs/heads/main";

export const Route = createFileRoute("/api/backup/code")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("response" in auth) return auth.response;

        const res = await fetch(REPO_ZIP, { headers: { "User-Agent": "cartuchos-web-backup" } });
        if (!res.ok) {
          return Response.json(
            { error: "Não foi possível gerar o backup do código-fonte no momento." },
            { status: 502 },
          );
        }

        const date = new Date().toISOString().split("T")[0];
        return new Response(res.body, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="codigo-fonte-${date}.zip"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
