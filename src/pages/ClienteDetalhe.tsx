import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Edit } from "lucide-react";
import ModalCliente from "@/components/ModalCliente";
import ModalNovoPedido from "@/components/ModalNovoPedido";

interface Props {
  params: { id: string };
}

export default function ClienteDetalhe({ params }: Props) {
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const [modalEditando, setModalEditando] = useState(false);
  const [modalNovoPedidoAberto, setModalNovoPedidoAberto] = useState(false);

  const clienteQuery = trpc.clientes.buscar.useQuery(id);
  const pedidosQuery = trpc.pedidos.porCliente.useQuery(id);
  const criarPedidoMutation = trpc.pedidos.criar.useMutation();
  const atualizarMutation = trpc.clientes.atualizar.useMutation();

  const handleNovoPedido = () => {
    setModalNovoPedidoAberto(true);
  };

  const handleSalvarPedido = async (clienteId: number, cartuchos?: any[]) => {
    try {
      const pedido = await criarPedidoMutation.mutateAsync({ clienteId, cartuchos });
      setModalNovoPedidoAberto(false);
      // Navegar para o pedido criado
      if (pedido && pedido.id) {
        setLocation(`/pedidos/${pedido.id}`);
      } else {
        pedidosQuery.refetch();
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      alert("Erro ao criar pedido: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    }
  };

  const handleSalvarCliente = async (data: any) => {
    try {
      await atualizarMutation.mutateAsync({ ...data, id });
      setModalEditando(false);
      clienteQuery.refetch();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  if (clienteQuery.isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!clienteQuery.data) {
    return <div className="text-center py-8">Cliente não encontrado</div>;
  }

  const cliente = clienteQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/clientes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold break-words">{cliente.nome}</h1>
            <p className="text-muted-foreground">Cliente desde {new Date(cliente.criadoEm).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModalEditando(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button onClick={handleNovoPedido}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Dados Pessoais</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Nome</p>
              <p>{cliente.nome}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <p>{cliente.telefone || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Perfil Comercial</p>
              <span className={`text-xs px-2 py-1 rounded ${
                (cliente as any).commercialProfile === "REVENDA"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {(cliente as any).commercialProfile === "REVENDA" ? "Revenda" : "Cliente Final"}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground">Endereço</p>
              <p>{cliente.endereco || "-"}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Dados Fiscais</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">CPF</p>
              <p className="font-mono">{cliente.cpf || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CNPJ</p>
              <p className="font-mono">{cliente.cnpj || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Inscrição Estadual</p>
              <p>{cliente.inscricaoEstadual || "-"}</p>
            </div>
          </div>
        </Card>

        {cliente.observacoes && (
          <Card className="col-span-2 p-6">
            <h3 className="font-semibold mb-4">Observações</h3>
            <p className="text-sm whitespace-pre-wrap">{cliente.observacoes}</p>
          </Card>
        )}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Pedidos ({pedidosQuery.data?.length || 0})</h2>
        {pedidosQuery.isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : pedidosQuery.data?.length === 0 ? (
          <p className="text-muted-foreground">Nenhum pedido para este cliente ainda.</p>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-4 py-2 text-left">Nº Pedido</th>
                  <th className="px-4 py-2 text-left">Data de Criação</th>
                  <th className="px-4 py-2 text-left">Data de Finalização</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {pedidosQuery.data?.map((p: any) => (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => setLocation(`/pedidos/${p.id}`)}
                  >
                    <td className="px-4 py-2 font-mono font-bold">#{p.numero}</td>
                    <td className="px-4 py-2">{new Date(p.dataCriacao).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{p.dataFinalizacao ? new Date(p.dataFinalizacao).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-1 rounded ${p.status === "finalizado" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                        {p.status === "finalizado" ? "Finalizado" : "Aberto"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalEditando && (
        <ModalCliente
          cliente={cliente}
          onSalvar={handleSalvarCliente}
          onFechar={() => setModalEditando(false)}
        />
      )}

      {modalNovoPedidoAberto && (
        <ModalNovoPedido
          onSalvar={(clienteId, cartuchos) => handleSalvarPedido(clienteId || id, cartuchos)}
          onFechar={() => setModalNovoPedidoAberto(false)}
        />
      )}
    </div>
  );
}
