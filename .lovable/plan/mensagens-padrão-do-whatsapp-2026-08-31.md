# Mensagens padrão do WhatsApp

## O que entendi

Hoje o botão "Notificar cliente" (na tela de detalhe do pedido) monta uma mensagem fixa no código:

```text
Olá {NOME}, seu pedido #{NUMERO} está em andamento. Qualquer dúvida estamos à disposição.
```

Você quer uma nova tela no dashboard para editar essas mensagens padrão. O botão continua exatamente igual (mesmo lugar, mesmo comportamento, abre o WhatsApp com o texto já pronto) — só que o texto passa a vir do que foi salvo no painel.

## Como ficará

### Nova tela: "Mensagens WhatsApp" (menu lateral, rota `/mensagens`)

- Um modelo por situação:
  - Pedido em andamento
  - Pedido finalizado
  - (opcional) Mensagem livre/genérica
- Cada modelo tem um campo de texto grande, com **variáveis** que são substituídas na hora de enviar:
  - `{cliente}` — nome do cliente
  - `{pedido}` — número do pedido
  - `{status}` — status por extenso
  - `{empresa}` — nome da empresa cadastrada
- Chips clicáveis para inserir a variável no cursor.
- **Pré-visualização ao vivo** com dados de exemplo, mostrando o texto final.
- Botões "Salvar" e "Restaurar padrão".
- Acesso restrito a admin/gerente (mesma lógica de permissão já usada em Usuários).

### Botão "Notificar cliente"

Sem mudança visual nenhuma. Ao clicar, o sistema:
1. Busca o modelo salvo conforme o status do pedido;
2. Substitui as variáveis;
3. Abre o `wa.me` como já faz hoje.

Se nenhum modelo estiver salvo, usa o texto padrão atual (nada quebra).

## Detalhes técnicos

- Migração: tabela `public.whatsapp_templates` (`id`, `chave` único, `titulo`, `corpo`, `updated_at`), com `GRANT` para `authenticated`/`service_role` + RLS compartilhada no mesmo padrão das demais tabelas; seed com os textos atuais como padrão.
- Driver `src/lib/trpc-real/whatsappTemplates.ts` com `listar` e `salvar`, registrado no proxy híbrido de `src/lib/trpc.ts`, gravando log de auditoria no save (mesmo padrão das outras mutations).
- `src/lib/whatsapp.ts`: adicionar `renderTemplate(corpo, vars)` para substituir os placeholders.
- Nova página `src/pages/MensagensWhatsApp.tsx`, rota em `src/App.tsx` e item de menu em `src/components/DashboardLayout.tsx`.
- `src/pages/PedidoDetalhe.tsx`: `handleNotificarCliente` passa a ler o template (query) e renderizar as variáveis; fallback para o texto atual.
