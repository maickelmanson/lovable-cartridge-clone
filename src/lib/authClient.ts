export const TOKEN_KEY = "auth_token";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "gerente" | "vendedor" | "tecnico";
  permissions?: string[] | null;
  active: boolean;
  createdAt: string;
  updatedAt?: string | null;
  passwordChangedAt?: string | null;
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

let currentUser: SessionUser | null = null;
let sessionId: string | null = null;

export function getCurrentUser(): SessionUser | null {
  return currentUser;
}

export function setCurrentUser(user: SessionUser | null) {
  currentUser = user;
}

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  if (sessionId) return sessionId;
  try {
    const existing = window.sessionStorage.getItem("session_id");
    sessionId = existing ?? crypto.randomUUID();
    window.sessionStorage.setItem("session_id", sessionId);
  } catch {
    sessionId = sessionId ?? null;
  }
  return sessionId;
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && typeof window !== "undefined") {
    clearToken();
    currentUser = null;
    if (!window.location.pathname.startsWith("/login")) window.location.replace("/login");
  }
  return res;
}

let interceptorInstalled = false;

/** Anexa o token JWT automaticamente a todas as chamadas /api do app. */
export function installApiAuthInterceptor() {
  if (interceptorInstalled || typeof window === "undefined") return;
  interceptorInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    let url = "";
    if (typeof input === "string") url = input;
    else if (input instanceof URL) url = input.toString();
    else url = input.url;

    const isApi = url.startsWith("/api") || url.includes(`${window.location.origin}/api`);
    if (!isApi) return originalFetch(input as any, init);

    const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined));
    const token = getToken();
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    const res = await originalFetch(input as any, { ...init, headers });
    if (res.status === 401) {
      clearToken();
      currentUser = null;
      if (!window.location.pathname.startsWith("/login")) window.location.replace("/login");
    }
    return res;
  };
}

export async function login(email: string, password: string): Promise<{ user: SessionUser }> {
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
  currentUser = payload.user;
  return { user: payload.user };
}

export async function fetchMe(): Promise<{ user: SessionUser } | null> {
  if (!getToken()) return null;
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) {
    clearToken();
    currentUser = null;
    return null;
  }
  const payload = (await res.json()) as { user: SessionUser };
  currentUser = payload.user;
  return { user: payload.user };
}

export async function logout() {
  clearToken();
  currentUser = null;
  if (typeof window !== "undefined") window.location.href = "/login";
}

