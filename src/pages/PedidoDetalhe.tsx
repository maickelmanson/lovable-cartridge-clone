import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2, Printer, RotateCcw, CheckCircle, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { openWhatsApp } from "@/lib/whatsapp";
import ModalCartucho from "@/components/ModalCartucho";

interface Props {
  params: { id: string };
}

const STATUS_OPTIONS = [
  { value: "em_espera", label: "Em Espera", color: "bg-gray-100 text-gray-800" },
  { value: "em_andamento", label: "Em andamento", color: "bg-yellow-100 text-yellow-800" },
  { value: "processo", label: "Processo", color: "bg-blue-100 text-blue-800" },
  { value: "funcionando", label: "Funcionando", color: "bg-emerald-100 text-emerald-800" },
  { value: "circuito_queimado", label: "Circuito Queimado", color: "bg-red-100 text-red-800" },
  { value: "defeito_cabeca", label: "Defeito na Cabeça", color: "bg-red-100 text-red-800" },
  { value: "garantia", label: "Garantia", color: "bg-yellow-100 text-yellow-800" },
];

const formatarPesoComVirgula = (valor: string) => {
  const apenasNumeros = valor.replace(/\D/g, "");
  if (apenasNumeros.length <= 2) {
    return apenasNumeros.padStart(2, "0");
  }
  if (apenasNumeros.length <= 4) {
    const parte1 = apenasNumeros.slice(0, -2).padStart(2, "0");
    const parte2 = apenasNumeros.slice(-2);
    return `${parte1},${parte2}`;
  }
  const limitado = apenasNumeros.slice(-4);
  const parte1 = limitado.slice(0, -2).padStart(2, "0");
  const parte2 = limitado.slice(-2);
  return `${parte1},${parte2}`;
};

