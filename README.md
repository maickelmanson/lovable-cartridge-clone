# Cartucho Web — Sistema de Remanufatura de Cartuchos

> Repositório oficial: https://github.com/maickelmanson/lovable-cartridge-clone.git
> (o repositório anterior `cartuchos-web` foi descontinuado)

## Sobre o projeto

Sistema web para gestão completa de uma operação de remanufatura de cartuchos:
clientes, pedidos de coleta, controle de cartuchos por peso e status, ordens de
remanufatura com preços por perfil comercial, impressão em duas vias,
notificações por WhatsApp, auditoria de tudo o que é feito e gestão de usuários
com permissões granulares.

## Tecnologias

- React 19 + TypeScript
- TanStack Start (Vite) + TanStack Router + TanStack Query
- Tailwind CSS v4 + shadcn/ui + Radix + lucide-react
- Supabase (Postgres, Data API)
- Login próprio com bcryptjs + JWT (`jose`)
- recharts, framer-motion, html2pdf.js, react-hook-form + zod, sonner

## Funcionalidades

- Cadastro de clientes (CPF/CNPJ com validação e máscaras) e perfil comercial
- Pedidos com numeração sequencial não reaproveitada e observação geral editável
- Controle de cartuchos: código, peso de chegada/saída, status e garantia
- Ordens de remanufatura vinculadas ao pedido (exclusão em cascata nos dois sentidos)
- Impressão A4 paisagem em duas vias, com cabeçalho da empresa e sem URL/data
- Modelos de mensagem de WhatsApp com variáveis e histórico de envios
- Papéis (admin/gerente/vendedor/técnico) e permissões por caixas de marcação
- Auditoria com diff de campos, dashboards analíticos, painel de erros
- Backup e restauração do banco em SQL

## Pré-requisitos

- Node.js 20+ (ou Bun) e npm
- Um projeto Supabase (ou acesso ao projeto existente)
- `psql` instalado apenas se for usar `npm run seed-sql`

## Instalação passo a passo

```sh
git clone https://github.com/maickelmanson/lovable-cartridge-clone.git
cd lovable-cartridge-clone
npm install
cp .env.example .env      # preencha com as suas chaves
npm run dev               # http://localhost:8080
```

## Configuração do Supabase

1. Crie um projeto em supabase.com (ou use o existente).
2. Copie **Project URL**, **anon/publishable key** e **service role key** para o `.env`.
3. Aplique o schema:
   - `npm run seed-sql` (executa `supabase/seed.sql` via `SUPABASE_DB_URL`), ou
   - `supabase db push` usando os arquivos de `supabase/migrations/`.
4. Crie o administrador: o `seed.sql` já insere `admin@epsolucoes.com` / `EPS@2026`.
   Alternativa via API: `npm run seed`.
5. Troque a senha do administrador no primeiro acesso.

## Variáveis de ambiente

Todas estão documentadas em `.env.example`:

| Variável | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Endpoint da API do projeto |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon) |
| `VITE_SUPABASE_PROJECT_ID` / `SUPABASE_PROJECT_ID` | Ref do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (server-only): login, proxy de dados, backup |
| `JWT_SECRET` | Assinatura dos tokens do login próprio |
| `SUPABASE_DB_URL` | Conexão Postgres usada por `npm run seed-sql` |
| `APP_SESSION_PASSWORD` | Senha da conta técnica de sessão de dados |
| `LOVABLE_API_KEY` | Gateway de IA (assistente) |

## Scripts disponíveis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em http://localhost:8080 |
| `npm run build` | Build de produção |
| `npm run preview` | Serve o build local |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run seed` | Cria/atualiza o usuário administrador via service role |
| `npm run seed-sql` | Aplica `supabase/seed.sql` (schema + admin) no banco |
| `npm run backup` | Gera `backups/dump.sql` com todos os dados |

## Estrutura de pastas

```text
src/
  pages/         telas do sistema
  routes/        rotas TanStack (inclui api/: auth, db, audit, backup)
  components/    layout, modais e UI (shadcn)
  lib/           regras de dados (trpc-real/), permissões, auditoria, backup
  integrations/  clientes Supabase gerados
  auth.server.ts login próprio: bcrypt, JWT, permissões
supabase/
  seed.sql       schema completo idempotente + admin
  migrations/    histórico de migrações
scripts/
  seed-admin.ts       cria o admin via API
  backup-database.ts  exporta os dados para backups/dump.sql
```

## Deploy no Lovable

O projeto é sincronizado com o Lovable: commits enviados para a branch conectada
aparecem no editor, e publicações são feitas pelo botão **Publish**. Não reescreva
o histórico já enviado (sem `force push`, rebase ou squash de commits publicados).

## Backup do banco de dados

- Pela interface: tela de sistema → gerar backup (`POST /api/backup/database`, admin).
- Pelo terminal: `npm run backup` → `backups/dump.sql` (a pasta é ignorada pelo git).
- Restauração: `POST /api/backup/restore` com o conteúdo do dump, ou execute os
  `INSERT`s do arquivo diretamente no Postgres.

## Solução de problemas comuns

| Sintoma | Causa provável / solução |
| --- | --- |
| `JWT_SECRET não configurado` | Falta a variável no `.env`; defina e reinicie o dev server. |
| Login retorna 401 mesmo com a senha certa | Usuário inativo, ou senha alterada depois da emissão do token — faça login de novo. |
| Telas sem dados e 401 em `/api/db/...` | Token expirado (7 dias) ou `SUPABASE_SERVICE_ROLE_KEY` ausente no servidor. |
| `permission denied for table ...` | Faltam GRANTs; reaplique `supabase/seed.sql`. |
| `npm run seed-sql` falha | `SUPABASE_DB_URL` ausente/incorreto ou `psql` não instalado. |
| Porta 8080 ocupada | Encerre o processo anterior ou rode `npm run dev -- --port 5173`. |
| URL/data aparecendo na impressão | Desmarque cabeçalhos e rodapés nas opções do navegador. |
