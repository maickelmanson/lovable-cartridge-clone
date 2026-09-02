# Repositório pronto para clonar e rodar

Objetivo: qualquer pessoa (ou IA) que clonar o repositório tem documentação, exemplo de ambiente, seed do banco e backup automatizado, sem tocar em nada que já funciona.

## 1. AGENTS.md — documentação completa

Reescrever mantendo intacto o bloco `<!-- LOVABLE:BEGIN/END -->` do topo, com:
- Stack real do projeto: React 19, TypeScript, TanStack Start + TanStack Router (roteamento por arquivos em `src/routes`), TanStack Query, camada tRPC-like em `src/lib/trpc.ts` + `src/lib/trpc-real/*`, Tailwind v4, shadcn/ui, Supabase (projeto `ejwvxdqkxrcywehtesyo`).
- Todas as páginas de `src/pages` (25 arquivos) com uma linha de descrição cada.
- Todos os arquivos de `src/lib` e de `src/lib/trpc-real` com descrição.
- Estrutura do banco: tabelas `users`, `profiles`, `user_roles`, `audit_logs`, `clientes`, `cartuchos_cadastro`, `pedidos`, `pedido_cartuchos`, `empresa_dados`, `reman_orders`, `reman_order_items`, `reman_order_units`, `notifications`, `whatsapp_templates`, `error_logs` — campos e enums.
- Fluxo de autenticação próprio: login em `/api/auth/login`, bcrypt + JWT (jose, 7 dias), token no `localStorage` (`auth_token`), interceptor em `authClient.ts`, proxy de dados em `/api/db/*`.
- Permissões por papel (admin/gerente/vendedor/tecnico) e overrides por usuário (`users.permissions`), conforme `src/lib/permissions.ts`.
- Auditoria (`audit_logs` + `src/lib/audit.ts`), backup (`/api/backup/*` + `src/lib/backup.server.ts`), variáveis de ambiente e como rodar localmente.

Nota de precisão: `wouter` está instalado mas o roteamento efetivo é TanStack Router — a documentação vai registrar isso em vez de descrever um roteador que não é usado.

## 2. README.md

Reescrever com: sobre o projeto, tecnologias, funcionalidades, pré-requisitos, instalação passo a passo, configuração do Supabase, variáveis de ambiente, scripts (`dev`, `build`, `seed`, `seed-sql`, `backup`), estrutura de pastas, deploy pelo Lovable, backup do banco e solução de problemas comuns (erro de JWT ausente, 401 no proxy, porta 8080, seed sem service role).

## 3. .env.example

Novo arquivo na raiz com placeholders e comentário por variável: `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, mais as chaves server-only usadas pelo código (`JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `APP_SESSION_PASSWORD`, `LOVABLE_API_KEY`).

Ponto a confirmar: você pediu para colocar `.env.example` no `.gitignore`. Isso o excluiria do repositório e ninguém que clonasse o veria — o padrão é versionar o `.env.example` e ignorar o `.env`. A proposta é versionar o `.env.example` e ignorar o `.env`; digo isso agora para você decidir antes de eu executar.

O arquivo `.env` atual fica exatamente como está.

## 4. supabase/seed.sql

Arquivo único com o schema completo: enums (`CREATE TYPE ... IF NOT EXISTS` via bloco `DO`), `CREATE TABLE IF NOT EXISTS` de todas as tabelas listadas acima, GRANTs, RLS e políticas equivalentes às atuais, triggers de `updated_at`, funções `handle_new_user` e `tg_set_updated_at`, e o `INSERT ... ON CONFLICT DO NOTHING` do admin `admin@epsolucoes.com` (hash bcrypt de `EPS@2026`, papel `admin`, ativo).

Script `npm run seed-sql` executando `psql "$SUPABASE_DB_URL" -f supabase/seed.sql`. Observação: a senha do banco não é acessível no Lovable Cloud, então esse script serve para quem clonar e usar um Supabase próprio; no ambiente Lovable o schema continua vindo das migrações.

## 5. scripts/backup-database.ts

Script em TypeScript (roda com `bun run` ou `tsx`) que lê `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, percorre todas as tabelas, pagina os resultados e grava `backups/dump.sql` com `INSERT`s escapados (mesma lógica de escape já usada em `src/lib/backup.server.ts`). Adiciona `npm run backup`.

## 6. .gitignore

Acrescentar, mantendo o conteúdo atual: `.env`, `backups/`, `node_modules/`, `dist/`, `.DS_Store` (as três últimas já existem em forma equivalente; ficam explícitas sem duplicar).

## Git

Commit e push acontecem automaticamente pela sincronização do Lovable com o GitHub assim que as alterações forem aplicadas — não é preciso rodar comandos git manualmente.

## Nada é alterado no funcionamento

Nenhuma mudança em rotas, páginas, `src/lib`, `.env` ou banco de dados. Só documentação, arquivos novos e entradas de scripts/gitignore.
