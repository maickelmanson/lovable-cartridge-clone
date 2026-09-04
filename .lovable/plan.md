# Dados da empresa visíveis para todos os usuários

## Por que aconteceu

Os dados da empresa são gravados por usuário: cada registro tem um `owner_id` e a
tela só lê o registro do usuário logado. Hoje existem **três** cadastros diferentes
no banco, cada um pertencendo a um usuário distinto. Quando o Rangel entrou em outro
PC, ele viu vazio porque nunca tinha um registro próprio — não é problema de
navegador nem de cache.

Todos os outros módulos (clientes, pedidos, cartuchos) já são compartilhados; só a
empresa ficou isolada por usuário.

## O que será feito

1. **Consolidar em um único cadastro**: manter o registro mais recente e completo
   (EPS SOLUÇÕES EM IMPRESSORAS, SUPRIMENTOS E TINTAS PREMIUM) e remover os
   duplicados antigos, via migração.
2. **Leitura compartilhada**: a tela de Dados da Empresa passa a ler o registro
   existente sem filtrar por usuário, então qualquer usuário logado vê a mesma
   informação (inclusive nos cabeçalhos de impressão).
3. **Gravação compartilhada**: ao salvar, o sistema atualiza esse mesmo registro
   único em vez de criar um novo por usuário. A permissão `empresa.editar`
   continua controlando quem pode alterar.

## Detalhes técnicos

- Migração em `supabase/migrations`: apagar as linhas duplicadas de `empresa_dados`
  mantendo a de id 9; refletir em `supabase/seed.sql` se necessário.
- `src/lib/trpc-real/empresa.ts`:
  - `obter`: remover o `.eq("owner_id", ...)`, buscar o primeiro registro
    (`order by id`, `limit 1`).
  - `salvar`: procurar o registro existente sem filtro de owner; atualizar quando
    existir, inserir apenas quando a tabela estiver vazia.
- Nenhuma alteração em RLS (a política já é compartilhada entre usuários
  autenticados) nem em outros módulos.

## Validação

- Verificar que sobrou apenas um registro em `empresa_dados`.
- Abrir a tela de Dados da Empresa e conferir que os dados aparecem; conferir também
  o cabeçalho da impressão de remanufatura.
