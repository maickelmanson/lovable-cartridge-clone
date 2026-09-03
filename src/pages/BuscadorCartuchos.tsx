import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsuariosAtivos } from "@/lib/usuariosAtivos";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, Package, Download } from "lucide-react";

/**
 * Página de Busca de Cartuchos por Período
 * Permite buscar cartuchos funcionando em um período específico
 * Exibe quantidade total, valor total e lista detalhada
 */
export default function BuscadorCartuchos() {
  const [dataInicio, setDataInicio] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [dataFim, setDataFim] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [usuarioId, setUsuarioId] = useState<string>("todos");
  const usuariosQuery = useUsuariosAtivos();
  const nomeUsuario = (id?: string | null) =>
    (usuariosQuery.data ?? []).find((u) => u.id === id)?.name || "-";

  const { data, isLoading, error, refetch } = trpc.buscadorCartuchos.listar.useQuery(
    {
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      usuarioId: usuarioId === "todos" ? null : usuarioId,
    },
    {
      enabled: false, // Não fazer query automática
    }
  );

  const handleBuscar = () => {
    refetch();
  };

  const handleExportarCSV = () => {
    if (!data || data.cartuchos.length === 0) return;

    const headers = ["Código", "Descrição", "Responsável", "Preço", "Data"];
    const rows = data.cartuchos.map((cartucho: any) => [
      cartucho.modelo02,
      cartucho.modelo01,
      nomeUsuario(cartucho.usuarioId),
      `R$ ${cartucho.preco?.toFixed(2) ?? '0.00'}`,
      new Date(cartucho.dataFuncionando).toLocaleDateString('pt-BR'),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `cartuchos-${dataInicio}-${dataFim}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const quantidadeTotal = data?.cartuchos.length ?? 0;
  const valorTotal = data?.valorTotal ?? 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Busca de Cartuchos por Período
        </h1>
        <p className="text-muted-foreground">
          Busque cartuchos que funcionaram em um período específico. Visualize quantidade, valor total e detalhes de cada cartucho.
        </p>
      </div>

      {/* Card de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
          <CardDescription>
            Selecione o período de tempo para buscar cartuchos que funcionaram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data Início */}
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Inicial</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Final</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Filtro por usuário */}
          <div className="space-y-2">
            <Label htmlFor="usuario">Usuário</Label>
            <Select value={usuarioId} onValueChange={setUsuarioId}>
              <SelectTrigger id="usuario">
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os usuários</SelectItem>
                {(usuariosQuery.data ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || "Sem nome"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão de Busca */}
          <Button
            onClick={handleBuscar}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Buscar Cartuchos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">
              <strong>Erro:</strong> {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {data && (
        <div className="space-y-4">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantidade Total */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quantidade Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quantidadeTotal}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  cartuchos funcionando
                </p>
              </CardContent>
            </Card>

            {/* Valor Total */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {valorTotal.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  valor total dos cartuchos
                </p>
              </CardContent>
            </Card>

            {/* Período */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono">
                  {new Date(dataInicio).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(dataFim).toLocaleDateString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  período selecionado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Cartuchos */}
          {quantidadeTotal > 0 ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cartuchos Funcionando</CardTitle>
                  <CardDescription>
                    Lista de {quantidadeTotal} cartuchos encontrados
                  </CardDescription>
                </div>
                <Button
                  onClick={handleExportarCSV}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-4 font-medium">Código</th>
                        <th className="text-left py-2 px-4 font-medium">Descrição</th>
                        <th className="text-left py-2 px-4 font-medium">Responsável</th>
                        <th className="text-left py-2 px-4 font-medium">Preço</th>
                        <th className="text-left py-2 px-4 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cartuchos.map((cartucho: any) => (
                        <tr key={cartucho.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4 font-mono text-xs">
                            {cartucho.modelo02}
                          </td>
                          <td className="py-2 px-4 text-xs">
                            {cartucho.modelo01}
                          </td>
                          <td className="py-2 px-4 text-xs">
                            {nomeUsuario(cartucho.usuarioId)}
                          </td>
                          <td className="py-2 px-4 font-semibold">
                            R$ {cartucho.preco?.toFixed(2) ?? '0.00'}
                          </td>
                          <td className="py-2 px-4 text-xs text-muted-foreground">
                            {new Date(cartucho.dataFuncionando).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum cartucho encontrado no período selecionado
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
