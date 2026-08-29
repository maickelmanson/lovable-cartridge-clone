import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/db";

const TABELAS = [
  "clientes",
  "cartuchos_cadastro",
  "empresa_dados",
  "pedidos",
  "pedido_cartuchos",
  "reman_orders",
  "reman_order_items",
  "reman_order_units",
  "error_logs",
] as const;

function sqlValue(v: any): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function gerarBackup() {
  const partes: string[] = [
    `-- Backup gerado em ${new Date().toISOString()}`,
    "-- Contém apenas os dados do usuário autenticado (RLS)",
    "",
  ];

  for (const tabela of TABELAS) {
    const { data, error } = await supabase.from(tabela as any).select("*").order("id", { ascending: true });
    if (error) {
      partes.push(`-- ERRO ao exportar ${tabela}: ${error.message}`, "");
      continue;
    }
    const rows = (data ?? []) as any[];
    partes.push(`-- Tabela: ${tabela} (${rows.length} registros)`);
    for (const row of rows) {
      const cols = Object.keys(row);
      partes.push(
        `INSERT INTO ${tabela} (${cols.join(", ")}) VALUES (${cols.map((c) => sqlValue(row[c])).join(", ")});`,
      );
    }
    partes.push("");
  }

  return { sql: partes.join("\n") };
}

export const systemApi = {
  gerarBackup: {
    useMutation: () => useMutation({ mutationFn: gerarBackup }),
  },
};
