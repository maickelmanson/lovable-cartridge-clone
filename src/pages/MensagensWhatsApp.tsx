import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageCircle, Save, RotateCcw, Loader2 } from "lucide-react";
import { renderTemplate, TEMPLATE_PADRAO, TEMPLATE_VARS } from "@/lib/whatsapp";
import { hasPermission } from "@/lib/guard";
import type { WhatsAppTemplate } from "@/lib/trpc-real/whatsappTemplates";

const EXEMPLO = {
  cliente: "MARIA SILVA",
  pedido: "0010",
  status: "em andamento",
  empresa: "EP SOLUÇÕES",
};

export default function MensagensWhatsApp() {
  const podeEditar = hasPermission("mensagens.editar");
  const listaQuery = trpc.whatsappTemplates.listar.useQuery();
  const salvarMutation = trpc.whatsappTemplates.salvar.useMutation({
    onSuccess: () => toast.success("Mensagem salva com sucesso!"),
    onError: (e: any) => toast.error("Erro ao salvar: " + (e?.message ?? "")),
  });

  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (!listaQuery.data) return;
    setRascunhos((prev) => {
      const next = { ...prev };
      for (const t of listaQuery.data as WhatsAppTemplate[]) if (next[t.chave] === undefined) next[t.chave] = t.corpo;
      return next;
    });
  }, [listaQuery.data]);

  const inserirVariavel = (chave: string, variavel: string) => {
    const el = refs.current[chave];
    const atual = rascunhos[chave] ?? "";
    const token = `{${variavel}}`;
    if (!el) {
      setRascunhos((p) => ({ ...p, [chave]: atual + token }));
      return;
    }
    const start = el.selectionStart ?? atual.length;
    const end = el.selectionEnd ?? atual.length;
    const novo = atual.slice(0, start) + token + atual.slice(end);
    setRascunhos((p) => ({ ...p, [chave]: novo }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  if (listaQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando mensagens...
      </div>
    );
  }

  const templates: WhatsAppTemplate[] = listaQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold">Mensagens padrão do WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Estes textos são usados pelo botão "Notificar cliente" dentro do pedido.
          </p>
        </div>
      </div>

      {!podeEditar && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Seu perfil pode visualizar, mas não alterar estas mensagens.
        </div>
      )}

      {templates.map((t) => {
        const corpo = rascunhos[t.chave] ?? t.corpo;
        const alterado = corpo !== t.corpo;
        const padrao = TEMPLATE_PADRAO[t.chave];
        return (
          <Card key={t.chave}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_VARS.map((v) => (
                  <Badge
                    key={v.nome}
                    variant="secondary"
                    className="cursor-pointer select-none"
                    onClick={() => podeEditar && inserirVariavel(t.chave, v.nome)}
                    title={v.descricao}
                  >
                    {`{${v.nome}}`}
                  </Badge>
                ))}
              </div>

              <Textarea
                ref={(el) => {
                  refs.current[t.chave] = el;
                }}
                rows={3}
                value={corpo}
                disabled={!podeEditar}
                onChange={(e) => setRascunhos((p) => ({ ...p, [t.chave]: e.target.value }))}
                className="font-mono text-sm normal-case"
              />

              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                <span className="text-xs uppercase text-muted-foreground">Pré-visualização</span>
                <p className="mt-1 whitespace-pre-wrap">{renderTemplate(corpo, EXEMPLO)}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!podeEditar || !alterado || salvarMutation.isPending}
                  onClick={() => salvarMutation.mutate({ chave: t.chave, corpo })}
                >
                  <Save className="h-4 w-4 mr-1" /> Salvar
                </Button>
                {padrao && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!podeEditar}
                    onClick={() => setRascunhos((p) => ({ ...p, [t.chave]: padrao }))}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" /> Restaurar padrão
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
