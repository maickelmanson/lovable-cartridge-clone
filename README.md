# Cartuchos Web — Sistema de Remanufatura de Cartuchos

> Repositório oficial: https://github.com/maickelmanson/lovable-cartridge-clone.git
> (o repositório anterior `cartuchos-web` foi descontinuado)

## Sobre o projeto

**Cartuchos Web** é o sistema de gestão da **EPSOLUÇÕES** para a operação de remanufatura de cartuchos e o controle de pedidos.

Ele centraliza:

- o cadastro de clientes (cliente final e revenda);
- a entrada de cartuchos por pedido, com pesos de chegada/saída, status e usuário responsável;
- a geração e impressão das ordens de remanufatura (duas vias em A4 paisagem);
- a auditoria de tudo o que é criado, alterado e excluído;
- o controle do que cada usuário pode fazer no sistema;
- o backup dos dados do banco.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | React 19 + TypeScript |
| Framework / build | TanStack Start v1 sobre Vite (SSR em runtime edge) |
| Rotas | TanStack Router (roteamento por arquivos em `src/routes`) |
| Dados | TanStack Query + camada tRPC própria (`src/lib/trpc.ts` → `src/lib/trpc-real/*`) |
| Estilo | Tailwind CSS v4 + shadcn/ui + Radix + lucide-react |
| Banco de dados | Supabase (PostgreSQL + Data API) |
| Autenticação | Login próprio com bcryptjs + JWT (`jose`) |
| Extras | recharts, framer-motion, html2pdf.js, sonner, react-hook-form, zod |

## Funcionalidades

- **Login com JWT próprio** — e-mail e senha validados com bcrypt; token de 7 dias guardado no navegador, com renovação automática antes de expirar.
- **Gestão de clientes** — cadastro completo, perfil comercial, histórico de pedidos.
- **Pedidos** — numeração automática, observação geral, duplicação, finalização e reabertura.
- **Cartuchos do pedido** — modelo, código, peso de chegada/saída, protegido, status, observações e **usuário responsável**.
- **Remanufatura** — ordens geradas a partir do pedido, itens e unidades, garantia, preços por perfil e impressão em duas vias.
- **Auditoria** — cada mutação registra usuário, ação, entidade e o diff dos campos alterados.
- **Permissões** — papéis `admin`, `gerente`, `vendedor` e `tecnico`, com autorizações individuais por caixas de marcação.
- **Backup do banco** — exportação em SQL pela interface (admin) ou pelo terminal.
- **Dashboard retrátil** — barra lateral que recolhe automaticamente e reaparece ao passar o mouse.
- **Máscaras** — CPF, CNPJ, telefone e CEP aplicadas nos formulários.
- **WhatsApp via wa.me** — mensagens padrão configuráveis e histórico de envios.

## Pré-requisitos

- **Node.js 18+** (recomendado 20+)
- **npm** (ou bun)
- Um projeto **Supabase** com acesso à chave de serviço

## Instalação passo a passo

```sh
# 1. Clonar o repositório
git clone https://github.com/maickelmanson/lovable-cartridge-clone.git
cd lovable-cartridge-clone

# 2. Instalar as dependências
npm install

# 3. Criar o arquivo de ambiente
cp .env.example .env
# edite o .env e preencha as variáveis

# 4. Subir o servidor de desenvolvimento (porta 8080)
npm run dev
```

Acesse http://localhost:8080.

## Configuração do Supabase

- Projeto usado em produção: `ejwvxdqkxrcywehtesyo`
- Endpoint: `https://ejwvxdqkxrcywehtesyo.supabase.co`

Para rodar com um projeto próprio:

1. Crie um projeto no Supabase.
2. Copie a URL, o project ref, a chave publicável e a chave de serviço para o `.env`.
3. Execute o schema completo:
   ```sh
   npm run seed-sql
   ```
   O arquivo `supabase/seed.sql` cria os tipos, todas as tabelas, GRANTs, RLS, políticas, triggers e o usuário administrador inicial (`admin@epsolucoes.com`).
