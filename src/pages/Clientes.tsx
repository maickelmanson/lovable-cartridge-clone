import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, ExternalLink } from "lucide-react";
import ModalCliente from "@/components/ModalCliente";

export default function Clientes() {
  const [, setLocation] = useLocation();
  const [filtro, setFiltro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<any>(null);

  const clientesQuery = trpc.clientes.listar.useQuery();
  const criarMutation = trpc.clientes.criar.useMutation();
  const atualizarMutation = trpc.clientes.atualizar.useMutation();
  const deletarMutation = trpc.clientes.deletar.useMutation();

  const clientesFiltrados = clientesQuery.data?.filter((c: any) =>
    c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    (c.telefone || "").includes(filtro) ||
    (c.cpf || "").includes(filtro) ||
    (c.cnpj || "").includes(filtro)
  ) || [];

  const handleSalvar = async (data: any) => {
    try {
      if (clienteEditando) {
        await atualizarMutation.mutateAsync({ ...data, id: clienteEditando.id });
      } else {
        await criarMutation.mutateAsync(data);
      }
      setModalAberto(false);
      setClienteEditando(null);
      clientesQuery.refetch();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const handleDeletar = async (id: number, nome: string) => {
    if (!confirm(`Deseja excluir o cliente "${nome}"?`)) return;
    try {
      await deletarMutation.mutateAsync(id);
      clientesQuery.refetch();
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">{clientesQuery.data?.length || 0} cliente(s) cadastrado(s)</p>
        </div>
        <Button onClick={() => { setClienteEditando(null); setModalAberto(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Filtrar por nome, telefone, CPF ou CNPJ..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted">
                <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Telefone</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Perfil</th>
                <th className="px-4 py-3 text-left text-sm font-medium">CPF / CNPJ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Endereço</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Cadastro</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {filtro ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((c: any) => (
                  <tr 
                    key={c.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => setLocation(`/clientes/${c.id}`)}
                  >
                    <td className="px-4 py-3">{c.nome}</td>
                    <td className="px-4 py-3 text-sm">{c.telefone || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        (c as any).commercialProfile === "REVENDA"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {(c as any).commercialProfile === "REVENDA" ? "Revenda" : "Cliente Final"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{c.cpf || c.cnpj || "-"}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{c.endereco || "-"}</td>
                    <td className="px-4 py-3 text-sm">{new Date(c.criadoEm).toLocaleDateString()}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/clientes/${c.id}`)}
                          title="Abrir detalhe"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setClienteEditando(c); setModalAberto(true); }}
                          title="Editar cliente"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletar(c.id, c.nome)}
                          title="Deletar cliente"
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
        <ModalCliente
          cliente={clienteEditando}
          onSalvar={handleSalvar}
          onFechar={() => { setModalAberto(false); setClienteEditando(null); }}
        />
      )}
    </div>
  );
}
