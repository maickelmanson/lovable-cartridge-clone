import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { Download } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardAnalise() {
  const [dataInicio, setDataInicio] = useState<string>(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [dataFim, setDataFim] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  // Queries de análise
  const { data: pedidosPorPeriodo = [] } = trpc.analise.pedidosPorPeriodo.useQuery({
    dataInicio: new Date(dataInicio),
    dataFim: new Date(dataFim),
  });

  const { data: clientesMaisAtivos = [] } = trpc.analise.clientesMaisAtivos.useQuery({
    limite: 10,
  });

  const { data: modelosMaisSolicitados = [] } = trpc.analise.modelosMaisSolicitados.useQuery({
    limite: 10,
  });

  const { data: statusPedidos = [] } = trpc.analise.statusPedidos.useQuery();

  const { data: resumoGeral = { totalPedidos: 0, totalClientes: 0, pedidosFinalizados: 0, pedidosPendentes: 0 } } = 
    trpc.analise.resumoGeral.useQuery();

  // Preparar dados para gráficos
  const pedidosChartData = useMemo(() => {
    return (pedidosPorPeriodo || []).map((item: any) => ({
      data: item.data ? format(new Date(item.data + "T00:00:00"), "dd/MM") : "N/A",
      pedidos: item.total || 0,
    }));
  }, [pedidosPorPeriodo]);

  const clientesChartData = useMemo(() => {
    return (clientesMaisAtivos || []).map((item: any) => ({
      nome: item.nomeCliente || "Desconhecido",
      pedidos: item.totalPedidos || 0,
    }));
  }, [clientesMaisAtivos]);

  const modelosChartData = useMemo(() => {
    return (modelosMaisSolicitados || []).map((item: any) => ({
      modelo: `${item.modelo01 || ""}`.substring(0, 20),
      solicitacoes: item.totalSolicitacoes || 0,
    }));
  }, [modelosMaisSolicitados]);

  const statusChartData = useMemo(() => {
    return (statusPedidos || []).map((item: any) => ({
      status: item.status || "desconhecido",
      total: item.total || 0,
    }));
  }, [statusPedidos]);

  // Exportar dados em CSV
  const exportarCSV = () => {
    try {
      const headers = ["Métrica", "Valor"];
      const data = [
        ["Total de Pedidos", resumoGeral.totalPedidos],
        ["Total de Clientes", resumoGeral.totalClientes],
        ["Pedidos Finalizados", resumoGeral.pedidosFinalizados],
        ["Pedidos Pendentes", resumoGeral.pedidosPendentes],
      ];

      const csv = [
        headers.join(","),
        ...data.map(row => row.join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `analise-pedidos-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Análise de Pedidos</h1>
          <p className="text-gray-500 mt-1">Dashboard com gráficos e estatísticas de pedidos</p>
        </div>
        <Button onClick={exportarCSV} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros de Data */}
      <Card className="p-4 bg-white">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Data Início</label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Data Fim</label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-sm font-medium text-gray-600">Total de Pedidos</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{resumoGeral.totalPedidos}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-sm font-medium text-gray-600">Total de Clientes</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{resumoGeral.totalClientes}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <div className="text-sm font-medium text-gray-600">Pedidos Finalizados</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2">{resumoGeral.pedidosFinalizados}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-sm font-medium text-gray-600">Pedidos Pendentes</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">{resumoGeral.pedidosPendentes}</div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos por Período */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Pedidos por Período</h2>
          <ChartContainer config={{ pedidos: { label: "Pedidos", color: "#3b82f6" } }} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pedidosChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="pedidos" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Status dos Pedidos */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Status dos Pedidos</h2>
          <ChartContainer config={{ total: { label: "Total", color: "#3b82f6" } }} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, total }) => `${status}: ${total}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {statusChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Clientes Mais Ativos */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Top 10 Clientes Mais Ativos</h2>
          <ChartContainer config={{ pedidos: { label: "Pedidos", color: "#10b981" } }} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="pedidos" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Modelos Mais Solicitados */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Top 10 Modelos Mais Solicitados</h2>
          <ChartContainer config={{ solicitacoes: { label: "Solicitações", color: "#f59e0b" } }} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelosChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="modelo" type="category" width={150} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="solicitacoes" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      </div>
    </div>
  );
}
