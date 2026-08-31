import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { hasPermission } from "@/lib/guard";
import { openWhatsApp } from "@/lib/whatsapp";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageCircle, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const POR_PAGINA = 25;

function formatarData(valor: string | null | undefined) {
  return valor ? new Date(valor).toLocaleString("pt-BR") : "—";
}

export default function MensagensEnviadas() {
  const autorizado = hasPermission("mensagens.ver");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtros = useMemo(
    () => ({ busca, status, de, ate, pagina, porPagina: POR_PAGINA }),
    [busca, status, de, ate, pagina],
  );

  const query = trpc.notificacoes.listar.useQuery(filtros, { enabled: autorizado });
  const itens = query.data?.itens ?? [];
  const total = query.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  if (!autorizado) {
    return (
      <div className="p-6">
        <Card className="p-8 flex flex-col items-center gap-3 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Seu perfil não tem permissão para ver o histórico de mensagens.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mensagens enviadas</h1>
          <p className="text-sm text-muted-foreground">
            Histórico das notificações enviadas pelo WhatsApp
          </p>
        </div>
      </div>

      <Card className="p-4 grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <Label>Buscar</Label>
          <Input
            placeholder="Cliente, telefone ou texto"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPagina(1);
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
              <SelectItem value="falha">Falha</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>De</Label>
          <Input type="date" value={de} onChange={(e) => { setDe(e.target.value); setPagina(1); }} />
        </div>
        <div className="space-y-1">
          <Label>Até</Label>
          <Input type="date" value={ate} onChange={(e) => { setAte(e.target.value); setPagina(1); }} />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {query.isLoading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 whitespace-nowrap">Data</th>
                <th className="p-3">Destinatário</th>
                <th className="p-3">Pedido</th>
                <th className="p-3">Texto</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((n: any) => (
                <tr key={n.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap">{formatarData(n.criadoEm)}</td>
                  <td className="p-3">
                    <div className="font-medium">{n.clienteNome ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{n.destino}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">{n.pedidoNumero ?? "—"}</td>
                  <td className="p-3 max-w-md whitespace-pre-wrap break-words">{n.mensagem}</td>
                  <td className="p-3">
                    <Badge variant={n.status === "enviada" ? "default" : "destructive"}>
                      {n.status === "enviada" ? "Enviada" : n.status === "falha" ? "Falha" : n.status}
                    </Badge>
                    {n.erro ? (
                      <div className="text-xs text-muted-foreground mt-1">{n.erro}</div>
                    ) : null}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!openWhatsApp(n.destino, n.mensagem)) {
                          toast.error("Telefone inválido para WhatsApp.");
                        }
                      }}
                    >
                      <Send className="h-4 w-4 mr-1" /> Reenviar
                    </Button>
                  </td>
                </tr>
              ))}
              {itens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhuma mensagem registrada
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} mensagem(ns)</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span>
            {pagina} / {totalPaginas}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
