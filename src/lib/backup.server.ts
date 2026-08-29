// Geração e restauração de backup do banco (server-only).
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const BACKUP_TABLES = [
  "empresa_dados",
  "clientes",
  "cartuchos_cadastro",
  "pedidos",
  "pedido_cartuchos",
  "reman_orders",
  "reman_order_items",
  "reman_order_units",
  "notifications",
  "error_logs",
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** Exporta todas as tabelas de negócio como um script SQL de INSERTs. */
export async function dumpDatabaseSql(): Promise<string> {
  const parts: string[] = [
    `-- Backup do banco gerado em ${new Date().toISOString()}`,
    "-- Restaurável pela rota /api/backup/restore",
    "",
  ];

  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabaseAdmin.from(table as never).select("*");
    if (error) {
      parts.push(`-- ERRO ao exportar ${table}: ${error.message}`, "");
      continue;
    }
    const rows = (data ?? []) as Record<string, unknown>[];
    parts.push(`-- Tabela: ${table} (${rows.length} registros)`);
    for (const row of rows) {
      const cols = Object.keys(row);
      parts.push(
        `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((c) => sqlValue(row[c])).join(", ")});`,
      );
    }
    parts.push("");
  }

  return parts.join("\n");
}

type ParsedInsert = { table: string; row: Record<string, unknown> };

function splitValues(raw: string): string[] {
  const out: string[] = [];
  let current = "";
  let inString = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (ch === "'" && raw[i + 1] === "'") {
        current += "'";
        i++;
      } else if (ch === "'") {
        inString = false;
        current += ch;
      } else {
        current += ch;
      }
    } else if (ch === "'") {
      inString = true;
      current += ch;
    } else if (ch === ",") {
      out.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

function parseValue(token: string): unknown {
  const t = token.trim();
  if (/^null$/i.test(t)) return null;
  if (/^true$/i.test(t)) return true;
  if (/^false$/i.test(t)) return false;
  if (t.startsWith("'") && t.endsWith("'")) {
    const inner = t.slice(1, -1).replace(/''/g, "'");
    if ((inner.startsWith("{") && inner.endsWith("}")) || (inner.startsWith("[") && inner.endsWith("]"))) {
      try {
        return JSON.parse(inner);
      } catch {
        return inner;
      }
    }
    return inner;
  }
  const n = Number(t);
  return Number.isNaN(n) ? t : n;
}

/** Extrai os INSERTs de um script SQL de backup. */
export function parseInserts(sql: string): ParsedInsert[] {
  const regex = /INSERT\s+INTO\s+(?:public\.)?"?(\w+)"?\s*\(([^)]*)\)\s*VALUES\s*\(([\s\S]*?)\)\s*;/gi;
  const result: ParsedInsert[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql))) {
    const table = match[1]!;
    const cols = match[2]!.split(",").map((c) => c.trim().replace(/"/g, ""));
    const values = splitValues(match[3]!);
    if (cols.length !== values.length) continue;
    const row: Record<string, unknown> = {};
    cols.forEach((c, i) => {
      row[c] = parseValue(values[i]!);
    });
    result.push({ table, row });
  }
  return result;
}

/** Restaura o banco a partir de um script SQL de backup (substitui os dados). */
export async function restoreFromSql(sql: string) {
  const inserts = parseInserts(sql);
  const allowed = new Set<string>(BACKUP_TABLES as readonly string[]);
  const grouped = new Map<string, Record<string, unknown>[]>();

  for (const item of inserts) {
    if (!allowed.has(item.table)) continue;
    const list = grouped.get(item.table) ?? [];
    list.push(item.row);
    grouped.set(item.table, list);
  }

  if (grouped.size === 0) {
    throw new Error("Nenhum comando INSERT reconhecido no arquivo enviado.");
  }

  // Limpa na ordem inversa das dependências.
  for (const table of [...BACKUP_TABLES].reverse()) {
    if (!grouped.has(table)) continue;
    const { error } = await supabaseAdmin
      .from(table as never)
      .delete()
      .not("id", "is", null);
    if (error) throw new Error(`Falha ao limpar ${table}: ${error.message}`);
  }

  const summary: Record<string, number> = {};
  for (const table of BACKUP_TABLES) {
    const rows = grouped.get(table);
    if (!rows?.length) continue;
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const { error } = await supabaseAdmin.from(table as never).insert(chunk as never);
      if (error) throw new Error(`Falha ao restaurar ${table}: ${error.message}`);
    }
    summary[table] = rows.length;
  }

  return summary;
}
