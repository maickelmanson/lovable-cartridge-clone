import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ClienteDetalhe from "./pages/ClienteDetalhe";
import Pedidos from "./pages/Pedidos";
import PedidoDetalhe from "./pages/PedidoDetalhe";
import ModeloCartucho from "./pages/ModeloCartucho";
import RemanPedidos from "./pages/RemanPedidos";
import RemanPedidoDetalhe from "./pages/RemanPedidoDetalhe";
import RemanPedidoImpressao from "./pages/RemanPedidoImpressao";
import DadosEmpresa from "./pages/DadosEmpresa";
import BuscaAvancada from "./pages/BuscaAvancada";
import DashboardAnalise from "./pages/DashboardAnalise";
import PainelErros from "./pages/PainelErros";
import BuscadorCartuchos from "./pages/BuscadorCartuchos";
import TestBuscadorCartuchos from "./pages/TestBuscadorCartuchos";
import Login from "./pages/Login";
import Auditoria from "./pages/Auditoria";
import Usuarios from "./pages/Usuarios";
import { Redirect } from "wouter";
import { getToken, installApiAuthInterceptor } from "@/lib/authClient";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function RequireAuth({ children }: { children: React.ReactNode }) {
  installApiAuthInterceptor();
  const { loading, isAuthenticated, user, logout } = useAuth();

  if (!getToken()) return <Redirect to="/login" />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (user && !user.active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-xl font-bold">Acesso desativado</h1>
        <p className="text-sm text-muted-foreground">
          Sua conta está inativa. Fale com um administrador para reativar o acesso.
        </p>
        <button className="underline text-sm" onClick={() => void logout()}>
          Sair
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

function DashboardRoutes() {
  return (
    <RequireAuth>
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/empresa"} component={DadosEmpresa} />
        <Route path={"/clientes"} component={Clientes} />
        <Route path={"/clientes/:id"} component={ClienteDetalhe} />
        <Route path={"/pedidos"} component={Pedidos} />
        <Route path={"/pedidos/:id"} component={PedidoDetalhe} />
        <Route path={"/modelos"} component={ModeloCartucho} />
        <Route path={"/analise"} component={DashboardAnalise} />
        <Route path={"/erros"} component={PainelErros} />
        <Route path={"/auditoria"} component={Auditoria} />
        <Route path={"/usuarios"} component={Usuarios} />
        <Route path={"/busca"} component={BuscaAvancada} />
        <Route path={"/buscador-cartuchos"} component={BuscadorCartuchos} />
        <Route path={"/teste/buscador-cartuchos"} component={TestBuscadorCartuchos} />
        <Route path={"/reman/pedidos"} component={RemanPedidos} />
        <Route path={"/reman/pedidos/:id"} component={RemanPedidoDetalhe} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
    </RequireAuth>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      {/* Página de impressão - sem DashboardLayout */}
      <Route path={"/reman/pedidos/:id/imprimir"}>
        <RequireAuth>
          <RemanPedidoImpressao />
        </RequireAuth>
      </Route>
      {/* Todas as outras rotas com DashboardLayout */}
      <Route>
        {getToken() ? <DashboardRoutes /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
