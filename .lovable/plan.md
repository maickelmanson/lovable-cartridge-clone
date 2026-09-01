# Vincular Pedidos e Pedidos de Remanufatura na exclusão

## O problema (confirmado no código e no banco)

Hoje o pedido de remanufatura só é ligado ao pedido normal por texto: o número `REM-0010` corresponde ao pedido `#0010`. Não existe nenhum vínculo real no banco.

Consequências:

1. Excluir um pedido em **Pedidos** não remove o `REM-...` correspondente em **Remanufatura**, e excluir o pedido de remanufatura não remove o pedido de origem.
2. O próximo número de pedido é calculado a partir do último registro existente. Se o último pedido for excluído, o número é reaproveitado (ex.: `#0010` de novo). Ao finalizar esse novo pedido, o sistema encontra o `REM-0010` antigo que ficou órfão e grava os itens novos dentro dele — é exatamente o efeito de "um pedido em cima do outro".

## O que será feito

### 1. Vínculo real no banco
- Nova coluna `pedido_id` em `reman_orders`, apontando para `pedidos`, com exclusão em cascata.
- Preenchimento dos registros já existentes cruzando `REM-<numero>` com o número do pedido.
- Índice único em `pedido_id` para garantir no máximo um pedido de remanufatura por pedido.

Com isso, excluir o pedido remove automaticamente o pedido de remanufatura, seus itens e unidades.

### 2. Exclusão nos dois sentidos
- Ao excluir em **Pedidos**: o pedido de remanufatura ligado é removido junto (itens e unidades incluídos), com registro na auditoria.
- Ao excluir em **Remanufatura – Pedidos**: pedir confirmação e remover também o pedido de origem e seus cartuchos, quando o pedido de remanufatura tiver sido gerado a partir de um pedido. Pedidos de remanufatura criados manualmente (sem origem) continuam sendo excluídos sozinhos.

### 3. Fim da reutilização de número
- O próximo número passa a ser calculado pelo maior número já usado (não pelo último registro), evitando repetir números de pedidos excluídos.
- A geração de remanufatura passa a localizar o registro pelo vínculo `pedido_id`, e não pelo texto do número, de modo que um pedido novo nunca reaproveite o registro de outro.

### 4. Limpeza dos órfãos existentes
- Remoção dos pedidos de remanufatura que não tenham mais um pedido de origem correspondente (nenhum encontrado agora, mas a limpeza fica na mesma migração por segurança).

## Detalhes técnicos

- Migração: `ALTER TABLE public.reman_orders ADD COLUMN pedido_id bigint REFERENCES public.pedidos(id) ON DELETE CASCADE`, backfill por `order_number = 'REM-' || pedidos.numero`, índice único parcial em `pedido_id`, e `DELETE` dos órfãos gerados automaticamente.
- `src/lib/trpc-real/pedidos.ts`: `gerarRemanAPartirDoPedido` busca/insere por `pedido_id`; `proximoNumero` usa `MAX` numérico; `deletar` remove itens/unidades/ordem reman vinculada antes do pedido (além da cascata).
- `src/lib/trpc-real/reman.ts`: `deletar` lê `pedido_id` e, quando existir, apaga `pedido_cartuchos` + `pedidos` correspondentes; invalida as queries `pedidos` e `remanOrders`.
- `src/pages/RemanPedidos.tsx` e `src/pages/RemanPedidoDetalhe.tsx`: texto de confirmação avisando que o pedido de origem também será excluído.
- Tipos do banco são regenerados após a migração.
