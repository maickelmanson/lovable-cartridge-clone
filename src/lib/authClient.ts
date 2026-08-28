import { supabase } from "@/integrations/supabase/client";

export const TOKEN_KEY = "auth_token";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "gerente" | "vendedor" | "tecnico";
  active: boolean;
  createdAt: string;
  lastLogin: string | null;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

/** fetch com o token do localStorage no header Authorization. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(input, { ...init, headers });
}

let interceptorInstalled = false;

/** Garante o header Authorization em todas as requisições para /api. */
export function installApiAuthInterceptor() {
  if (interceptorInstalled || typeof window === "undefined") return;
  interceptorInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const token = getToken();
      if (token && url.startsWith("/api")) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
        return originalFetch(input, { ...init, headers });
      }
    } catch {
      /* ignora e segue com o fetch padrão */
    }
    return originalFetch(input as RequestInfo, init);
  };
}

/** Abre a sessão de dados (necessária para leitura/gravação protegida). */
async function openDataSession(tokenHash: string | null | undefined) {
  if (!tokenHash) return;
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = (await res.json().catch(() => ({}))) as {
    token?: string;
    user?: SessionUser;
    dataSessionToken?: string | null;
    error?: string;
  };
  if (!res.ok || !payload.token || !payload.user) {
    throw new Error(payload.error ?? "Não foi possível entrar");
  }
  setToken(payload.token);
  await openDataSession(payload.dataSessionToken);
  return payload.user;
}

export async function fetchMe(): Promise<SessionUser | null> {
  if (!getToken()) return null;
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) {
    clearToken();
    return null;
  }
  const payload = (await res.json()) as { user: SessionUser; dataSessionToken?: string | null };
  await openDataSession(payload.dataSessionToken);
  return payload.user;
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* segue com a limpeza local */
  }
  clearToken();
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignora */
  }
  if (typeof window !== "undefined") window.location.replace("/login");
}
