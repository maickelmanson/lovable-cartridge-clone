import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
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
import Auditoria from "./pages/Auditoria";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import { getToken } from "@/lib/authClient";

function DashboardRoutes() {
  return (
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
        <Route path={"/busca"} component={BuscaAvancada} />
        <Route path={"/buscador-cartuchos"} component={BuscadorCartuchos} />
        <Route path={"/teste/buscador-cartuchos"} component={TestBuscadorCartuchos} />
        <Route path={"/reman/pedidos"} component={RemanPedidos} />
        <Route path={"/reman/pedidos/:id"} component={RemanPedidoDetalhe} />
        <Route path={"/auditoria"} component={Auditoria} />
        <Route path={"/usuarios"} component={Usuarios} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function AuthGuard() {
  const [location] = useLocation();
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTokenState(getToken());
    setReady(true);
  }, [location]);

  if (!ready) return null;

  // Rota pública de impressão
  if (/^\/reman\/pedidos\/[^/]+\/imprimir$/.test(location)) {
    return <RemanPedidoImpressao />;
  }

  if (!token) return <Login />;

  return <DashboardRoutes />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthGuard />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
