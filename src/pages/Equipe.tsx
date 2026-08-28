import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEquipe, usePerfilAtual, type AppRole } from "@/lib/perfil";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ROLES: AppRole[] = ["admin", "gerente", "vendedor", "tecnico", "user"];

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  vendedor: "Vendedor",
  tecnico: "Técnico",
  user: "Usuário",
};

type AuditRow = {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  user_id: string | null;
};

export default function Equipe() {
  const perfil = usePerfilAtual();
  const equipe = useEquipe();
  const isAdmin = perfil.data?.role === "admin";
  const [logs, setLogs] = useState<AuditRow[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setLogs((data ?? []) as AuditRow[]));
  }, [isAdmin]);

  const atualizar = async (id: string, patch: { role?: AppRole; active?: boolean }) => {
    const { error } = await supabase.from("profiles").update(patch as any).eq("id", id);
    if (error) {
      toast.error("Não foi possível salvar: " + error.message);
      return;
    }
    if (patch.role) {
      await supabase.from("user_roles").insert({ user_id: id, role: patch.role } as any);
    }
    toast.success("Perfil atualizado");
    equipe.refetch();
  };

  if (perfil.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-4">
      <div>
        <h1 className="text-3xl font-bold">Equipe e Auditoria</h1>
        <p className="text-muted-foreground">
          {equipe.data?.length ?? 0} usuário(s) com acesso ao sistema
        </p>
      </div>

      <Card className="p-4 space-y-3">
        {equipe.data?.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center gap-3 justify-between border-b last:border-b-0 pb-3 last:pb-0"
          >
            <div className="min-w-52">
              <div className="font-medium flex items-center gap-2">
                {u.name || u.email}
                {u.role === "admin" && <ShieldCheck className="h-4 w-4 text-primary" />}
              </div>
              <div className="text-xs text-muted-foreground lowercase">{u.email}</div>
              <div className="text-xs text-muted-foreground">
                Último acesso: {u.lastLogin ? new Date(u.lastLogin).toLocaleString("pt-BR") : "-"}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select
                value={u.role}
                disabled={!isAdmin}
                onValueChange={(v) => atualizar(u.id, { role: v as AppRole })}
              >
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 text-sm">
                <Switch
                  checked={u.active}
                  disabled={!isAdmin}
                  onCheckedChange={(v) => atualizar(u.id, { active: v })}
                />
                {u.active ? "Ativo" : "Inativo"}
              </div>
            </div>
          </div>
        ))}
      </Card>

      {isAdmin ? (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Histórico de auditoria</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
          ) : (
            <div className="space-y-1 text-sm">
              {logs.map((l) => (
                <div key={l.id} className="flex justify-between gap-3 border-b py-1 last:border-b-0">
                  <span className="font-medium">{l.action}</span>
                  <span className="text-muted-foreground">
                    {l.entity_type ?? ""} {l.entity_id ?? ""}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(l.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Somente administradores podem alterar papéis e ver o histórico de auditoria.
        </p>
      )}
    </div>
  );
}