4. Alternativamente, `npm run seed` cria apenas o usuário administrador usando a chave de serviço.

## Variáveis de ambiente

Todas estão descritas em `.env.example`.

| Variável | Para que serve |
| --- | --- |
| `VITE_SUPABASE_PROJECT_ID` | ID (ref) do projeto Supabase, disponível no navegador |
| `VITE_SUPABASE_URL` | URL da API do Supabase usada pelo navegador |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável (anon); pode ficar no bundle |
| `SUPABASE_PROJECT_ID` | Mesmo ID, lido pelo runtime do servidor |
| `SUPABASE_URL` | Mesma URL, lida pelo runtime do servidor |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável usada em leituras públicas no servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (ignora RLS): login, proxy `/api/db/*`, backups e scripts |
| `JWT_SECRET` | Segredo que assina os tokens do login próprio (mín. 32 caracteres) |
| `SUPABASE_DB_URL` | String de conexão Postgres usada por `npm run seed-sql` |
| `APP_SESSION_PASSWORD` | Senha da conta técnica que abre a sessão de dados do sistema |
| `LOVABLE_API_KEY` | Chave do gateway de IA (assistente); opcional |

Regra: `import.meta.env.VITE_*` no navegador, `process.env.*` apenas dentro de handlers de servidor.

## Scripts disponíveis

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em http://localhost:8080 |
| `npm run build` | Build de produção |
| `npm run seed` | Cria/atualiza o usuário administrador via chave de serviço |
| `npm run seed-sql` | Executa `supabase/seed.sql` (schema completo + admin) via `SUPABASE_DB_URL` |
| `npm run backup` | Gera `backups/dump.sql` com os dados de todas as tabelas |

## Estrutura de pastas

```text
src/
├── pages/              # Telas do sistema (pedidos, clientes, remanufatura, usuários...)
├── lib/                # Regras de negócio, tRPC próprio, permissões, auditoria, máscaras
│   └── trpc-real/      # Drivers de dados por módulo
├── routes/             # Rotas TanStack (UI catch-all + endpoints em routes/api)
├── components/         # Componentes compartilhados e shadcn/ui
├── integrations/       # Clientes Supabase gerados
supabase/
├── migrations/         # Histórico de alterações do banco
└── seed.sql            # Schema completo e idempotente + admin inicial
scripts/                # seed-admin.ts e backup-database.ts
```

## Deploy pelo Lovable

O projeto está conectado ao Lovable:

- alterações feitas no Lovable são sincronizadas automaticamente com o GitHub;
- commits feitos no GitHub voltam para o Lovable;
- a publicação é feita pelo botão **Publish** dentro do Lovable.

## Backup do banco

- **Pelo terminal:** `npm run backup` gera `backups/dump.sql` com os dados de todas as tabelas do sistema.
- **Pela interface:** usuários administradores têm o botão de backup no painel, que baixa o mesmo dump em SQL; há também a opção de restaurar um arquivo gerado anteriormente.
- A pasta `backups/` está no `.gitignore` e nunca é versionada.

## Solução de problemas

| Problema | Como resolver |
| --- | --- |
| Erro "JWT_SECRET não configurado" | Defina `JWT_SECRET` no `.env` e reinicie o servidor |
| Erro 401 nas chamadas de `/api/db` | Verifique `SUPABASE_SERVICE_ROLE_KEY` e se o login ainda está válido |
| Porta 8080 ocupada | Altere a porta em `vite.config.ts` |
| `npm run seed-sql` falha | Confirme `SUPABASE_DB_URL` (usuário, senha e host do Postgres) |
| Login não funciona / sem usuários | Rode `npm run seed` para criar o administrador |
| Dados não aparecem após clonar | Rode `npm run seed-sql` para criar o schema no seu projeto Supabase |
