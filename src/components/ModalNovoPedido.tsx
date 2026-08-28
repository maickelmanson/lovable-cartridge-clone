import { useMemo, useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";

interface Props {
  onSalvar: (clienteId: number, cartuchos?: any[], observacaoGeral?: string) => void;
  onFechar: () => void;
  clienteId?: number;
  clienteNome?: string;
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

/** Normaliza texto (sem acentos, minúsculo, sem separadores) para busca fuzzy */
function norm(v: unknown) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s\-_.]/g, "");
}

export default function ModalNovoPedido({ onSalvar, onFechar, clienteId: clienteIdInicial, clienteNome }: Props) {
  const [clienteId, setClienteId] = useState<string>(clienteIdInicial ? String(clienteIdInicial) : "");
  const [buscaCliente, setBuscaCliente] = useState<string>(clienteNome || "");
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(
    clienteIdInicial ? { id: clienteIdInicial, nome: clienteNome } : null,
  );
  const [observacaoGeral, setObservacaoGeral] = useState<string>("");
  const [buscaCartucho, setBuscaCartucho] = useState<string>("");
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
    norm(c.nome).includes(norm(buscaCliente))
  ) || [];

  const modeloSelecionado = useMemo(
    () => cartuchosQuery.data?.find((c: any) => String(c.id) === novoCartucho.cartuchoId),
    [cartuchosQuery.data, novoCartucho.cartuchoId],
  );

  /** Busca por qualquer parte do modelo 01/02, inclusive apenas números */
  const modelosFiltrados = useMemo(() => {
    const termo = norm(buscaCartucho);
    const lista = cartuchosQuery.data ?? [];
    if (!termo) return lista.slice(0, 15);
    return lista
      .filter((c: any) => {
        const alvo = norm(`${c.modelo02} ${c.modelo01}`);
        if (alvo.includes(termo)) return true;
        // fuzzy: caracteres na ordem
        let i = 0;
        for (const ch of alvo) {
          if (ch === termo[i]) i++;
          if (i === termo.length) return true;
        }
        return false;
      })
      .slice(0, 15);
  }, [cartuchosQuery.data, buscaCartucho]);

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
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cartucho-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
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
    setBuscaCartucho("");
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
    onSalvar(parseInt(clienteId), cartuchos, observacaoGeral);
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
              onChange={(e) => {
                setBuscaCliente(e.target.value);
                setClienteId("");
                setClienteSelecionado(null);
              }}
              className="mb-2"
            />
            {buscaCliente && !clienteId && clientesFiltrados.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto bg-background">
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
            {buscaCliente && !clienteId && clientesFiltrados.length === 0 && (
              <div className="text-sm text-muted-foreground p-2">Nenhum cliente encontrado</div>
            )}
            {clienteId && (
              <div className="text-sm text-emerald-600 mt-2">
                ✓ Cliente selecionado: {clienteSelecionado?.nome}
              </div>
            )}
          </div>

          {/* Observação geral do pedido */}
          <div>
            <label className="text-sm font-medium">Observação geral do pedido</label>
            <Textarea
              value={observacaoGeral}
              onChange={(e) => setObservacaoGeral(e.target.value)}
              placeholder="Observações gerais sobre este pedido..."
              rows={4}
              className="resize-y"
            />
          </div>

          {/* Seção de Cartuchos */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Adicionar Cartuchos ao Pedido</h3>

            {/* Formulário para novo cartucho */}
            <div className="bg-muted p-4 rounded-lg space-y-3 mb-4">
              <div>
                <label className="text-sm font-medium">Modelo</label>
                <Input
                  value={buscaCartucho}
                  onChange={(e) => {
                    setBuscaCartucho(e.target.value);
                    handleChangeCartucho("cartuchoId", "");
                  }}
                  placeholder="Digite parte do nome ou número do modelo..."
                  className="h-8"
                />
                {!novoCartucho.cartuchoId && buscaCartucho && (
                  <div className="border rounded-md max-h-40 overflow-y-auto bg-background mt-1">
                    {modelosFiltrados.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-2 text-sm hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          handleChangeCartucho("cartuchoId", String(c.id));
                          setBuscaCartucho(`${c.modelo02} - ${c.modelo01}`);
                        }}
                      >
                        {c.modelo02} - {c.modelo01}
                      </div>
                    ))}
                    {modelosFiltrados.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">Nenhum modelo encontrado</div>
                    )}
                  </div>
                )}
                {modeloSelecionado && (
                  <div className="text-xs text-emerald-600 mt-1">
                    ✓ {modeloSelecionado.modelo02} - {modeloSelecionado.modelo01}
                  </div>
                )}
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
