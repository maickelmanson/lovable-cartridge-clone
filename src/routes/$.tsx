import { createFileRoute } from "@tanstack/react-router";
import { TRPCProvider } from "@/components/TRPCProvider";
import App from "@/App";
import AuthPage from "@/pages/AuthPage";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/$")({
  ssr: false,
  component: CatchAll,
});

function Gate() {
  const { loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAuthenticated) return <AuthPage />;
  return <App />;
}

function CatchAll() {
  return (
    <TRPCProvider>
      <Gate />
    </TRPCProvider>
  );
}
