# Nova variável {total} nas mensagens de WhatsApp

## O que muda para você

Na tela **Mensagens WhatsApp** (`/mensagens`) aparece um novo botão de variável `{total}` junto dos atuais `{cliente}`, `{pedido}`, `{status}` e `{empresa}`. Ao clicar, ele insere `{total}` no texto. Na hora de notificar o cliente pelo botão "Notificar cliente" no pedido, o `{total}` é substituído automaticamente pelo valor total da remanufatura vinculada ao pedido, formatado em reais (ex.: `R$ 90,00`). Se o pedido ainda não tiver valor, a variável sai vazia (sem texto quebrado). A pré-visualização da tela de mensagens passa a mostrar um valor de exemplo.

## Como será feito

1. `src/lib/whatsapp.ts`
   - Adicionar `{ nome: "total", descricao: "Valor total do pedido (ex.: R$ 90,00)" }` em `TEMPLATE_VARS`.
   - Os textos padrão de fábrica não mudam (quem quiser usa o botão `{total}` para inserir).

2. `src/pages/PedidoDetalhe.tsx` (`handleNotificarCliente`)
   - Antes de montar a mensagem, buscar a ordem de remanufatura vinculada ao pedido (`reman_orders` filtrando por `pedido_id`, mais recente) e ler o campo `total`.
   - Formatar com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
   - Passar `total` no objeto de variáveis do `renderTemplate` (string vazia quando não houver valor).
   - Sem mudança visual no botão nem no fluxo de envio/registro da notificação.

3. `src/pages/MensagensWhatsApp.tsx`
   - Adicionar `total: "R$ 90,00"` ao objeto `EXEMPLO` usado na pré-visualização, para o usuário ver o valor substituído ao testar.

## Observações

- Nenhuma migração de banco: o valor já existe em `reman_orders.total`.
- A consulta usa o cliente já existente (`@/lib/db`), mesma tabela já acessada pelo app — sem novas permissões.
- Nada muda para quem não usar a variável: modelos sem `{total}` continuam idênticos.
