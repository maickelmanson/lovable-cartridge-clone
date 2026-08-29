import { useCallback, useEffect, useState } from "react";
import {
  clearToken,
  fetchMe,
  getToken,
  installApiAuthInterceptor,
  logout as doLogout,
  type SessionUser,
} from "@/lib/authClient";
import { registrarAuditoria } from "@/lib/audit";

type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: SessionUser["role"];
  active: boolean;
  avatarUrl: string | null;
};

let cachedUser: AuthUser | null = null;
let inflight: Promise<AuthUser | null> | null = null;
const listeners = new Set<(u: AuthUser | null) => void>();

function mapUser(user: SessionUser | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    avatarUrl: null,
  };
}

function broadcast(user: AuthUser | null) {
  cachedUser = user;
  listeners.forEach((fn) => fn(user));
}

async function loadUser(force = false): Promise<AuthUser | null> {
  if (!force && cachedUser) return cachedUser;
  if (!inflight || force) {
    inflight = fetchMe()
      .then(async (res) => {
        const mapped = mapUser(res?.user ?? null);
        broadcast(mapped);
        return mapped;
      })
      .catch(() => {
        broadcast(null);
        return null;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  useEffect(() => {
    installApiAuthInterceptor();
    listeners.add(setUser);
    if (!getToken()) {
      setLoading(false);
      broadcast(null);
      return () => {
        listeners.delete(setUser);
      };
    }
    let alive = true;
    loadUser().finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
      listeners.delete(setUser);
    };
  }, []);

  const logout = useCallback(async () => {
    await registrarAuditoria({ action: "auth.logout", entityType: "users" });
    broadcast(null);
    clearToken();
    await doLogout();
  }, []);

  return {
    user,
    loading,
    error: null as Error | null,
    isAuthenticated: Boolean(user),
    refresh: async () => {
      await loadUser(true);
    },
    logout,
  };
}
