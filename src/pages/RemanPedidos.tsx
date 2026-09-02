import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const statusLabel: Record<string, string> = {
  aberto: "Aberto",
  em_processamento: "Em Processamento",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const statusClass: Record<string, string> = {
  aberto: "bg-blue-100 text-blue-800",
  em_processamento: "bg-yellow-100 text-yellow-800",
  finalizado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-800",
};

function formatCurrency(value: string | null | undefined) {
  if (!value) return "R$ 0,00";
  return `R$ ${parseFloat(value).toFixed(2).replace(".", ",")}`;
}

function profileLabel(profile: string) {
  return profile === "REVENDA" ? "Revenda" : "Cliente Final";
}

export default function RemanPedidos() {
  const [, setLocation] = useLocation();
  const [filtro, setFiltro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteId, setClienteId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const pedidosQuery = trpc.remanOrders.listar.useQuery();
  const clientesQuery = trpc.clientes.listar.useQuery();
  const criarMutation = trpc.remanOrders.criar.useMutation();
  const deletarMutation = trpc.remanOrders.deletar.useMutation();

  const pedidosFiltrados = (pedidosQuery.data || []).filter((p: any) =>
    p.orderNumber.toLowerCase().includes(filtro.toLowerCase()) ||
    (p.clienteNome || "").toLowerCase().includes(filtro.toLowerCase())
  );

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      toast.error("Selecione um cliente.");
      return;
    }
    try {
      const result = await criarMutation.mutateAsync({
        clienteId: parseInt(clienteId),
        notes: notes || undefined,
      });
      toast.success("Pedido de remanufatura criado!");
      pedidosQuery.refetch();
      setModalAberto(false);
      setClienteId("");
      setNotes("");
      // Navegar para o detalhe do pedido
      if (result && (result as any).insertId) {
        setLocation(`/reman/pedidos/${(result as any).insertId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar pedido.");
    }
  };

  const handleDeletar = async (id: number, orderNumber: string, pedidoId?: number | null) => {
    const extra = pedidoId
      ? " O pedido de origem na tela Pedidos também será excluído."
      : "";
    if (!confirm(`Deseja excluir o pedido ${orderNumber}? Todos os itens e unidades serão removidos.${extra}`)) return;

    try {
      await deletarMutation.mutateAsync(id);
      toast.success("Pedido removido.");
      pedidosQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover pedido.");
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto overflow-x-hidden pr-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos de Remanufatura</h1>
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
                <th className="px-4 py-3 text-left text-sm font-medium">Perfil</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Subtotal</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Desconto</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    {filtro ? "Nenhum pedido encontrado." : "Nenhum pedido de remanufatura cadastrado ainda."}
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p: any) => (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => setLocation(`/reman/pedidos/${p.id}`)}
                  >
                    <td className="px-4 py-3 font-mono font-bold">{p.orderNumber}</td>
                    <td className="px-4 py-3">{p.clienteNome || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${p.commercialProfileSnapshot === "REVENDA" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
                        {profileLabel(p.commercialProfileSnapshot)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${statusClass[p.status] || "bg-gray-100 text-gray-800"}`}>
                        {statusLabel[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(p.subtotal)}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(p.discount)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600">{formatCurrency(p.total)}</td>
                    <td className="px-4 py-3 text-sm">{new Date(p.criadoEm).toLocaleDateString()}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/reman/pedidos/${p.id}`)}
                          title="Abrir pedido"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletar(p.id, p.orderNumber, p.pedidoId)}
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
        <Dialog open={true} onOpenChange={() => setModalAberto(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Pedido de Remanufatura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCriar} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Cliente *</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Selecione um cliente...</option>
                  {(clientesQuery.data || []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} — {profileLabel(c.commercialProfile || "CLIENTE_FINAL")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Observações</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações do pedido..."
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O perfil comercial será copiado automaticamente do cliente selecionado.
              </p>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={criarMutation.isPending}>
                  Criar Pedido
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
