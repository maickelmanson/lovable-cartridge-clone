// Cliente de dados do app. Como o login é próprio (JWT em localStorage),
// as consultas passam pelo proxy /api/db, que valida o token no servidor.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getCurrentUser, getToken } from "@/lib/authClient";

const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";

const client = createClient<Database>(`${origin}/api/db`, "app-proxy", {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: {
    fetch: async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      headers.delete("apikey");
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(input as any, { ...init, headers });
    },
  },
});

// Compatibilidade: alguns módulos chamam supabase.auth.getUser() apenas para
// obter o id do usuário logado. Devolvemos o usuário da sessão do app.
const authShim = {
  async getUser() {
    const user = getCurrentUser();
    return { data: { user: user ? { id: user.id, email: user.email } : null }, error: null } as any;
  },
  async getSession() {
    return { data: { session: null }, error: null } as any;
  },
};

export const supabase = new Proxy(client, {
  get(target, prop, receiver) {
    if (prop === "auth") return authShim;
    return Reflect.get(target, prop, receiver);
  },
}) as typeof client;
