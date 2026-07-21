import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const COLORS = {
  critica: "#dc2626",
  alta: "#f97316",
  media: "#eab308",
  baixa: "#22c55e",
};

export default function PainelErros() {
  const [selectedError, setSelectedError] = useState<number | null>(null);

  // Queries
  const resumoQuery = trpc.erros.obterResumo.useQuery();
  const estatisticasQuery = trpc.erros.obterEstatisticas.useQuery();
  const errosNaoResolvidosQuery = trpc.erros.obterNaoResolvidos.useQuery();
  const errosRecentesQuery = trpc.erros.obterRecentes.useQuery({ limite: 50 });

  // Mutations
  const marcarResolvidoMutation = trpc.erros.marcarResolvido.useMutation({
    onSuccess: () => {
      errosNaoResolvidosQuery.refetch();
      resumoQuery.refetch();
    },
  });

  const resumo = resumoQuery.data || { critica: 0, alta: 0, media: 0, baixa: 0, total: 0 };
  const estatisticas = estatisticasQuery.data || [];
  const errosNaoResolvidos = errosNaoResolvidosQuery.data || [];
  const errosRecentes = errosRecentesQuery.data || [];

  // Preparar dados para gráficos
  const dataResumo = [
    { name: "Crítica", value: resumo.critica, color: COLORS.critica },
    { name: "Alta", value: resumo.alta, color: COLORS.alta },
    { name: "Média", value: resumo.media, color: COLORS.media },
    { name: "Baixa", value: resumo.baixa, color: COLORS.baixa },
  ].filter(d => d.value > 0);

  const dataEstatisticas = estatisticas.map((e: any) => ({
    name: e.errorType,
    count: Number(e.count),
    severity: e.severity,
  }));

  const getSeverityColor = (severity: string) => {
    return COLORS[severity as keyof typeof COLORS] || "#6b7280";
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      critica: "Crítica",
      alta: "Alta",
      media: "Média",
      baixa: "Baixa",
    };
    return labels[severity] || severity;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Painel de Rastreamento de Erros</h1>
        <p className="text-gray-600">Monitore e resolva erros recorrentes do sistema</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resumo.total}</div>
            <p className="text-xs text-gray-500">Não resolvidos</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Crítica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{resumo.critica}</div>
            <p className="text-xs text-red-600">Requer atenção imediata</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Alta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{resumo.alta}</div>
            <p className="text-xs text-orange-600">Prioridade alta</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{resumo.media}</div>
            <p className="text-xs text-yellow-600">Monitorar</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Severidade</CardTitle>
            <CardDescription>Erros não resolvidos</CardDescription>
          </CardHeader>
          <CardContent>
            {dataResumo.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dataResumo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dataResumo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Nenhum erro registrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Erros por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Erros por Tipo</CardTitle>
            <CardDescription>Contagem de ocorrências</CardDescription>
          </CardHeader>
          <CardContent>
            {dataEstatisticas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataEstatisticas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Sem dados de erros
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Erros Não Resolvidos */}
      <Card>
        <CardHeader>
          <CardTitle>Erros Não Resolvidos</CardTitle>
          <CardDescription>Clique para resolver</CardDescription>
        </CardHeader>
        <CardContent>
          {errosNaoResolvidos.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {errosNaoResolvidos.map((erro: any) => (
                <div
                  key={erro.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setSelectedError(erro.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" style={{ borderColor: getSeverityColor(erro.severity), color: getSeverityColor(erro.severity) }}>
                          {getSeverityLabel(erro.severity)}
                        </Badge>
                        <span className="text-sm font-medium text-gray-700">{erro.errorType}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{erro.errorMessage}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(erro.criadoEm).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        marcarResolvidoMutation.mutate({
                          erroId: erro.id,
                          notes: "Resolvido pelo usuário",
                        });
                      }}
                      disabled={marcarResolvidoMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum erro não resolvido!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Erros Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Erros Recentes</CardTitle>
          <CardDescription>Últimos 50 erros registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {errosRecentes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Tipo</th>
                    <th className="text-left py-2 px-2">Mensagem</th>
                    <th className="text-left py-2 px-2">Severidade</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {errosRecentes.map((erro: any) => (
                    <tr key={erro.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium text-gray-700">{erro.errorType}</td>
                      <td className="py-2 px-2 text-gray-600 truncate max-w-xs">{erro.errorMessage}</td>
                      <td className="py-2 px-2">
                        <Badge
                          variant="outline"
                          style={{ borderColor: getSeverityColor(erro.severity), color: getSeverityColor(erro.severity) }}
                        >
                          {getSeverityLabel(erro.severity)}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        {erro.resolved ? (
                          <Badge className="bg-green-100 text-green-800">Resolvido</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Pendente</Badge>
                        )}
                      </td>
                      <td className="py-2 px-2 text-gray-500 text-xs">
                        {new Date(erro.criadoEm).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum erro registrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
