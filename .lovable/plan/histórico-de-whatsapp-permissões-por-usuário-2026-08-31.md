# Histórico de WhatsApp + Permissões por usuário

Duas entregas: uma tela para acompanhar as mensagens de WhatsApp enviadas e um painel de permissões com caixas de marcação por usuário.

## 1. Tela "Mensagens enviadas" (histórico)

Hoje o botão "Notificar cliente" apenas abre o WhatsApp pelo link wa.me — nada é gravado. A tabela `notifications` já existe no banco, mas não é usada por nenhuma tela.

O que muda:

- Ao clicar em "Notificar cliente" (detalhe do pedido), além de abrir o WhatsApp, o sistema grava um registro com: data/hora, cliente, pedido, telefone de destino, texto final da mensagem e status.
- Status: "enviada" quando o link foi aberto com sucesso e "falha" quando o cliente não tem telefone válido.
- Nova tela **Mensagens enviadas** no menu lateral, com tabela ordenada da mais recente para a mais antiga: Data · Destinatário (nome + telefone) · Pedido · Texto · Status.
- Filtros simples: busca por cliente/telefone/texto, filtro por status e por período; botão para reenviar (abre o WhatsApp de novo com o mesmo texto) e paginação.
- A tela de configuração de modelos (`/mensagens`) continua como está; o histórico fica em rota própria.

## 2. Permissões por usuário (caixas de marcação)

Hoje as permissões são fixas por papel (admin/gerente/vendedor/técnico) num arquivo de código. Passa a existir uma personalização por usuário.

O que muda:

- Na tela de Usuários, ao editar um usuário, aparece um bloco **Permissões** com caixas de marcação agrupadas por área:
  - Pedidos: criar, editar, finalizar, reabrir, excluir
  - Cartuchos: alterar status, editar
  - Clientes: criar, editar, excluir
  - Modelos: gerenciar
  - Empresa: editar dados
  - Remanufatura: finalizar
  - Administração: gerenciar usuários, ver auditoria, editar mensagens do WhatsApp, ver histórico de mensagens
- Ao escolher o papel, as caixas já vêm marcadas conforme o padrão daquele papel; o admin pode marcar/desmarcar individualmente.
- Botão "Restaurar padrão do papel" para voltar ao conjunto original.
- Admin continua com acesso total e não pode remover a própria permissão de gerenciar usuários (evita travar o sistema).
- As permissões marcadas passam a valer em todo o sistema: menus escondidos, botões desabilitados e bloqueio no servidor nas rotas administrativas.
- Toda alteração de permissões é registrada na auditoria (antes/depois).

## Detalhes técnicos

- **Banco (migração):**
  - `notifications`: já existe com `cliente_id`, `pedido_id`, `channel`, `destination`, `message`, `status`, `error`. Reaproveitar; adicionar índice em `created_at` e permitir gravação pelo proxy (`notifications` já está em `ALLOWED_TABLES`).
  - `users`: nova coluna `permissions jsonb` (nulo = herdar do papel).
- **Permissões:** estender `src/lib/permissions.ts` com `mensagens.ver` e uma função `resolvePermissions(role, overrides)`. `SessionUser`/`publicUser` em `src/auth.server.ts` passam a expor `permissions`; `can()` usa o override quando existir. `requireAdmin` continua exigindo papel admin para rotas de usuário/auditoria.
- **API:** `PUT /api/auth/users/:id` e `POST /api/auth/users` aceitam `permissions`, validando contra a lista conhecida.
- **Driver de dados:** novo `src/lib/trpc-real/notificacoes.ts` (`listar` com filtros/paginação, `registrar`), plugado no proxy híbrido de `src/lib/trpc.ts`.
- **Telas:** nova `src/pages/MensagensEnviadas.tsx` + rota `/mensagens/enviadas` em `src/App.tsx` e item no menu de `DashboardLayout.tsx`; ajuste em `src/pages/PedidoDetalhe.tsx` para gravar a notificação; bloco de permissões em `src/pages/Usuarios.tsx`.
