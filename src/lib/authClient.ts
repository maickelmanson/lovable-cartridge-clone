export const TOKEN_KEY = "auth_token";
export const USER_KEY = "auth_user";
export const SESSION_KEY = "auth_session_id";

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
  window.localStorage.removeItem(USER_KEY);
}

/** Usuário logado guardado localmente (usado por auditoria e permissões). */
export function getCurrentUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: SessionUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
}

/** Identificador da sessão do navegador (para agrupar ações na auditoria). */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/login") window.location.replace("/login");
}

/** Trata 401 vindo de qualquer requisição: limpa o token e volta para o login. */
export function handleUnauthorized() {
  clearToken();
  redirectToLogin();
}

/** fetch com o token do localStorage no header Authorization. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) handleUnauthorized();
  return res;
}

let interceptorInstalled = false;

/** Garante o header Authorization em todas as requisições para /api e trata 401. */
export function installApiAuthInterceptor() {
  if (interceptorInstalled || typeof window === "undefined") return;
  interceptorInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let isApi = false;
    let call = () => originalFetch(input as RequestInfo, init);
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      isApi = url.startsWith("/api");
      const token = getToken();
      if (token && isApi) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
        call = () => originalFetch(input, { ...init, headers });
      }
    } catch {
      /* ignora e segue com o fetch padrão */
    }
    const res = await call();
    if (isApi && res.status === 401 && !String((input as any)?.url ?? input).includes("/api/auth/login")) {
      handleUnauthorized();
    }
    return res;
  };
}

export type LoginResult = { user: SessionUser; dataSessionToken: string | null };

export async function login(email: string, password: string): Promise<LoginResult> {
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
  setCurrentUser(payload.user);
  return { user: payload.user, dataSessionToken: payload.dataSessionToken ?? null };
}

export async function fetchMe(): Promise<LoginResult | null> {
  if (!getToken()) return null;
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) {
    clearToken();
    return null;
  }
  const payload = (await res.json()) as { user: SessionUser; dataSessionToken?: string | null };
  setCurrentUser(payload.user);
  return { user: payload.user, dataSessionToken: payload.dataSessionToken ?? null };
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* segue com a limpeza local */
  }
  clearToken();
  redirectToLogin();
}
