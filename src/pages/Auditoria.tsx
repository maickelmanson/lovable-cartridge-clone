import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/authClient";
import { can } from "@/lib/permissions";

type LogRow = {
  id: number;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
  details: unknown;
  ip_address: string | null;
  session_id: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export default function Auditoria() {
  const user = getCurrentUser();
  const autorizado = can(user?.role, "auditoria.ver");

  const [usuario, setUsuario] = useState("todos");
  const [acao, setAcao] = useState("todas");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [aberto, setAberto] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["auditoria", "listar"],
    enabled: autorizado,
    queryFn: async () => {
      const res = await apiFetch("/api/audit");
      if (!res.ok) throw new Error("Falha ao carregar auditoria");
      const payload = (await res.json()) as { logs: LogRow[] };
      return payload.logs ?? [];
    },
  });


  const logs = data ?? [];
  const usuarios = useMemo(
    () => Array.from(new Set(logs.map((l) => l.user_name || l.user_email || "—"))).sort(),
    [logs],
  );
  const acoes = useMemo(() => Array.from(new Set(logs.map((l) => l.action))).sort(), [logs]);

  const filtrados = logs.filter((l) => {
    const nome = l.user_name || l.user_email || "—";
    if (usuario !== "todos" && nome !== usuario) return false;
    if (acao !== "todas" && l.action !== acao) return false;
    const ts = new Date(l.created_at).getTime();
    if (de && ts < new Date(`${de}T00:00:00`).getTime()) return false;
    if (ate && ts > new Date(`${ate}T23:59:59`).getTime()) return false;
    return true;
  });

  if (!autorizado) {
    return (
      <div className="p-6">
        <Card className="p-8 flex flex-col items-center gap-3 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Apenas administradores e gerentes podem ver a auditoria.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">Histórico de ações realizadas no sistema</p>
      </div>

      <Card className="p-4 grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <Label>Usuário</Label>
          <Select value={usuario} onValueChange={setUsuario}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {usuarios.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Ação</Label>
          <Select value={acao} onValueChange={setAcao}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {acoes.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>De</Label>
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Até</Label>
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Data e hora</th>
                <th className="p-3">Usuário</th>
                <th className="p-3">Ação</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Registro</th>
                <th className="p-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l) => (
                <tr key={l.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap">{formatDate(l.created_at)}</td>
                  <td className="p-3">
                    <div>{l.user_name || l.user_email || "—"}</div>
                    {l.user_role ? (
                      <Badge variant="secondary" className="mt-1">{l.user_role}</Badge>
                    ) : null}
                  </td>
                  <td className="p-3 whitespace-nowrap">{l.action}</td>
                  <td className="p-3">{l.entity_type ?? "—"}</td>
                  <td className="p-3">{l.entity_label ?? l.entity_id ?? "—"}</td>
                  <td className="p-3 max-w-md">
                    {l.details ? (
                      <button
                        type="button"
                        className="underline text-xs"
                        onClick={() => setAberto(aberto === l.id ? null : l.id)}
                      >
                        {aberto === l.id ? "ocultar" : "ver"}
                      </button>
                    ) : (
                      "—"
                    )}
                    {aberto === l.id ? (
                      <pre className="mt-2 whitespace-pre-wrap break-all text-xs bg-muted p-2 rounded">
                        {JSON.stringify(l.details, null, 2)}
                      </pre>
                    ) : null}
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
