import { supabase } from "@/integrations/supabase/client";

/**
 * Sessão técnica de dados: o login do sistema é próprio (JWT), mas a leitura e
 * gravação no banco continuam protegidas por RLS e exigem uma sessão de dados.
 * O token de uso único é emitido pelo servidor durante o login/me.
 */
export async function openDataSession(tokenHash: string | null | undefined) {
  if (!tokenHash) return;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  } catch {
    /* a sessão de dados é best-effort */
  }
}

export async function closeDataSession() {
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignora */
  }
}
