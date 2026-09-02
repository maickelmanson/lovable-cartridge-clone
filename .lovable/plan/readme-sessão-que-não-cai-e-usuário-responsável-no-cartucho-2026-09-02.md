# README, sessão que não cai e usuário responsável no cartucho

Três tarefas em uma única atualização. Nada do que já funciona é alterado.

## 1. README.md reescrito

Substituir o conteúdo mantendo o bloco do Lovable no topo, nesta ordem: Sobre o projeto Cartuchos Web (EPSOLUÇÕES), Tecnologias, Funcionalidades, Pré-requisitos, Instalação passo a passo, Configuração do Supabase, Variáveis de ambiente (todas as do `.env.example`, com explicação), Scripts (`dev`, `build`, `seed`, `seed-sql`, `backup`), Estrutura de pastas, Deploy pelo Lovable, Backup do banco e Solução de problemas.

## 2. Fim do logout automático indevido

- Conferir/garantir expiração do JWT em 7 dias na assinatura do token (`src/auth.server.ts`).
- No interceptor de `fetch` (`src/lib/authClient.ts`): ao receber 401, antes de limpar a sessão, tentar uma revalidação em `/api/auth/me`. Se a revalidação responder OK, a requisição original é repetida uma vez e a sessão é mantida; só se a revalidação também falhar o token é limpo e ocorre o redirecionamento para `/login`. A própria chamada a `/api/auth/me` fica fora desse laço, para não recursar.
- Renovação proativa: novo endpoint `POST /api/auth/refresh` que, com um token ainda válido, emite outro token de 7 dias. No navegador, um verificador leve lê o `exp` do token e, quando faltarem menos de 30 minutos, chama o refresh e grava o novo token (checagem periódica e ao voltar o foco da aba).
- Login e logout permanecem exatamente como estão.

## 3. Usuário responsável no cartucho

- Migração: coluna `usuario_id` (uuid, referência a `users`, `ON DELETE SET NULL`) em `pedido_cartuchos`, com índice.
- Novo endpoint autenticado `GET /api/auth/users/ativos` devolvendo apenas id, nome e papel dos usuários ativos — necessário porque a listagem atual de usuários é restrita a administradores e qualquer usuário precisa escolher o responsável.
- Modal "Editar Cartucho" (dentro do pedido): campo Select "Usuário responsável" com os usuários ativos, salvo em `usuario_id`. Ao criar um cartucho, o usuário logado vem pré-selecionado e pode ser trocado.
- Listagem de cartuchos do pedido: nova coluna "Responsável" com o nome do usuário (traço quando vazio).
- `supabase/seed.sql` atualizado com a coluna.
- Buscador de cartuchos por período: filtro "Usuário" (todos + cada usuário ativo); quantidade, valores e total passam a respeitar o filtro, e a coluna Responsável entra na tabela e no CSV exportado.

## Detalhes técnicos

- Camada de dados: `src/lib/trpc-real/pedidoCartuchos.ts` passa a mapear `usuario_id` ↔ `usuarioId` e a resolver os nomes; `src/lib/trpc-real/buscadorCartuchos.ts` ganha o parâmetro de usuário.
- A lista de usuários ativos é buscada pelo endpoint HTTP (com o Bearer já anexado pelo interceptor), não pelo proxy `/api/db`, que não expõe a tabela `users`.
- Auditoria continua registrando as alterações do cartucho, agora incluindo o responsável.
- Commit e push acontecem pela sincronização automática do Lovable com o GitHub.
