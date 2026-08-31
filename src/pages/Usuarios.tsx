import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getCurrentUser, logout, type SessionUser } from "@/lib/authClient";
import { can, type AppRole } from "@/lib/permissions";
import { registrarAuditoria } from "@/lib/audit";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldAlert, UserPlus } from "lucide-react";
import { toast } from "sonner";

const ROLES: AppRole[] = ["admin", "gerente", "vendedor", "tecnico"];

type FormState = {
  id: string | null;
  name: string;
  email: string;
  password: string;
  role: AppRole;
  active: boolean;
};

const EMPTY: FormState = {
  id: null,
  name: "",
  email: "",
  password: "",
  role: "vendedor",
  active: true,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarForm(values: FormState): string | null {
  if (!values.name.trim()) return "Informe o nome do usuário";
  if (!EMAIL_RE.test(values.email.trim())) return "Informe um e-mail válido";
  if (!values.id && values.password.length < 6) {
    return "A senha precisa ter ao menos 6 caracteres";
  }
  if (values.id && values.password && values.password.length < 6) {
    return "A nova senha precisa ter ao menos 6 caracteres";
  }
  return null;
}

function formatarData(valor: string | null | undefined) {
  return valor ? new Date(valor).toLocaleString("pt-BR") : "—";
}

export default function Usuarios() {
  const atual = getCurrentUser();
  const autorizado = can(atual?.role, "usuarios.gerenciar");
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["usuarios", "listar"],
    enabled: autorizado,
    queryFn: async () => {
      const res = await apiFetch("/api/auth/users");
      const json = (await res.json()) as { users?: SessionUser[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Falha ao carregar usuários");
      return json.users ?? [];
    },
  });

  const salvar = useMutation({
    mutationFn: async (values: FormState) => {
      const body: Record<string, unknown> = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role,
        active: values.active,
      };
      if (values.password) body["password"] = values.password;
      const res = await apiFetch(values.id ? `/api/auth/users/${values.id}` : "/api/auth/users", {
        method: values.id ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        user?: SessionUser;
        passwordChanged?: boolean;
        error?: string;
      };
      if (!res.ok || !json.user) {
        const motivo = json.error ?? `Falha ao salvar usuário (HTTP ${res.status})`;
        await registrarAuditoria({
          action: values.id ? "usuario.alterar_falha" : "usuario.criar_falha",
          entityType: "users",
          entityId: values.id,
          entityLabel: values.email,
          details: { motivo, status: res.status },
        });
        throw new Error(motivo);
      }
      await registrarAuditoria({
        action: values.id ? "usuario.alterar" : "usuario.criar",
        entityType: "users",
        entityId: json.user.id,
        entityLabel: values.email,
        details: {
          depois: { name: values.name, email: values.email, role: values.role, active: values.active },
        },
      });
      if (values.password) {
        await registrarAuditoria({
          action: "usuario.senha_alterada",
          entityType: "users",
          entityId: json.user.id,
          entityLabel: values.email,
        });
      }
      return { user: json.user, senhaAlterada: Boolean(values.password), editou: Boolean(values.id) };
    },
    onSuccess: async ({ user, senhaAlterada, editou }) => {
      setForm(null);
      setErroForm(null);
      await qc.invalidateQueries({ queryKey: ["usuarios"] });
      const partes = [editou ? "Usuário atualizado" : "Usuário criado"];
      if (senhaAlterada) partes.push("senha redefinida");
      toast.success(`${partes.join(" · ")} — ${user.email}`);
      if (senhaAlterada && user.id === atual?.id) {
        toast.info("Sua senha mudou: entre novamente com a nova senha.");
        setTimeout(() => logout(), 1500);
      }
    },
    onError: (err: Error) => {
      setErroForm(err.message);
      toast.error(err.message);
    },
  });

  const desativar = useMutation({
    mutationFn: async (u: SessionUser) => {
      const res = await apiFetch(`/api/auth/users/${u.id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Falha ao desativar");
      await registrarAuditoria({
        action: "usuario.desativar",
        entityType: "users",
        entityId: u.id,
        entityLabel: u.email,
      });
    },
    onSuccess: () => {
      toast.success("Usuário desativado");
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!autorizado) {
    return (
      <div className="p-6">
        <Card className="p-8 flex flex-col items-center gap-3 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Apenas administradores podem gerenciar usuários.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gestão de acessos e permissões</p>
        </div>
        <Button onClick={() => setForm({ ...EMPTY })}>
          <UserPlus className="h-4 w-4 mr-2" /> Novo usuário
        </Button>
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Papel</th>
                <th className="p-3">Status</th>
                <th className="p-3">Último login</th>
                <th className="p-3">Atualizado em</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 lowercase">{u.email}</td>
                  <td className="p-3"><Badge variant="secondary">{u.role}</Badge></td>
                  <td className="p-3">
                    <Badge variant={u.active ? "default" : "outline"}>
                      {u.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="p-3">{formatarData(u.lastLogin)}</td>
                  <td className="p-3">
                    {formatarData(u.updatedAt)}
                    {u.passwordChangedAt ? (
                      <div className="text-xs text-muted-foreground">
                        senha: {formatarData(u.passwordChangedAt)}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          id: u.id,
                          name: u.name,
                          email: u.email,
                          password: "",
                          role: u.role,
                          active: u.active,
                        })
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!u.active || u.id === atual?.id || desativar.isPending}
                      onClick={() => desativar.mutate(u)}
                    >
                      Desativar
                    </Button>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={form !== null} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  style={{ textTransform: "none" }}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>{form.id ? "Nova senha (opcional)" : "Senha"}</Label>
                <Input
                  type="password"
                  style={{ textTransform: "none" }}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Papel</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.active ? "ativo" : "inativo"}
                  onValueChange={(v) => setForm({ ...form, active: v === "ativo" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button>
            <Button disabled={salvar.isPending} onClick={() => form && salvar.mutate(form)}>
              {salvar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
