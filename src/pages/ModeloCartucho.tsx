import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ============================================================
// Funções de formatação de moeda BRL
// ============================================================

/**
 * Formata um valor para exibição em moeda brasileira (R$ 1.234,56)
 */
function formatCurrencyDisplay(value: string | null | undefined): string {
  if (!value || value === "0" || value === "0.00") return "";
  const num = parseFloat(value);
  if (isNaN(num)) return "";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Formata input de moeda: aceita apenas números e vírgula
 * Converte automaticamente para formato com vírgula (ex: 4500 -> 45,00)
 */
function formatCurrencyInput(rawValue: string): string {
  // Remove tudo que não é número
  const digits = rawValue.replace(/\D/g, "");
  if (!digits) return "";
  
  // Converte para centavos e formata
  const cents = parseInt(digits, 10);
  const reais = (cents / 100).toFixed(2);
  
  // Formata com separador brasileiro
  const [intPart, decPart] = reais.split(".");
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intFormatted},${decPart}`;
}

/**
 * Converte valor formatado em BRL para decimal (para enviar ao backend)
 * Ex: "1.234,56" -> "1234.56"
 */
function parseCurrencyToDecimal(formatted: string): string {
  if (!formatted || formatted.trim() === "") return "";
  // Remove pontos de milhar e troca vírgula por ponto
  const clean = formatted.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(clean);
  if (isNaN(num)) return "";
  return num.toFixed(2);
}

/**
 * Converte valor decimal do backend para formato de input BRL
 * Ex: "45.00" -> "45,00"
 */
function decimalToInputFormat(value: string | null | undefined): string {
  if (!value || value === "0" || value === "0.00") return "";
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return "";
  const fixed = num.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intFormatted},${decPart}`;
}

// ============================================================
// Componente Principal
// ============================================================

interface ModeloForm {
  modelo01: string;
  modelo02: string;
  priceFinalCustomer: string;
  priceReseller: string;
}

const emptyForm: ModeloForm = {
  modelo01: "",
  modelo02: "",
  priceFinalCustomer: "",
  priceReseller: "",
};

export default function ModeloCartucho() {
  const [filtro, setFiltro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState<ModeloForm>(emptyForm);

  const cartuchosQuery = trpc.cartuchos.listar.useQuery();
  const criarMutation = trpc.cartuchos.criar.useMutation();
  const atualizarMutation = trpc.cartuchos.atualizar.useMutation();
  const deletarMutation = trpc.cartuchos.deletar.useMutation();

  const filtrados = (cartuchosQuery.data || []).filter((c: any) =>
    c.modelo01.toLowerCase().includes(filtro.toLowerCase()) ||
    c.modelo02.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleAbrirNovo = () => {
    setEditando(null);
    setForm(emptyForm);
    setModalAberto(true);
  };

  const handleAbrirEditar = (cartucho: any) => {
    setEditando(cartucho);
    setForm({
      modelo01: cartucho.modelo01 || "",
      modelo02: cartucho.modelo02 || "",
      priceFinalCustomer: decimalToInputFormat(cartucho.priceFinalCustomer),
      priceReseller: decimalToInputFormat(cartucho.priceReseller),
    });
    setModalAberto(true);
  };

  const handleCurrencyChange = (field: "priceFinalCustomer" | "priceReseller", rawValue: string) => {
    setForm(f => ({ ...f, [field]: formatCurrencyInput(rawValue) }));
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modelo01.trim() || !form.modelo02.trim()) {
      toast.error("Modelo 01 e Modelo 02 são obrigatórios.");
      return;
    }
    try {
      const payload = {
        modelo01: form.modelo01.trim(),
        modelo02: form.modelo02.trim(),
        priceFinalCustomer: parseCurrencyToDecimal(form.priceFinalCustomer),
        priceReseller: parseCurrencyToDecimal(form.priceReseller),
      };

      if (editando) {
        await atualizarMutation.mutateAsync({ id: editando.id, ...payload });
        toast.success("Modelo atualizado com sucesso!");
      } else {
        await criarMutation.mutateAsync(payload);
        toast.success("Modelo cadastrado com sucesso!");
      }
      setModalAberto(false);
      cartuchosQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar modelo.");
    }
  };

  const handleDeletar = async (id: number, modelo02: string) => {
    if (!confirm(`Deseja excluir o modelo "${modelo02}"?`)) return;
    try {
      await deletarMutation.mutateAsync(id);
      toast.success("Modelo removido com sucesso.");
      cartuchosQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover modelo.");
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto overflow-x-hidden pr-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modelo Cartucho</h1>
          <p className="text-muted-foreground">
            {cartuchosQuery.data?.length || 0} modelo(s) cadastrado(s)
          </p>
        </div>
        <Button onClick={handleAbrirNovo}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Modelo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Filtrar por modelo..."
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
                <th className="px-4 py-3 text-left text-sm font-medium">Modelo 01</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Modelo 02</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Valor Cliente Final</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Valor Revenda</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {filtro ? "Nenhum modelo encontrado." : "Nenhum modelo cadastrado ainda."}
                  </td>
                </tr>
              ) : (
                filtrados.map((c: any) => (
                  <tr
                    key={c.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleAbrirEditar(c)}
                  >
                    <td className="px-4 py-3">{c.modelo01}</td>
                    <td className="px-4 py-3 font-mono font-bold">{c.modelo02}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">
                      {formatCurrencyDisplay(c.priceFinalCustomer)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-blue-600">
                      {formatCurrencyDisplay(c.priceReseller)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAbrirEditar(c)}
                          title="Editar modelo"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletar(c.id, c.modelo02)}
                          title="Deletar modelo"
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
        <Dialog open={true} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editando ? "Editar Modelo" : "Novo Modelo de Cartucho"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Modelo 01 *</label>
                <Input
                  value={form.modelo01}
                  onChange={(e) => setForm(f => ({ ...f, modelo01: e.target.value.toUpperCase() }))}
                  placeholder="Ex: Cartucho HP 664 Preto Remanufaturado"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Modelo 02 *</label>
                <Input
                  value={form.modelo02}
                  onChange={(e) => setForm(f => ({ ...f, modelo02: e.target.value.toUpperCase() }))}
                  placeholder="Ex: HP 664 BK"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valor Cliente Final</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      value={form.priceFinalCustomer}
                      onChange={(e) => handleCurrencyChange("priceFinalCustomer", e.target.value)}
                      placeholder="0,00"
                      className="pl-10"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Valor Revenda</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      value={form.priceReseller}
                      onChange={(e) => handleCurrencyChange("priceReseller", e.target.value)}
                      placeholder="0,00"
                      className="pl-10"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={criarMutation.isPending || atualizarMutation.isPending}>
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
