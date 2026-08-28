/**
 * Popula o banco com o usuário administrador inicial.
 *
 * Uso: bun run scripts/seed-admin.ts
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.
 */
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const ADMIN = {
  email: "admin@epsolucoes.com",
  password: "EPS@2026",
  name: "Administrador",
  role: "admin" as const,
};

async function main() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const password = await bcrypt.hash(ADMIN.password, 10);

  const { error } = await supabase
    .from("users")
    .upsert(
      { email: ADMIN.email, name: ADMIN.name, role: ADMIN.role, active: true, password },
      { onConflict: "email" },
    );

  if (error) throw error;
  console.log(`Usuário administrador pronto: ${ADMIN.email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
