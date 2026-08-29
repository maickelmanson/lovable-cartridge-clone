import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/auth.server";

export const Route = createFileRoute("/api/backup/database")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("response" in auth) return auth.response;

        const { dumpDatabaseSql } = await import("@/lib/backup.server");
        const sql = await dumpDatabaseSql();
        const date = new Date().toISOString().split("T")[0];
        return new Response(sql, {
          status: 200,
          headers: {
            "Content-Type": "application/sql; charset=utf-8",
            "Content-Disposition": `attachment; filename="database-backup-${date}.sql"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
