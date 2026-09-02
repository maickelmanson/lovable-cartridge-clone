# Reescrever README.md completo

## Objetivo

Substituir o conteúdo atual de `README.md` por uma documentação completa e estruturada do projeto Cartuchos Web, mantendo o bloco do Lovable no topo.

## Seções na ordem solicitada

1. **Sobre o projeto** — Cartuchos Web, sistema de gestão de remanufatura de cartuchos e pedidos da EPSOLUÇÕES.
2. **Tecnologias** — React 19, TypeScript, TanStack Start, TanStack Router, tRPC, Tailwind CSS v4, shadcn/ui, Supabase, bcryptjs, JWT, jose.
3. **Funcionalidades** — login JWT, gestão de clientes, pedidos, cartuchos, remanufatura, auditoria, permissões por role, backup do banco, dashboard retrátil, máscaras CNPJ/telefone, WhatsApp via wa.me.
4. **Pré-requisitos** — Node.js 18+, npm ou bun.
5. **Instalação passo a passo** — clone, cd, npm install, cp .env.example .env, preencher variáveis, npm run dev na porta 8080.
6. **Configuração do Supabase** — projeto `ejwvxdqkxrcywehtesyo`, URL `https://ejwvxdqkxrcywehtesyo.supabase.co`, criar projeto no Supabase, executar `supabase/seed.sql` para criar tabelas e usuário admin.
7. **Variáveis de ambiente** — listar todas as variáveis de `.env.example` com explicação:
   - `SUPABASE_PROJECT_ID`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `SUPABASE_DB_URL`
   - `APP_SESSION_PASSWORD`
   - `LOVABLE_API_KEY`
8. **Scripts disponíveis** — `npm run dev`, `npm run build`, `npm run seed`, `npm run seed-sql`, `npm run backup`.
9. **Estrutura de pastas** — `src/pages`, `src/lib`, `src/routes`, `src/components`, `supabase/migrations`, `supabase/seed.sql`, `scripts/`.
10. **Deploy pelo Lovable** — projeto conectado ao Lovable, edições no Lovable sincronizam com GitHub, commits no GitHub sincronizam de volta.
11. **Backup do banco** — `npm run backup` gera `backups/dump.sql` com todos os dados das 15 tabelas; botão de backup na Dashboard para admin.
12. **Solução de problemas** — erro JWT ausente, erro 401 no proxy, porta 8080 ocupada, seed sem service role, login falha.

## Restrições

- Manter o bloco do Lovable no topo do arquivo.
- Não alterar código fonte, rotas, páginas, `.env` ou banco de dados.
- Após a conclusão, o commit/push para o GitHub ocorre pela sincronização automática do Lovable.
