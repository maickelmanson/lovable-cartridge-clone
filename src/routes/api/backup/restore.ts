import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/auth.server";

export const Route = createFileRoute("/api/backup/restore")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("response" in auth) return auth.response;

        let sql = "";
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("multipart/form-data")) {
          const form = await request.formData();
          const file = form.get("file");
          if (file && typeof file !== "string") sql = await file.text();
        } else {
          sql = await request.text();
        }

        if (!sql.trim()) {
          return Response.json({ error: "Arquivo SQL vazio." }, { status: 400 });
        }

        try {
          const { restoreFromSql } = await import("@/lib/backup.server");
          const summary = await restoreFromSql(sql);
          return Response.json({ ok: true, summary });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Falha ao restaurar o banco.";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
