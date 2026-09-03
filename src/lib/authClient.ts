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

function isAuthEndpoint(url: string) {
  return url.includes("/api/auth/me") || url.includes("/api/auth/refresh") || url.includes("/api/auth/login");
}

/** Lê o `exp` do JWT (segundos) sem validar a assinatura. */
function getTokenExp(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

let refreshing: Promise<boolean> | null = null;

/** Pede um token novo ao servidor. Devolve true quando a sessão foi renovada. */
export async function refreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      const payload = (await res.json()) as { token?: string; user?: SessionUser };
      if (!payload.token) return false;
      setToken(payload.token);
      if (payload.user) currentUser = payload.user;
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Revalida a sessão atual em /api/auth/me antes de descartar o token. */
async function revalidarSessao(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return false;
    // Sessão ainda válida: aproveita para prolongá-la.
    await refreshToken();
    return true;
  } catch {
    return false;
  }
}

function encerrarSessao() {
  clearToken();
  currentUser = null;
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
  }
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && typeof window !== "undefined" && !isAuthEndpoint(input)) {
    if (!(await revalidarSessao())) encerrarSessao();
  }
  return res;
}

let interceptorInstalled = false;
const RENOVAR_ANTES_MS = 30 * 60 * 1000; // últimos 30 minutos antes de expirar

/** Renova o token quando faltarem menos de 30 minutos para expirar. */
async function renovarSeProximoDoVencimento() {
  const token = getToken();
  if (!token) return;
  const exp = getTokenExp(token);
  if (exp == null) return;
  const restante = exp * 1000 - Date.now();
  if (restante > 0 && restante <= RENOVAR_ANTES_MS) await refreshToken();
}

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

    const enviar = async () => {
      const headers = new Headers(
        init.headers ?? (input instanceof Request ? input.headers : undefined),
      );
      const atual = getToken();
      if (atual) headers.set("Authorization", `Bearer ${atual}`);
      return originalFetch(input as any, { ...init, headers });
    };

    let res = await enviar();
    if (res.status === 401 && !isAuthEndpoint(url)) {
      // Antes de derrubar a sessão, tenta revalidar/renovar e repetir uma vez.
      if (await revalidarSessao()) {
        res = await enviar();
        if (res.status !== 401) return res;
      }
      encerrarSessao();
    }
    return res;
  };

  // Renovação proativa: ao carregar, periodicamente e ao voltar o foco da aba.
  void renovarSeProximoDoVencimento();
  window.setInterval(() => void renovarSeProximoDoVencimento(), 5 * 60 * 1000);
  window.addEventListener("focus", () => void renovarSeProximoDoVencimento());
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

