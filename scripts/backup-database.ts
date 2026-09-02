/**
 * Exporta todas as tabelas do banco para backups/dump.sql (INSERTs SQL).
 *
 * Uso: bun run scripts/backup-database.ts   (ou `npm run backup`)
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const TABLES = [
  "users",
  "profiles",
  "user_roles",
  "empresa_dados",
  "clientes",
  "cartuchos_cadastro",
  "pedidos",
  "pedido_cartuchos",
  "reman_orders",
  "reman_order_items",
  "reman_order_units",
  "notifications",
  "whatsapp_templates",
  "error_logs",
  "audit_logs",
] as const;

const PAGE_SIZE = 1000;

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const parts: string[] = [
    `-- Dump gerado em ${new Date().toISOString()}`,
    "-- Somente dados (o schema está em supabase/seed.sql)",
    "",
  ];

  for (const table of TABLES) {
    let from = 0;
    let total = 0;
    const lines: string[] = [];

    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        lines.push(`-- ERRO ao exportar ${table}: ${error.message}`);
        break;
      }
      const rows = (data ?? []) as Record<string, unknown>[];
      for (const row of rows) {
        const cols = Object.keys(row);
        lines.push(
          `INSERT INTO public.${table} (${cols.join(", ")}) VALUES (${cols
            .map((c) => sqlValue(row[c]))
            .join(", ")});`,
        );
      }
      total += rows.length;
      if (rows.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    parts.push(`-- Tabela: ${table} (${total} registros)`, ...lines, "");
    console.log(`${table}: ${total} registros`);
  }

  const dir = resolve(process.cwd(), "backups");
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, "dump.sql");
  writeFileSync(file, parts.join("\n"), "utf8");
  console.log(`\nBackup salvo em ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
