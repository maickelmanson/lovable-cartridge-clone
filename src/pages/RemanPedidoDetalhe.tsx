import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Pencil, CheckCircle, AlertCircle, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  params: { id: string };
}

const statusLabel: Record<string, string> = {
  aberto: "Aberto",
  em_processamento: "Em Processamento",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

function formatCurrency(value: string | null | undefined) {
  if (!value) return "R$ 0,00";
  return `R$ ${parseFloat(value).toFixed(2).replace(".", ",")}`;
}

function profileLabel(profile: string) {
  return profile === "REVENDA" ? "Revenda" : "Cliente Final";
}

// ============================================================
// Modal de Adicionar Item
// ============================================================
function ModalAdicionarItem({ orderId, onSalvo, onFechar }: { orderId: number; onSalvo: () => void; onFechar: () => void }) {
  const [cartridgeModelId, setCartridgeModelId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const modelosQuery = trpc.cartuchos.listar.useQuery();
  const criarMutation = trpc.remanOrderItems.criar.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartridgeModelId) {
      toast.error("Selecione um modelo de cartucho.");
      return;
    }
    try {
      await criarMutation.mutateAsync({
        orderId,
        cartuchoId: parseInt(cartridgeModelId),
        quantity: parseInt(quantity),
      });
      toast.success("Item adicionado ao pedido!");
      onSalvo();
      onFechar();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar item.");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onFechar}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Item ao Pedido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Modelo de Cartucho *</label>
            <select
              value={cartridgeModelId}
              onChange={(e) => setCartridgeModelId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="">Selecione um modelo...</option>
              {(modelosQuery.data || []).map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.modelo01} — {m.modelo02}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Quantidade *</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            O preço será calculado automaticamente com base no perfil comercial do pedido.
          </p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" disabled={criarMutation.isPending}>Adicionar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Modal de Adicionar Unidade Física
// ============================================================
function ModalAdicionarUnidade({ item, onSalvo, onFechar }: { item: any; onSalvo: () => void; onFechar: () => void }) {
  const [form, setForm] = useState({
    unitCode: "",
    status: "FUNCIONANDO" as "FUNCIONANDO" | "COM_PROBLEMA",
    defectType: "",
    outputWeight: "",
    notes: "",
  });

  const criarMutation = trpc.remanOrderUnits.criar.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === "unitCode" ? value.toUpperCase() : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unitCode.trim()) {
      toast.error("Código da unidade é obrigatório.");
      return;
    }
    if (form.status === "FUNCIONANDO" && !form.outputWeight) {
      toast.error("Peso de saída é obrigatório para cartuchos FUNCIONANDO.");
      return;
    }
    if (form.status === "COM_PROBLEMA" && !form.defectType.trim()) {
      toast.error("Tipo de defeito é obrigatório para cartuchos COM_PROBLEMA.");
      return;
    }
    try {
      await criarMutation.mutateAsync({
        orderItemId: item.id,
        cartuchoId: item.cartuchoId,
        unitCode: form.unitCode,
        status: form.status,
        defectType: form.defectType || undefined,
        outputWeight: form.outputWeight || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Unidade adicionada!");
      onSalvo();
      onFechar();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar unidade.");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onFechar}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Unidade Física</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Modelo: {item.modelCodeSnapshot} — {item.descriptionSnapshot}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Código da Unidade *</label>
            <Input
              name="unitCode"
              value={form.unitCode}
              onChange={handleChange}
              placeholder="Ex: SERIAL-001"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Status *</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange as any}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="FUNCIONANDO">Funcionando</option>
              <option value="COM_PROBLEMA">Com Problema</option>
            </select>
          </div>
          {form.status === "FUNCIONANDO" && (
            <div>
              <label className="text-sm font-medium">Peso de Saída (kg) *</label>
              <Input
                name="outputWeight"
                value={form.outputWeight}
                onChange={handleChange}
                placeholder="Ex: 35,66"
                required
              />
            </div>
          )}
          {form.status === "COM_PROBLEMA" && (
            <div>
              <label className="text-sm font-medium">Tipo de Defeito *</label>
              <Input
                name="defectType"
                value={form.defectType}
                onChange={handleChange}
                placeholder="Ex: CIRCUITO QUEIMADO"
                required
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Observações sobre esta unidade..."
              rows={2}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" disabled={criarMutation.isPending}>Adicionar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Sub-componente: Unidades de um item (hook no nível correto)
// ============================================================
function ItemUnidades({ item, onDeletarUnidade, onAbrirModal }: {
  item: any;
  onDeletarUnidade: (unitId: number) => void;
  onAbrirModal: (item: any) => void;
}) {
  const unidadesQuery = trpc.remanOrderUnits.listar.useQuery(item.id);
  const unidades = unidadesQuery.data || [];

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-mono font-medium">{item.modelCodeSnapshot}</span>
          {item.descriptionSnapshot && (
            <span className="text-sm text-muted-foreground ml-2">— {item.descriptionSnapshot}</span>
          )}
          <span className="text-xs text-muted-foreground ml-2">({unidades.length}/{item.quantity} unidades)</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAbrirModal(item)}
          disabled={unidades.length >= item.quantity}
        >
          <Plus className="h-3 w-3 mr-1" />
          Adicionar Unidade
        </Button>
      </div>
      {unidades.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma unidade cadastrada.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Defeito / Peso Saída</th>
              <th className="px-3 py-2 text-left">Observações</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {unidades.map((u: any) => (
              <tr key={u.id} className={`border-b ${u.status === "COM_PROBLEMA" ? "bg-red-50 dark:bg-red-950/20" : "bg-emerald-50 dark:bg-emerald-950/20"}`}>
                <td className="px-3 py-2 font-mono">{u.unitCode}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 w-fit ${u.status === "FUNCIONANDO" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                    {u.status === "FUNCIONANDO" ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {u.status === "FUNCIONANDO" ? "Funcionando" : "Com Problema"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {u.status === "FUNCIONANDO" ? (
                    <span className="text-emerald-700">{u.outputWeight ? `${u.outputWeight} kg` : "-"}</span>
                  ) : (
                    <span className="text-red-700">{u.defectType || "-"}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{u.notes || "-"}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeletarUnidade(u.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================
// Componente Principal
// ============================================================
export default function RemanPedidoDetalhe({ params }: Props) {
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const [modalItem, setModalItem] = useState(false);
  const [modalUnidade, setModalUnidade] = useState<any>(null);
  const [editandoDesconto, setEditandoDesconto] = useState(false);
  const [descontoInput, setDescontoInput] = useState("");
  const [editandoStatus, setEditandoStatus] = useState(false);
  const [statusInput, setStatusInput] = useState("");

  const pedidoQuery = trpc.remanOrders.buscar.useQuery(id);
  const itensQuery = trpc.remanOrderItems.listar.useQuery(id);
  const relatorioQuery = trpc.remanOrders.relatorio.useQuery(id);
  const atualizarPedidoMutation = trpc.remanOrders.atualizar.useMutation();
  const deletarItemMutation = trpc.remanOrderItems.deletar.useMutation();
  const deletarUnidadeMutation = trpc.remanOrderUnits.deletar.useMutation();
  const reabrirPedidoMutation = trpc.remanOrders.reabrir.useMutation();

  const pedido = pedidoQuery.data;
  const itens = itensQuery.data || [];
  const relatorio = relatorioQuery.data;

  const refetchAll = () => {
    pedidoQuery.refetch();
    itensQuery.refetch();
    relatorioQuery.refetch();
  };

  const handleSalvarDesconto = async () => {
    try {
      await atualizarPedidoMutation.mutateAsync({
        id,
        discount: descontoInput || "0",
      });
      toast.success("Desconto atualizado!");
      setEditandoDesconto(false);
      pedidoQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar desconto.");
    }
  };

  const handleSalvarStatus = async () => {
    try {
      await atualizarPedidoMutation.mutateAsync({
        id,
        status: statusInput as any,
      });
      toast.success("Status atualizado!");
      setEditandoStatus(false);
      pedidoQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status.");
    }
  };

  const handleDeletarItem = async (itemId: number) => {
    if (!confirm("Deseja remover este item? As unidades físicas também serão removidas.")) return;
    try {
      await deletarItemMutation.mutateAsync({ id: itemId, orderId: id });
      toast.success("Item removido.");
      refetchAll();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover item.");
    }
  };

  const handleDeletarUnidade = async (unitId: number) => {
    if (!confirm("Deseja remover esta unidade física?")) return;
    try {
      await deletarUnidadeMutation.mutateAsync(unitId);
      toast.success("Unidade removida.");
      refetchAll();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover unidade.");
    }
  };

  if (pedidoQuery.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando pedido...</div>;
  }

  if (!pedido) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/reman/pedidos")}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto overflow-x-hidden pr-4">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/reman/pedidos")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Pedido {pedido.orderNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          {pedido.status === "finalizado" && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!confirm("Deseja reabrir este pedido para edição?")) return;
                try {
                  await reabrirPedidoMutation.mutateAsync(id);
                  toast.success("Pedido reaberto para edição!");
                  pedidoQuery.refetch();
                } catch (error: any) {
                  toast.error(error.message || "Erro ao reabrir pedido.");
                }
              }}
              disabled={reabrirPedidoMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Editar Pedido
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation(`/reman/pedidos/${id}/imprimir`)}
          >
            <Printer className="h-4 w-4 mr-1" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BLOCO A — Cabeçalho do Pedido */}
      {/* ============================================================ */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Cabeçalho do Pedido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Número</p>
            <p className="font-mono font-bold text-lg">{pedido.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium">{pedido.clienteNome || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Perfil Comercial</p>
            <span className={`text-xs px-2 py-1 rounded ${pedido.commercialProfileSnapshot === "REVENDA" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
              {profileLabel(pedido.commercialProfileSnapshot)}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            {editandoStatus ? (
              <div className="flex gap-2 items-center mt-1">
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="aberto">Aberto</option>
                  <option value="em_processamento">Em Processamento</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
                <Button size="sm" onClick={handleSalvarStatus}>Salvar</Button>
                <Button size="sm" variant="outline" onClick={() => setEditandoStatus(false)}>Cancelar</Button>
              </div>
            ) : (
              <div className="flex gap-2 items-center mt-1">
                <span className={`text-xs px-2 py-1 rounded ${pedido.status === "finalizado" ? "bg-emerald-100 text-emerald-800" : pedido.status === "cancelado" ? "bg-red-100 text-red-800" : pedido.status === "em_processamento" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}>
                  {statusLabel[pedido.status] || pedido.status}
                </span>
                <Button size="sm" variant="ghost" onClick={() => { setStatusInput(pedido.status); setEditandoStatus(true); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="font-medium">{formatCurrency(pedido.subtotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Desconto</p>
            {editandoDesconto ? (
              <div className="flex gap-2 items-center mt-1">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={descontoInput}
                  onChange={(e) => setDescontoInput(e.target.value)}
                  className="h-8 w-28"
                  placeholder="0.00"
                />
                <Button size="sm" onClick={handleSalvarDesconto}>Salvar</Button>
                <Button size="sm" variant="outline" onClick={() => setEditandoDesconto(false)}>Cancelar</Button>
              </div>
            ) : (
              <div className="flex gap-2 items-center mt-1">
                <span className="text-red-600 font-medium">{formatCurrency(pedido.discount)}</span>
                <Button size="sm" variant="ghost" onClick={() => { setDescontoInput(pedido.discount || "0"); setEditandoDesconto(true); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold text-lg text-emerald-600">{formatCurrency(pedido.total)}</p>
          </div>
          {pedido.notes && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-xs text-muted-foreground">Observações</p>
              <p className="text-sm">{pedido.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* ============================================================ */}
      {/* BLOCO B — Itens do Pedido */}
      {/* ============================================================ */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Itens do Pedido</h2>
          <Button size="sm" onClick={() => setModalItem(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Item
          </Button>
        </div>
        {itens.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Nenhum item adicionado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-4 py-2 text-left text-sm font-medium">Modelo</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Descrição</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Qtd</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Preço Unit.</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Total Linha</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-sm">{item.modelCodeSnapshot}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">{item.descriptionSnapshot || "-"}</td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(item.lineTotal)}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletarItem(item.id)}
                          title="Remover item"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/* BLOCO C — Unidades Físicas por Item */}
      {/* ============================================================ */}
      {itens.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Unidades Físicas</h2>
          <div className="space-y-6">
            {itens.map((item: any) => (
              <ItemUnidades
                key={item.id}
                item={item}
                onDeletarUnidade={handleDeletarUnidade}
                onAbrirModal={setModalUnidade}
              />
            ))}
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* BLOCO D — Relatório Visual */}
      {/* ============================================================ */}
      {relatorio && (relatorio.funcionando.length > 0 || relatorio.comProblema.length > 0) && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Relatório Final</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Funcionando */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="font-medium text-emerald-700">Funcionando ({relatorio.funcionando.length})</h3>
              </div>
              {relatorio.funcionando.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum cartucho funcionando.</p>
              ) : (
                <div className="space-y-2">
                  {relatorio.funcionando.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 rounded px-3 py-2 text-sm">
                      <span className="font-mono">{u.unitCode}</span>
                      <span className="text-muted-foreground">{u.modelo02}</span>
                      <span className="text-emerald-700 font-medium">{u.outputWeight ? `${u.outputWeight} kg` : "-"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Com Problema */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-700">Com Problema ({relatorio.comProblema.length})</h3>
              </div>
              {relatorio.comProblema.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum cartucho com problema.</p>
              ) : (
                <div className="space-y-2">
                  {relatorio.comProblema.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 rounded px-3 py-2 text-sm">
                      <span className="font-mono">{u.unitCode}</span>
                      <span className="text-muted-foreground">{u.modelo02}</span>
                      <span className="text-red-700 font-medium">{u.defectType || "-"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Modais */}
      {modalItem && (
        <ModalAdicionarItem
          orderId={id}
          onSalvo={refetchAll}
          onFechar={() => setModalItem(false)}
        />
      )}
      {modalUnidade && (
        <ModalAdicionarUnidade
          item={modalUnidade}
          onSalvo={refetchAll}
          onFechar={() => setModalUnidade(null)}
        />
      )}
    </div>
  );
}