export default function PedidoDetalhe({ params }: Props) {
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const [modalAberto, setModalAberto] = useState(false);
  const [cartuchoditando, setCartuchoditando] = useState<any>(null);
  const [editandoPeso, setEditandoPeso] = useState<{ id: number; tipo: "chegada" | "saida" } | null>(null);
  const [pesoTemp, setPesoTemp] = useState("");
  const [reabrindo, setReabrindo] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const pedidoQuery = trpc.pedidos.buscar.useQuery(id);
  const cartuchosQuery = trpc.pedidoCartuchos.listar.useQuery(id);
  const finalizarMutation = trpc.pedidos.finalizar.useMutation();
  const reabrirMutation = trpc.pedidos.reabrir.useMutation();
  const removerMutation = trpc.pedidoCartuchos.remover.useMutation();
  const atualizarMutation = trpc.pedidoCartuchos.atualizar.useMutation();
  const duplicarMutation = trpc.pedidos.duplicar.useMutation();
  const clienteQuery = trpc.clientes.buscar.useQuery(Number(pedidoQuery.data?.clienteId ?? 0));

  const handleFinalizarPedido = async () => {
    if (!confirm("Deseja finalizar este pedido? Um pedido de remanufatura será gerado automaticamente.")) return;
    setFinalizando(true);
    try {
      const result = await finalizarMutation.mutateAsync(id);
      toast.success("Pedido finalizado com sucesso!");
      if (result && result.remanOrderId) {
        setLocation(`/reman/pedidos/${result.remanOrderId}/imprimir`);
      } else {
        pedidoQuery.refetch();
      }
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      toast.error("Erro ao finalizar o pedido. Tente novamente.");
    } finally {
      setFinalizando(false);
    }
  };

  const handleReabrirPedido = async () => {
    if (!confirm("Deseja reabrir este pedido para edição? O status voltará para 'Aberto'.")) return;
    setReabrindo(true);
    try {
      await reabrirMutation.mutateAsync(id);
      await pedidoQuery.refetch();
      await cartuchosQuery.refetch();
      toast.success("Pedido reaberto para edição!");
    } catch (error) {
      console.error("Erro ao reabrir pedido:", error);
      toast.error("Erro ao reabrir o pedido. Tente novamente.");
    } finally {
      setReabrindo(false);
    }
  };

  const handleDuplicarPedido = async () => {
    try {
      const novoPedido = await duplicarMutation.mutateAsync(id);
      toast.success(`Pedido duplicado! Novo numero: ${novoPedido.numero}`);
      setLocation(`/pedidos/${novoPedido.id}`);
    } catch (error) {
      console.error("Erro ao duplicar pedido:", error);
      toast.error("Erro ao duplicar o pedido. Tente novamente.");
    }
  };

  const handleNotificarCliente = () => {
    const pedido = pedidoQuery.data;
    const cliente = clienteQuery.data;
    if (!pedido) return;
    const telefone = cliente?.telefone || cliente?.telefone2;
    const statusTexto = pedido.status === "finalizado" ? "finalizado" : "em andamento";
    const mensagem = `Olá${cliente?.nome ? ` ${cliente.nome}` : ""}, seu pedido #${pedido.numero} está ${statusTexto}. Qualquer dúvida estamos à disposição.`;
    if (!openWhatsApp(telefone, mensagem)) {
      toast.error("Cliente não possui telefone válido para WhatsApp.");
    }
  };

  const handleRemoverCartucho = async (cartuchoId: number) => {
    if (!confirm("Deseja remover este cartucho do pedido?")) return;
    try {
      await removerMutation.mutateAsync(cartuchoId);
      cartuchosQuery.refetch();
      toast.success("Cartucho removido.");
    } catch (error) {
      console.error("Erro ao remover cartucho:", error);
      toast.error("Erro ao remover cartucho.");
    }
  };

  const handleSalvarPeso = async (cartucho: any, tipo: "chegada" | "saida") => {
    if (!pesoTemp) {
      toast.error("Digite um peso válido");
      return;
    }
    const pesoNumerico = parseFloat(pesoTemp.replace(",", "."));
    if (isNaN(pesoNumerico)) {
      toast.error("Digite um peso válido");
      return;
    }
    try {
      const pesoChegadaAtual = tipo === "chegada" ? pesoNumerico : (cartucho.pesoChegada ? parseFloat(String(cartucho.pesoChegada).replace(",", ".")) : 0);
      const pesoSaidaAtual = tipo === "saida" ? pesoNumerico : (cartucho.pesoSaida ? parseFloat(String(cartucho.pesoSaida).replace(",", ".")) : 0);
      
      await atualizarMutation.mutateAsync({
        id: cartucho.id,
        cartuchoId: cartucho.cartuchoId,
        codigo: cartucho.codigo,
        pesoChegada: pesoChegadaAtual,
        pesoSaida: pesoSaidaAtual,
        protegido: cartucho.protegido === 1,
        observacoes: cartucho.observacoes,
        status: cartucho.status,
      });
      await cartuchosQuery.refetch();
      setEditandoPeso(null);
      setPesoTemp("");
    } catch (error) {
      console.error("Erro ao atualizar peso:", error);
      toast.error("Erro ao atualizar peso. Tente novamente.");
    }
  };

  const handleAtualizarStatus = async (cartucho: any, novoStatus: "em_espera" | "em_andamento" | "processo" | "funcionando" | "circuito_queimado" | "defeito_cabeca" | "garantia") => {
    try {
      const pesoChegada = cartucho.pesoChegada ? parseFloat(String(cartucho.pesoChegada).replace(",", ".")) : 0;
      const pesoSaida = cartucho.pesoSaida ? parseFloat(String(cartucho.pesoSaida).replace(",", ".")) : 0;
      
      await atualizarMutation.mutateAsync({
        id: cartucho.id,
        cartuchoId: cartucho.cartuchoId,
        codigo: cartucho.codigo,
        pesoChegada,
        pesoSaida,
        protegido: cartucho.protegido === 1,
        observacoes: cartucho.observacoes,
        status: novoStatus,
      });
      await cartuchosQuery.refetch();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status.");
    }
  };

  if (pedidoQuery.isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!pedidoQuery.data) {
    return <div className="text-center py-8">Pedido não encontrado</div>;
  }

  const pedido = pedidoQuery.data;
  const isFinalizado = pedido.status === "finalizado";

  return (
    <div className="space-y-6 h-full overflow-y-auto overflow-x-hidden pr-4">
      <style>{`
        @media print {
          /* margin: 0 remove cabeçalho/rodapé do navegador (URL, data, título, páginas) */
          @page { size: A4; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 10mm !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden, header, footer, .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/pedidos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pedido #{pedido.numero}</h1>
            <p className="text-muted-foreground">Cliente: {pedido.clienteNome}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => window.print()} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>

          <Button
            onClick={handleNotificarCliente}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Notificar cliente
          </Button>

          <Button onClick={handleDuplicarPedido} variant="outline" disabled={duplicarMutation.isPending}>
            <Copy className="h-4 w-4 mr-2" />
            {duplicarMutation.isPending ? "Duplicando..." : "Duplicar Pedido"}
          </Button>

          {isFinalizado ? (
            /* Pedido finalizado: mostrar botão de reabrir */
            <Button
              variant="outline"
              onClick={handleReabrirPedido}
              disabled={reabrindo}
              className="border-amber-500 text-amber-600 hover:bg-amber-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {reabrindo ? "Reabrindo..." : "Reabrir Pedido"}
            </Button>
          ) : (
            /* Pedido aberto: mostrar botões de adicionar e finalizar */
            <>
              <Button onClick={() => { setCartuchoditando(null); setModalAberto(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cartucho
              </Button>
              <Button
                variant="outline"
                onClick={handleFinalizarPedido}
                disabled={finalizando}
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {finalizando ? "Finalizando..." : "Finalizar Pedido"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Banner de aviso quando finalizado */}
      {isFinalizado && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Pedido Finalizado</p>
            <p className="text-sm text-amber-700">
              Este pedido foi finalizado em {pedido.dataFinalizacao ? new Date(pedido.dataFinalizacao).toLocaleDateString("pt-BR") : "—"}.
              Para editar, clique em <strong>Reabrir Pedido</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className={`text-lg font-bold ${isFinalizado ? "text-emerald-600" : "text-blue-600"}`}>
            {isFinalizado ? "Finalizado" : "Aberto"}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Data de Criação</p>
          <p className="text-lg font-bold">{new Date(pedido.dataCriacao).toLocaleDateString("pt-BR")}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Cartuchos</p>
          <p className="text-lg font-bold">{cartuchosQuery.data?.length || 0}</p>
        </Card>
      </div>

      {/* Observação geral do pedido */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Observação geral do pedido</h2>
          {!editandoObs && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setObsTemp(pedido.observacaoGeral || "");
                setEditandoObs(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>

        {editandoObs ? (
          <div className="space-y-3">
            <Textarea
              value={obsTemp}
              onChange={(e) => setObsTemp(e.target.value)}
              placeholder="Observações gerais sobre este pedido..."
              rows={5}
              className="resize-y"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditandoObs(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSalvarObservacao} disabled={obsMutation.isPending}>
                {obsMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        ) : pedido.observacaoGeral ? (
          <p className="whitespace-pre-wrap text-sm">{pedido.observacaoGeral}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Sem observações.</p>
        )}
      </Card>

      {/* Tabela de cartuchos */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Cartuchos do Pedido</h2>
          {isFinalizado && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
              Reabra o pedido para editar
            </span>
          )}
        </div>

        {cartuchosQuery.isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : cartuchosQuery.data?.length === 0 ? (
          <p className="text-muted-foreground">Nenhum cartucho adicionado ainda.</p>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-4 py-2 text-left">Modelo</th>
                  <th className="px-4 py-2 text-left">Código</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Peso Chegada (g)</th>
                  <th className="px-4 py-2 text-left">Peso Saída (g)</th>
                  <th className="px-4 py-2 text-left">Protegido</th>
                  <th className="px-4 py-2 text-left">Observações</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cartuchosQuery.data?.map((c: any) => {
                  const isProblema = (c as any).status === "circuito_queimado" || (c as any).status === "defeito_cabeca";
                  return (
                    <tr key={c.id} className={`border-b hover:bg-muted/50 ${isProblema ? "bg-red-50" : ""}`}>
                      <td
                        className={`px-4 py-2 font-semibold ${!isFinalizado ? "cursor-pointer hover:underline" : ""}`}
                        onClick={() => { if (!isFinalizado) { setCartuchoditando(c); setModalAberto(true); } }}
                      >
                        <div className="flex flex-col">
                          <span>{c.modelo02 || "-"}</span>
                          <span className="text-xs text-muted-foreground">{c.modelo01 || ""}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 font-mono">{c.codigo || "-"}</td>
                      <td className="px-4 py-2">
                        <Select
                          value={(c as any).status || "em_espera"}
                          onValueChange={(novoStatus: any) => handleAtualizarStatus(c, novoStatus)}
                          disabled={isFinalizado}
                        >
                          <SelectTrigger className={`w-36 h-8 ${isProblema ? "text-red-600 font-bold" : ""}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s.value} value={s.value}>
                                <span className={s.value === "circuito_queimado" || s.value === "defeito_cabeca" ? "text-red-600 font-bold" : ""}>
                                  {s.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Peso Chegada */}
                      <td className="px-4 py-2">
                        {!isFinalizado && editandoPeso?.id === c.id && editandoPeso?.tipo === "chegada" ? (
                          <div className="flex gap-1">
                            <Input
                              type="text"
                              value={pesoTemp}
                              onChange={(e) => setPesoTemp(formatarPesoComVirgula(e.target.value))}
                              className="w-20 h-8"
                              autoFocus
                            />
                            <Button size="sm" variant="outline" onClick={() => handleSalvarPeso(c, "chegada")} className="h-8 px-2">✓</Button>
                            <Button size="sm" variant="outline" onClick={() => { setEditandoPeso(null); setPesoTemp(""); }} className="h-8 px-2">✕</Button>
                          </div>
                        ) : (
                          <span
                            className={!isFinalizado ? "cursor-pointer hover:underline" : ""}
                            onClick={() => {
                              if (!isFinalizado) {
                                setEditandoPeso({ id: c.id, tipo: "chegada" });
                                setPesoTemp((c.pesoChegada || 0).toString());
                              }
                            }}
                          >
                            {c.pesoChegada ? `${c.pesoChegada}g` : "-"}
                          </span>
                        )}
                      </td>

                      {/* Peso Saída */}
                      <td className="px-4 py-2">
                        {!isFinalizado && editandoPeso?.id === c.id && editandoPeso?.tipo === "saida" ? (
                          <div className="flex gap-1">
                            <Input
                              type="text"
                              value={pesoTemp}
                              onChange={(e) => setPesoTemp(formatarPesoComVirgula(e.target.value))}
                              className="w-20 h-8"
                              autoFocus
                            />
                            <Button size="sm" variant="outline" onClick={() => handleSalvarPeso(c, "saida")} className="h-8 px-2">✓</Button>
                            <Button size="sm" variant="outline" onClick={() => { setEditandoPeso(null); setPesoTemp(""); }} className="h-8 px-2">✕</Button>
                          </div>
                        ) : (
                          <span
                            className={!isFinalizado ? "cursor-pointer hover:underline" : ""}
                            onClick={() => {
                              if (!isFinalizado) {
                                setEditandoPeso({ id: c.id, tipo: "saida" });
                                setPesoTemp((c.pesoSaida || 0).toString());
                              }
                            }}
                          >
                            {c.pesoSaida ? `${c.pesoSaida}g` : "-"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-2">{c.protegido ? "Sim" : "Não"}</td>
                      <td className="px-4 py-2 max-w-xs truncate">{c.observacoes || "-"}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          {!isFinalizado && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setCartuchoditando(c); setModalAberto(true); }}
                                title="Editar cartucho"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoverCartucho(c.id)}
                                title="Remover cartucho"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalAberto && (
        <ModalCartucho
          pedidoId={id}
          cartucho={cartuchoditando}
          onSalvar={() => {
            setModalAberto(false);
            setCartuchoditando(null);
            cartuchosQuery.refetch();
          }}
          onFechar={() => {
            setModalAberto(false);
            setCartuchoditando(null);
          }}
        />
      )}
    </div>
  );
}
