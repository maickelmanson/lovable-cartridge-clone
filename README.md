# Cartucho Web — Sistema de Remanufatura de Cartuchos

> Repositório oficial: https://github.com/maickelmanson/lovable-cartridge-clone.git
> (o repositório anterior `cartuchos-web` foi descontinuado)

## Sobre o projeto

**Cartuchos Web** é o sistema de gestão da **EPSOLUÇÕES** para operação de remanufatura de cartuchos e controle de pedidos. A aplicação centraliza o cadastro de clientes, acompanhamento de cartuchos por peso e status, emissão de ordens de remanufatura, auditoria de ações, controle de permissões por papel e backup dos dados.

## Tecnologias

- React 19
- TypeScript
- TanStack Start
- TanStack Router
- tRPC (camada própria via proxy em `src/lib/trpc.ts`)
- Tailwind CSS v4
- shadcn/ui
- Supabase (Postgres + Data API)
- bcryptjs
- JWT (`jose`)

## Funcionalidades

- Login próprio com JWT (7 dias de validade, invalidação automática após troca de senha)
- Gestão completa de clientes com máscaras de CPF/CNPJ, telefone e CEP
- Cadastro e controle de pedidos com numeração sequencial não reaproveitada
- Controle de cartuchos por código, peso de chegada/saída, status e garantia
- Ordens de remanufatura vinculadas ao pedido com exclusão em cascata nos dois sentidos
- Impressão A4 paisagem em duas vias, com cabeçalho da empresa e sem URL/data
- Auditoria com diff de campos alterados em todas as mutações relevantes
- Permissões granulares por role (admin, gerente, vendedor, técnico) com overrides por usuário
- Backup e restauração do banco em SQL
- Dashboard retrátil com modo mini e expansão ao passar o mouse
- Máscaras de CNPJ e telefone em inputs
- Notificações por WhatsApp via links `wa.me` com modelos de mensagem editáveis

## Pré-requisitos

- Node.js 18+
- npm ou bun

## Instalação passo a passo

```sh
git clone https://github.com/maickelmanson/lovable-cartridge-clone.git
cd lovable-cartridge-clone
npm install
cp .env.example .env   # preencha as variáveis com os valores do seu projeto
npm run dev            # servidor disponível em http://localhost:8080
```

## Configuração do Supabase

O projeto está configurado para o projeto Supabase `ejwvxdqkxrcywehtesyo` (`https://ejwvxdqkxrcywehtesyo.supabase.co`). Para rodar em outro projeto:

1. Crie um projeto no Supabase.
2. Preencha as variáveis de ambiente no `.env` com URL, publishable key e service role key.
3. Execute `supabase/seed.sql` para criar as tabelas, funções, políticas de RLS e o usuário administrador padrão.

O seed cria o admin inicial: `admin@epsolucoes.com` / `EPS@2026`.

## Variáveis de ambiente

Todas as variáveis estão documentadas em `.env.example`:

| Variável | Descrição |
| --- | --- |
| `SUPABASE_PROJECT_ID` | Ref/ID do projeto Supabase (lado servidor) |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon) do Supabase (lado servidor) |
| `SUPABASE_URL` | URL da API do Supabase (lado servidor) |
| `VITE_SUPABASE_PROJECT_ID` | Ref/ID do projeto Supabase (exposto no navegador) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon) do Supabase (exposta no navegador) |
| `VITE_SUPABASE_URL` | URL da API do Supabase (exposta no navegador) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase, server-only: login, proxy de dados e backup |
| `JWT_SECRET` | Segredo usado para assinar os tokens JWT do login próprio (mín. 32 caracteres) |
| `SUPABASE_DB_URL` | String de conexão Postgres usada por `npm run seed-sql` |
| `APP_SESSION_PASSWORD` | Senha da conta técnica de sessão de dados do sistema |
| `LOVABLE_API_KEY` | Chave do gateway de IA usada pelo assistente de chat (opcional) |

## Scripts disponíveis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento em http://localhost:8080 |
| `npm run build` | Gera o build de produção |
| `npm run seed` | Cria/atualiza o usuário administrador via service role |
| `npm run seed-sql` | Aplica `supabase/seed.sql` (schema + admin) no banco de dados |
| `npm run backup` | Gera `backups/dump.sql` com todos os dados das tabelas |

## Estrutura de pastas

```text
src/
  pages/         telas do sistema
  lib/           regras de dados, permissões, auditoria e backup
  routes/        rotas TanStack (inclui endpoints da API)
  components/    componentes de layout, modais e UI (shadcn)
supabase/
  migrations/    histórico de migrações do banco
  seed.sql       schema completo idempotente + usuário admin
scripts/
  seed-admin.ts       cria o admin via API
  backup-database.ts  exporta os dados para backups/dump.sql
```

## Deploy pelo Lovable

O projeto está conectado ao Lovable. Edições feitas no editor Lovable sincronizam automaticamente com o GitHub, e commits enviados para a branch conectada no GitHub sincronizam de volta para o Lovable. Não reescreva o histórico já publicado (evite `force push`, rebase ou squash de commits publicados).

## Backup do banco

- Pela interface: na Dashboard, usuários admin podem usar o botão de backup (`POST /api/backup/database`).
- Pelo terminal: `npm run backup` gera `backups/dump.sql` com os dados de todas as tabelas (a pasta `backups/` é ignorada pelo git).
- Restauração: execute os `INSERT`s do dump diretamente no Postgres, ou use `POST /api/backup/restore` com o conteúdo do arquivo.

## Solução de problemas

| Sintoma | Causa provável / solução |
| --- | --- |
| Erro de JWT ausente | Verifique se `JWT_SECRET` está definido no `.env` e reinicie o dev server. |
| Erro 401 no proxy de dados | Verifique se `SUPABASE_SERVICE_ROLE_KEY` está preenchida corretamente no `.env`. |
| Porta 8080 ocupada | Altere a porta em `vite.config.ts` ou encerre o processo anterior. |
| Seed falha sem service role | Defina `SUPABASE_DB_URL` corretamente para usar `npm run seed-sql`. |
| Login falha | Execute `npm run seed` para garantir que o usuário admin existe no banco. |
