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

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(input, { ...init, headers });
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
    error?: string;
  };
  if (!res.ok || !payload.token || !payload.user) {
    throw new Error(payload.error ?? "Não foi possível entrar");
  }
  setToken(payload.token);
  return payload.user;
}

export async function fetchMe(): Promise<SessionUser | null> {
  if (!getToken()) return null;
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) {
    clearToken();
    return null;
  }
  const payload = (await res.json()) as { user: SessionUser };
  return payload.user;
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {}
  clearToken();
  if (typeof window !== "undefined") window.location.replace("/login");
}
