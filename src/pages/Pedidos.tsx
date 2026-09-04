import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Trash2 } from "lucide-react";
import ModalNovoPedido from "@/components/ModalNovoPedido";

export default function Pedidos() {
  const [, setLocation] = useLocation();
  const [filtro, setFiltro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  const pedidosQuery = trpc.pedidos.listar.useQuery();
  const deletarMutation = trpc.pedidos.deletar.useMutation();

  const pedidosFiltrados = (pedidosQuery.data?.filter((p: any) =>
    p.numero.includes(filtro) ||
    (p.clienteNome || "").toLowerCase().includes(filtro.toLowerCase())
  ) || []).sort((a: any, b: any) => {
    if (a.status === "aberto" && b.status !== "aberto") return -1;
    if (a.status !== "aberto" && b.status === "aberto") return 1;
    return 0;
  });

  const handleDeletar = async (id: number, numero: string) => {
    if (!confirm(`Deseja excluir o pedido #${numero}? O pedido de remanufatura gerado a partir dele também será excluído.`)) return;
    try {
      await deletarMutation.mutateAsync(id);
      pedidosQuery.refetch();
    } catch (error) {
      console.error("Erro ao deletar pedido:", error);
    }
  };

  const criarPedidoMutation = trpc.pedidos.criar.useMutation();

  const handleNovoPedido = async (clienteId: number, cartuchos?: any[], observacaoGeral?: string) => {
    try {
      // Pedido + itens são gravados em uma única operação atômica no backend
      await criarPedidoMutation.mutateAsync({ clienteId, cartuchos: cartuchos ?? [], observacaoGeral });
      setModalAberto(false);
      pedidosQuery.refetch();
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto overflow-x-hidden pr-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">{pedidosQuery.data?.length || 0} pedido(s) cadastrado(s)</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Filtrar por número ou cliente..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b bg-muted">
                <th className="px-4 py-3 text-left text-sm font-medium">Nº Pedido</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Data de Criação</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Data de Finalização</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {filtro ? "Nenhum pedido encontrado." : "Nenhum pedido cadastrado ainda."}
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p: any) => (
                  <tr 
                    key={p.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => setLocation(`/pedidos/${p.id}`)}
                  >
                    <td className="px-4 py-3 font-mono font-bold">#{p.numero}</td>
                    <td className="px-4 py-3">{p.clienteNome || "-"}</td>
                    <td className="px-4 py-3 text-sm">{new Date(p.dataCriacao).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">{p.dataFinalizacao ? new Date(p.dataFinalizacao).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${p.status === "finalizado" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                        {p.status === "finalizado" ? "Finalizado" : "Aberto"}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/pedidos/${p.id}`)}
                          title="Abrir pedido"
                        >
                          Abrir
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletar(p.id, p.numero)}
                          title="Deletar pedido"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalAberto && (
        <ModalNovoPedido
          onSalvar={handleNovoPedido}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}
