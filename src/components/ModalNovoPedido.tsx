import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  onSalvar: (clienteId: number, cartuchos?: any[]) => void;
  onFechar: () => void;
}

interface CartuchodoFormulario {
  id: string;
  cartuchoId: string;
  codigo: string;
  pesoChegada: string;
  pesoSaida: string;
  protegido: boolean;
  observacoes: string;
}

const formatarPeso = (valor: string) => {
  const apenasNumeros = valor.replace(/\D/g, "");
  
  if (apenasNumeros.length <= 2) {
    return apenasNumeros;
  }
  
  const parte1 = apenasNumeros.slice(0, -2);
  const parte2 = apenasNumeros.slice(-2);
  return `${parte1},${parte2}`;
};

const converterPesoParaNumero = (peso: string): number | undefined => {
  if (!peso) return undefined;
  const numerico = peso.replace(",", ".");
  const valor = parseFloat(numerico);
  return isNaN(valor) ? undefined : valor;
};

export default function ModalNovoPedido({ onSalvar, onFechar }: Props) {
  const [clienteId, setClienteId] = useState<string>("");
  const [buscaCliente, setBuscaCliente] = useState<string>("");
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [cartuchos, setCartuchos] = useState<CartuchodoFormulario[]>([]);
  const [novoCartucho, setNovoCartucho] = useState<CartuchodoFormulario>({
    id: "",
    cartuchoId: "",
    codigo: "",
    pesoChegada: "",
    pesoSaida: "",
    protegido: false,
    observacoes: "",
  });

  const clientesQuery = trpc.clientes.listar.useQuery();
  const cartuchosQuery = trpc.cartuchos.listar.useQuery();

  const clientesFiltrados = clientesQuery.data?.filter((c: any) => 
    c.nome.toUpperCase().includes(buscaCliente.toUpperCase())
  ) || [];

  const handleSelecionarCliente = (cliente: any) => {
    setClienteId(cliente.id.toString());
    setClienteSelecionado(cliente);
    setBuscaCliente(cliente.nome);
  };

  const handleAdicionarCartucho = () => {
    if (!novoCartucho.codigo.trim()) {
      alert("Digite o código do cartucho.");
      return;
    }
    const cartuchodComId = {
      ...novoCartucho,
      id: `cartucho-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setCartuchos([...cartuchos, cartuchodComId]);
    setNovoCartucho({
      id: "",
      cartuchoId: "",
      codigo: "",
      pesoChegada: "",
      pesoSaida: "",
      protegido: false,
      observacoes: "",
    });
  };

  const handleRemoverCartucho = (id: string) => {
    setCartuchos(cartuchos.filter((c) => c.id !== id));
  };

  const handleChangePeso = (tipo: "chegada" | "saida", valor: string) => {
    const formatado = formatarPeso(valor);
    if (tipo === "chegada") {
      setNovoCartucho(c => ({ ...c, pesoChegada: formatado }));
    } else {
      setNovoCartucho(c => ({ ...c, pesoSaida: formatado }));
    }
  };

  const handleChangeCartucho = (campo: keyof CartuchodoFormulario, valor: any) => {
    if (campo === "codigo") {
      setNovoCartucho(c => ({ ...c, [campo]: valor.toUpperCase() }));
    } else {
      setNovoCartucho(c => ({ ...c, [campo]: valor }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      alert("Selecione um cliente.");
      return;
    }
    onSalvar(parseInt(clienteId), cartuchos);
  };

  return (
    <Dialog open={true} onOpenChange={onFechar}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Cliente *</label>
            <Input
              placeholder="Digite o nome do cliente para buscar..."
              value={buscaCliente}
              onChange={(e) => setBuscaCliente(e.target.value)}
              className="mb-2"
            />
            {buscaCliente && clientesFiltrados.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto bg-white">
                {clientesFiltrados.slice(0, 10).map((c: any) => (
                  <div
                    key={c.id}
                    className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelecionarCliente(c)}
                  >
                    <div className="font-medium">{c.nome}</div>
                    {c.telefone && <div className="text-xs text-muted-foreground">{c.telefone}</div>}
                  </div>
                ))}
              </div>
            )}
            {buscaCliente && clientesFiltrados.length === 0 && (
              <div className="text-sm text-muted-foreground p-2">Nenhum cliente encontrado</div>
            )}
            {clienteId && (
              <div className="text-sm text-green-600 mt-2">
                ✓ Cliente selecionado: {clienteSelecionado?.nome}
              </div>
            )}
          </div>

          {/* Seção de Cartuchos */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Adicionar Cartuchos ao Pedido</h3>

            {/* Formulário para novo cartucho */}
            <div className="bg-muted p-4 rounded-lg space-y-3 mb-4">
              <div>
                <label className="text-sm font-medium">Modelo</label>
                <Select value={novoCartucho.cartuchoId} onValueChange={(v) => handleChangeCartucho("cartuchoId", v)}>
                  <SelectTrigger className="h-8 w-full truncate">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="max-w-md">
                    {cartuchosQuery.data?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.modelo02} - {c.modelo01}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Código</label>
                  <Input
                    value={novoCartucho.codigo}
                    onChange={(e) => handleChangeCartucho("codigo", e.target.value)}
                    placeholder="Código"
                    className="h-8"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Peso Chegada (kg)</label>
                  <Input
                    value={novoCartucho.pesoChegada}
                    onChange={(e) => handleChangePeso("chegada", e.target.value)}
                    placeholder="0,00"
                    className="h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Peso Saída (kg)</label>
                  <Input
                    value={novoCartucho.pesoSaida}
                    onChange={(e) => handleChangePeso("saida", e.target.value)}
                    placeholder="0,00"
                    className="h-8"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Checkbox
                    id="protegido"
                    checked={novoCartucho.protegido}
                    onCheckedChange={(v) => handleChangeCartucho("protegido", v)}
                  />
                  <label htmlFor="protegido" className="text-sm font-medium cursor-pointer">
                    Protegido
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={novoCartucho.observacoes}
                  onChange={(e) => handleChangeCartucho("observacoes", e.target.value)}
                  placeholder="Observações sobre o cartucho..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Button type="button" onClick={handleAdicionarCartucho} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cartucho
              </Button>
            </div>

            {/* Lista de cartuchos adicionados */}
            {cartuchos.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Cartuchos adicionados ({cartuchos.length})</h4>
                {cartuchos.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                    <div>
                      <div className="font-medium">{c.codigo}</div>
                      <div className="text-xs text-muted-foreground">
                        Chegada: {c.pesoChegada || "-"} | Saída: {c.pesoSaida || "-"}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoverCartucho(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Pedido
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
