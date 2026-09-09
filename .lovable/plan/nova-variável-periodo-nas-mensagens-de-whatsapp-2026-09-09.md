# Nova variável {periodo} nas mensagens de WhatsApp

## O que muda para você

Na tela **Mensagens WhatsApp** aparece um novo botão de variável `{periodo}` junto dos atuais `{cliente}`, `{pedido}`, `{status}`, `{empresa}` e `{total}`. Na hora de notificar o cliente, o `{periodo}` é substituído automaticamente conforme o horário do envio:

- **"dia"** — das 00:00 até 11:59
- **"tarde"** — das 12:00 até 17:59
- **"noite"** — das 18:00 até 23:59 (sugestão minha; se preferir só "dia"/"tarde", a noite vira "tarde")

Exemplo: `Agradecemos pela preferência e desejamos um excelente {periodo}!` vira "...desejamos um excelente dia!" de manhã e "...desejamos um excelente tarde!" à tarde (o texto ao redor fica por sua conta na edição da mensagem).

A pré-visualização da tela de mensagens mostra um valor de exemplo ("tarde").

## Como será feito

1. `src/lib/whatsapp.ts`
   - Adicionar `{ nome: "periodo", descricao: "Período do dia conforme o horário do envio (dia/tarde/noite)" }` em `TEMPLATE_VARS`.
   - Adicionar função `periodoDoDia(data?: Date)`: retorna "dia" (hora < 12), "tarde" (12–17) ou "noite" (>= 18), usando o horário local do computador no momento do clique.

2. `src/pages/PedidoDetalhe.tsx` (`handleNotificarCliente`)
   - Passar `periodo: periodoDoDia()` no objeto de variáveis do `renderTemplate`.
   - Sem mudança visual no botão nem no fluxo de envio/registro.

3. `src/pages/MensagensWhatsApp.tsx`
   - Adicionar `periodo: "tarde"` ao objeto `EXEMPLO` da pré-visualização.

## Observações

- Nenhuma migração de banco: o período é calculado no momento do envio.
- Modelos sem `{periodo}` continuam idênticos — só muda para quem usar a variável.
- O horário considerado é o do computador de quem clica em "Notificar cliente" (fuso local).
