<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md — Guia completo do projeto

Sistema de gestão de remanufatura de cartuchos (EP Soluções). Este arquivo é a
referência para qualquer IA ou pessoa desenvolvedora que abrir o repositório.

## 1. Stack tecnológica

| Camada | Tecnologia |
| --- | --- |
| UI | React 19 + TypeScript |
| Build/SSR | TanStack Start v1 sobre Vite (runtime edge/Cloudflare Workers) |
| Rotas | TanStack Router (roteamento por arquivos em `src/routes`) |
| Dados | TanStack Query + camada tipo tRPC própria (`src/lib/trpc.ts` → `src/lib/trpc-real/*`) |
| Estilo | Tailwind CSS v4 (`src/styles.css`) + shadcn/ui + Radix + lucide-react |
| Banco/Auth | Supabase (projeto `ejwvxdqkxrcywehtesyo`, `https://ejwvxdqkxrcywehtesyo.supabase.co`) |
| Login | Próprio: bcryptjs + JWT (`jose`), token no `localStorage` |
| Extras | recharts, framer-motion, html2pdf.js, sonner, react-hook-form + zod |

Observações importantes:

- `wouter` e `@trpc/*` constam no `package.json`, mas **o roteamento efetivo é
  TanStack Router** e a camada de dados é um proxy próprio que imita a API do
  tRPC (`api.clientes.listar.useQuery()` etc.). Não introduza `react-router-dom`.
- As páginas ficam em `src/pages` e são montadas pelo catch-all
  `src/routes/$.tsx` + `src/App.tsx`; os endpoints HTTP ficam em `src/routes/api`.

## 2. Páginas (`src/pages`)

| Arquivo | Descrição |
| --- | --- |
| `Home.tsx` | Página inicial/redirecionamento pós-login. |
| `Login.tsx` | Tela de login do sistema próprio (e-mail + senha). |
| `AuthPage.tsx` | Tela auxiliar de autenticação (fluxo Supabase legado). |
| `Dashboard.tsx` | Painel principal com indicadores do dia. |
| `DashboardAnalise.tsx` | Análises e gráficos consolidados (recharts). |
| `Clientes.tsx` | Lista, busca e criação de clientes. |
| `ClienteDetalhe.tsx` | Ficha do cliente com histórico de pedidos. |
| `Pedidos.tsx` | Lista de pedidos, filtros, exclusão (em cascata com remanufatura). |
| `PedidoDetalhe.tsx` | Pedido aberto: cartuchos, pesos, status, observação geral, WhatsApp. |
| `RemanPedidos.tsx` | Lista de ordens de remanufatura. |
| `RemanPedidoDetalhe.tsx` | Itens/unidades da ordem, preços, garantia, finalização. |
| `RemanPedidoImpressao.tsx` | Impressão em A4 paisagem com duas vias. |
| `ModeloCartucho.tsx` | Cadastro de modelos de cartucho e preços por perfil. |
| `BuscadorCartuchos.tsx` | Busca de compatibilidade de cartuchos. |
| `TestBuscadorCartuchos.tsx` | Página de teste do buscador. |
| `BuscaAvancada.tsx` | Busca global (clientes, pedidos, cartuchos) com normalização fuzzy. |
| `DadosEmpresa.tsx` | Dados da empresa usados nos cabeçalhos de impressão. |
| `Usuarios.tsx` | CRUD de usuários, papéis e permissões por caixas de marcação. |
| `Equipe.tsx` | Visão da equipe/perfis. |
| `Auditoria.tsx` | Consulta dos registros de auditoria. |
| `MensagensWhatsApp.tsx` | Edição dos modelos de mensagem com variáveis `{cliente}`, `{pedido}`. |
| `MensagensEnviadas.tsx` | Histórico de notificações enviadas (data, destino, status, reenvio). |
| `PainelErros.tsx` | Painel de erros capturados (`error_logs`). |
| `ComponentShowcase.tsx` | Vitrine de componentes de UI. |
| `NotFound.tsx` | Página 404. |

## 3. Bibliotecas internas (`src/lib`)

