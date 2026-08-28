import { createFileRoute } from "@tanstack/react-router";
import { TRPCProvider } from "@/components/TRPCProvider";
import App from "@/App";
import AuthPage from "@/pages/AuthPage";
import { useAuth } from "@/_core/hooks/useAuth";
import { obterPerfilAtual, registrarUltimoAcesso } from "@/lib/perfil";
import { registrarAuditoria } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/$")({
  ssr: false,
  component: CatchAll,
});

function Gate() {
  const { loading, isAuthenticated, user, logout } = useAuth();
  const [checando, setChecando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setBloqueado(false);
      return;
    }
    let cancelado = false;
    setChecando(true);
    (async () => {
      try {
        const perfil = await obterPerfilAtual();
        if (cancelado) return;
        if (perfil && !perfil.active) {
          setBloqueado(true);
          return;
        }
        setBloqueado(false);
        await registrarUltimoAcesso(user.id);
        await registrarAuditoria({ action: "auth.login", entityType: "profiles", entityId: user.id });
      } catch (err) {
        console.warn("Falha ao carregar perfil", err);
      } finally {
        if (!cancelado) setChecando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [isAuthenticated, user?.id]);

  if (loading || (isAuthenticated && checando)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;

  if (bloqueado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <h1 className="text-xl font-bold">Acesso desativado</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta está inativa. Fale com um administrador para reativar o acesso.
          </p>
          <Button
            className="w-full"
            onClick={async () => {
              await supabase.auth.signOut();
              await logout();
            }}
          >
            Sair
          </Button>
        </Card>
      </div>
    );
  }

  return <App />;
}

function CatchAll() {
  return (
    <TRPCProvider>
      <Gate />
    </TRPCProvider>
  );
}
