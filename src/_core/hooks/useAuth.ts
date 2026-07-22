import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, any>;
  return {
    id: user.id,
    email: user.email ?? null,
    name: meta.full_name ?? meta.name ?? user.email ?? null,
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
  };
}

export function useAuth(_options?: { redirectOnUnauthenticated?: boolean; redirectPath?: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const user = mapUser(session?.user ?? null);

  return {
    user,
    loading,
    error: null as Error | null,
    isAuthenticated: Boolean(user),
    refresh: async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    },
    logout,
  };
}