| Arquivo | Descrição |
| --- | --- |
| `trpc.ts` | Proxy que expõe `api.<modulo>.<procedimento>` e resolve para os drivers reais. |
| `trpc-real/clientes.ts` | CRUD de clientes. |
| `trpc-real/pedidos.ts` | Pedidos: numeração histórica, finalização, exclusão em cascata. |
| `trpc-real/pedidoCartuchos.ts` | Itens do pedido: pesos, status, observações. |
| `trpc-real/cartuchos.ts` | Modelos de cartucho e preços. |
| `trpc-real/reman.ts` | Ordens de remanufatura, itens e unidades. |
| `trpc-real/empresa.ts` | Dados da empresa. |
| `trpc-real/analise.ts` | Agregações para o dashboard analítico. |
| `trpc-real/busca.ts` | Busca global normalizada. |
| `trpc-real/buscadorCartuchos.ts` | Busca de compatibilidade. |
| `trpc-real/notificacoes.ts` | Histórico e envio de notificações de WhatsApp. |
| `trpc-real/whatsappTemplates.ts` | Modelos de mensagem. |
| `trpc-real/erros.ts` | Leitura/resolução de `error_logs`. |
| `trpc-real/ai.ts` | Chat com o gateway de IA. |
| `trpc-real/system.ts` | Backup de dados a partir do navegador. |
| `authClient.ts` | Sessão no navegador: token, `apiFetch`, interceptor 401, login/logout. |
| `permissions.ts` | Matriz de papéis, grupos de permissão, `can()` e overrides. |
| `audit.ts` | Registro de auditoria com diff das mutações. |
| `backup.server.ts` | Geração e restauração do dump SQL (server-only). |
| `db.ts` | Cliente Supabase apontado para o proxy `/api/db`. |
| `guard.ts` | Verificações de acesso na UI. |
| `perfil.ts` | Perfil comercial (cliente final × revenda). |
| `masks.ts` | Máscaras de CPF/CNPJ/telefone/CEP. |
| `cpfCnpjValidation.ts` | Validação de CPF/CNPJ. |
| `whatsapp.ts` | Montagem de links e textos de WhatsApp. |
| `error-capture.ts` / `error-page.ts` / `lovable-error-reporting.ts` | Captura e exibição de erros. |
| `ai.functions.ts` | Server function do chat de IA. |
| `utils.ts` | `cn()` e utilitários gerais. |

## 4. Banco de dados

Enums: `app_role` (admin, user, gerente, vendedor, tecnico), `commercial_profile`
(CLIENTE_FINAL, REVENDA), `error_severity` (baixa, media, alta, critica),
`pedido_status` (aberto, finalizado), `pedido_cartucho_status` (em_espera,
em_andamento, processo, funcionando, circuito_queimado, defeito_cabeca, garantia),
`reman_order_status` (aberto, em_processamento, finalizado, cancelado),
`reman_unit_status` (FUNCIONANDO, COM_PROBLEMA).

| Tabela | Campos principais |
| --- | --- |
| `users` | id, email, password (bcrypt), name, role, active, permissions (jsonb), last_login, password_changed_at |
| `profiles` | id (auth.users), email, name, role, active, last_login |
| `user_roles` | user_id, role |
| `audit_logs` | user_id/name/email/role, action, entity_type, entity_id, entity_label, details (jsonb), ip_address, session_id |
| `clientes` | nome, telefone, telefone2, endereco, cpf, cnpj, inscricao_estadual, commercial_profile, observacoes |
| `cartuchos_cadastro` | modelo_01, modelo_02, price_final_customer, price_reseller |
| `pedidos` | numero, cliente_id, status, observacao_geral, data_finalizacao |
| `pedido_cartuchos` | pedido_id, cartucho_id, codigo, peso_chegada, peso_saida, protegido, status, observacoes |
| `reman_orders` | order_number, cliente_id, **pedido_id** (FK com exclusão em cascata), commercial_profile_snapshot, status, subtotal, discount, total, notes, observacao_geral |
| `reman_order_items` | order_id, cartucho_id, description_snapshot, model_code_snapshot, quantity, unit_price, price_source, line_total |
| `reman_order_units` | order_item_id, cartucho_id, unit_code, status, defect_type, output_weight, is_warranty, notes |
| `notifications` | pedido_id, cliente_id, channel, destination, message, status, external_id, error |
| `whatsapp_templates` | chave, titulo, corpo |
| `error_logs` | error_type, error_message, error_stack, context, severity, resolved, resolved_at, resolved_by, notes |

