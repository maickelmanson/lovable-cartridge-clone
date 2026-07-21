import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, Package } from "lucide-react";

/**
 * Página de teste isolada para o buscador de cartuchos funcionando por período
 * Esta página não afeta o sistema atual e é usada apenas para testes
 */
export default function TestBuscadorCartuchos() {
  const [dataInicio, setDataInicio] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [dataFim, setDataFim] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const { data, isLoading, error, refetch } = trpc.buscadorCartuchos.listar.useQuery(
    {
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
    },
    {
      enabled: false, // Não fazer query automática
    }
  );

  const handleBuscar = () => {
    refetch();
  };

  const quantidadeTotal = data?.cartuchos.length ?? 0;
  const valorTotal = data?.valorTotal ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          🧪 Teste - Buscador de Cartuchos por Período
        </h1>
        <p className="text-muted-foreground">
          Módulo isolado para testar a busca de cartuchos funcionando em um período específico.
          Esta página não afeta o sistema atual.
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
              <CardHeader>
                <CardTitle>Cartuchos Funcionando</CardTitle>
                <CardDescription>
                  Lista de {quantidadeTotal} cartuchos encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-4 font-medium">Código</th>
                        <th className="text-left py-2 px-4 font-medium">Descrição</th>
                        <th className="text-left py-2 px-4 font-medium">Preço</th>
                        <th className="text-left py-2 px-4 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cartuchos.map((cartucho) => (
                        <tr key={cartucho.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4 font-mono text-xs">
                            {cartucho.modelo02}
                          </td>
                          <td className="py-2 px-4 text-xs">
                            {cartucho.modelo01}
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

      {/* Instruções */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">ℹ️ Instruções de Teste</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>
            1. Selecione a data inicial e final do período que deseja buscar
          </p>
          <p>
            2. Clique em "Buscar Cartuchos" para executar a busca
          </p>
          <p>
            3. Verifique os resultados: quantidade total, valor total e lista de cartuchos
          </p>
          <p>
            4. Teste com diferentes períodos para validar a funcionalidade
          </p>
          <p>
            5. Após aprovação, esta funcionalidade será integrada ao sistema principal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
