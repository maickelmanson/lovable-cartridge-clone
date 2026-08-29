import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingBag, Users, Package, Search, Download, Loader2, Database, FileCode, Upload } from "lucide-react";
import { getToken, getCurrentUser } from "@/lib/authClient";
import { toast } from "sonner";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [tipoBusca, setTipoBusca] = useState("geral");
  const [termoBusca, setTermoBusca] = useState("");
  const [resultados, setResultados] = useState<any>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = getCurrentUser()?.role === "admin";

  const pedidosQuery = trpc.pedidos.listar.useQuery();
  const clientesQuery = trpc.clientes.listar.useQuery();
  const cartuchosQuery = trpc.cartuchos.listar.useQuery();
  const buscaQuery = trpc.busca.avancada.useQuery(
    { tipo: tipoBusca as any, termo: termoBusca },
    { enabled: termoBusca.length > 0 }
  );

  const handleBusca = () => {
    if (termoBusca.trim()) {
      setResultados(buscaQuery.data);
    }
  };

  const baixarArquivo = (blob: Blob, nome: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleBackup = async (tipo: "database" | "code") => {
    try {
      setBackupLoading(true);
      const res = await fetch(`/api/backup/${tipo}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      });
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        throw new Error(info.error || "Falha ao gerar o backup.");
      }
      const blob = await res.blob();
      const data = new Date().toISOString().split("T")[0];
      baixarArquivo(blob, tipo === "database" ? `database-backup-${data}.sql` : `codigo-fonte-${data}.zip`);
      toast.success("Backup gerado com sucesso.");
    } catch (error: any) {
      toast.error(error?.message ?? "Erro ao gerar backup.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    try {
      setRestoring(true);
      const form = new FormData();
      form.append("file", restoreFile);
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
        body: form,
      });
      const info = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(info.error || "Falha ao restaurar o banco.");
      toast.success("Banco restaurado. Recarregando...");
      setTimeout(() => window.location.reload(), 1200);
    } catch (error: any) {
      toast.error(error?.message ?? "Erro ao restaurar.");
      setRestoring(false);
    }
  };

  const stats = [
    {
      label: "Total de Pedidos",
      value: pedidosQuery.data?.length || 0,
      icon: ShoppingBag,
      color: "bg-blue-500",
      path: "/pedidos",
    },
    {
      label: "Clientes",
      value: clientesQuery.data?.length || 0,
      icon: Users,
      color: "bg-emerald-500",
      path: "/clientes",
    },
    {
      label: "Modelos Cadastrados",
      value: cartuchosQuery.data?.length || 0,
      icon: Package,
      color: "bg-purple-500",
      path: "/cartuchos",
    },
  ];

  return (
    <div className="space-y-6 h-full overflow-y-auto overflow-x-hidden pr-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de cartuchos</p>
        </div>
        <Button
          onClick={handleBackup}
          disabled={backupLoading}
          className="gap-2"
          variant="outline"
        >
          {backupLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Backup do Banco
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, path }) => (
          <Card 
            key={label} 
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation(path)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-bold">{value}</p>
              </div>
              <Icon className={`${color} text-white p-3 rounded-lg h-12 w-12`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Busca */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Busca Avançada
        </h2>

        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Select value={tipoBusca} onValueChange={setTipoBusca}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                <SelectItem value="codigo">Código</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="telefone">Telefone</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="pedido">Pedido</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Digite o termo de busca..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleBusca()}
              className="flex-1 min-w-[200px]"
            />

            <Button onClick={handleBusca} disabled={!termoBusca.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>

            {termoBusca && (
              <Button variant="outline" onClick={() => { setTermoBusca(""); setResultados(null); }}>
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Resultados */}
        {resultados && (
          <div className="mt-6 space-y-4">
            {resultados.pedidos?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Pedidos ({resultados.pedidos.length})</h3>
                <div className="space-y-2">
                  {resultados.pedidos.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3 border rounded cursor-pointer hover:bg-accent"
                      onClick={() => setLocation(`/pedidos/${p.id}`)}
                    >
                      <div className="flex justify-between">
                        <span className="font-mono font-bold">#{p.numero}</span>
                        <span>{p.clienteNome}</span>
                        <span className="text-sm text-muted-foreground">{new Date(p.dataCriacao).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultados.cartuchos?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Cartuchos ({resultados.cartuchos.length})</h3>
                <div className="space-y-2">
                  {resultados.cartuchos.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3 border rounded cursor-pointer hover:bg-accent"
                      onClick={() => setLocation(`/pedidos/${c.pedidoId}`)}
                    >
                      <div className="flex justify-between items-center gap-4">
                        <span className="font-mono font-bold">{c.codigo}</span>
                        <span>{c.modelo02}</span>
                        <span>{c.clienteNome}</span>
                        <span className="text-sm text-muted-foreground">Pedido #{c.pedidoNumero}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultados.pedidos?.length === 0 && resultados.cartuchos?.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Nenhum resultado encontrado.</p>
            )}
          </div>
        )}
      </Card>

      {/* Pedidos Recentes */}
      {!termoBusca && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Pedidos Recentes</h2>
          {pedidosQuery.isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : pedidosQuery.data?.length === 0 ? (
            <p className="text-muted-foreground">Nenhum pedido cadastrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {pedidosQuery.data?.slice(0, 10).map((p: any) => (
                <div
                  key={p.id}
                  className="p-3 border rounded cursor-pointer hover:bg-accent flex justify-between items-center"
                  onClick={() => setLocation(`/pedidos/${p.id}`)}
                >
                  <span className="font-mono font-bold">#{p.numero}</span>
                  <span>{p.clienteNome}</span>
                  <span className="text-sm text-muted-foreground">{new Date(p.dataCriacao).toLocaleDateString()}</span>
                  <span className={`text-xs px-2 py-1 rounded ${p.status === "finalizado" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                    {p.status === "finalizado" ? "Finalizado" : "Aberto"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