Todas têm `id`, `created_at` e `updated_at` (trigger `tg_set_updated_at`).
Schema completo e idempotente: `supabase/seed.sql`. Histórico: `supabase/migrations/`.

## 5. Autenticação (JWT próprio)

1. `POST /api/auth/login` valida e-mail/senha com bcrypt na tabela `users`.
2. Devolve um JWT assinado com `JWT_SECRET` (HS256, validade de 7 dias).
3. O navegador guarda o token em `localStorage` sob a chave `auth_token`.
4. `installApiAuthInterceptor()` (em `src/lib/authClient.ts`) adiciona
   `Authorization: Bearer <token>` a toda chamada `/api/*`; um 401 limpa a sessão
   e redireciona para `/login`.
5. `authenticateRequest()` (`src/auth.server.ts`) revalida o usuário no banco a
   cada requisição (ativo? senha trocada depois da emissão? então o token cai).
6. As leituras/escritas de dados passam pelo proxy `src/routes/api/db/$.ts`, que
   valida o JWT e encaminha à Data API com a chave de serviço (lista de tabelas
   permitidas embutida). O front usa `src/lib/db.ts` apontado para esse proxy.

Endpoints: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`,
`/api/auth/users`, `/api/auth/users/:id`, `/api/audit`, `/api/backup/database`,
`/api/backup/code`, `/api/backup/restore`, `/api/db/rest/v1/*`.

## 6. Permissões

Papéis: `admin` (tudo), `gerente`, `vendedor`, `tecnico`. A matriz padrão está em
`src/lib/permissions.ts`; cada usuário pode ter overrides individuais gravados em
`users.permissions` (jsonb) pela tela **Usuários**. `admin` nunca perde
`usuarios.gerenciar`. Use `can(user, "pedido.deletar")` para esconder botões e
bloquear ações. Grupos: Pedidos, Cartuchos, Clientes, Remanufatura, Administração.

## 7. Auditoria

Toda mutação relevante grava em `audit_logs` via `src/lib/audit.ts`: usuário,
papel, ação, entidade, rótulo legível, diff dos campos alterados, IP e sessão.
A tela `/auditoria` lista e filtra os registros (permissão `auditoria.ver`).

## 8. Backup

- UI/API: `POST /api/backup/database` gera um `.sql` com os dados (admin apenas);
  `/api/backup/code` exporta o código; `/api/backup/restore` reimporta INSERTs.
- CLI: `npm run backup` → `scripts/backup-database.ts` grava `backups/dump.sql`
  usando `SUPABASE_SERVICE_ROLE_KEY`.
- Schema: `supabase/seed.sql` (`npm run seed-sql`).

## 9. Variáveis de ambiente

Veja `.env.example`. Cliente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`. Servidor: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_PROJECT_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`,
`SUPABASE_DB_URL`, `APP_SESSION_PASSWORD`, `LOVABLE_API_KEY`.
Regra: `import.meta.env.VITE_*` no navegador; `process.env.*` só dentro de
handlers de servidor.

## 10. Rodando localmente

```sh
npm install
cp .env.example .env   # preencha os valores
npm run dev            # http://localhost:8080
```

Scripts: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`,
`seed` (admin via service role), `seed-sql` (schema + admin via psql),
`backup` (dump em `backups/`).

## 11. Convenções

- Não editar `src/routeTree.gen.ts`, `src/integrations/supabase/client.ts`,
  `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts`, `.env`.
- Mudanças de schema sempre por migração em `supabase/migrations`; refletir em
  `supabase/seed.sql`.
- Textos da interface em português; entradas de texto em caixa alta por padrão.
- Server-only vive em `*.server.ts` ou dentro de handlers; nunca importar a chave
  de serviço em código de navegador.
