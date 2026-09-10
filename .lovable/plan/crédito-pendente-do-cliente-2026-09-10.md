# Crédito pendente do cliente

Registrar um crédito em aberto na ficha do cliente e avisar sobre ele sempre que um pedido desse cliente for aberto, com opção de usar o crédito como desconto na remanufatura.

## O que muda para você

**Ficha do cliente**
- Dois campos novos: **Crédito pendente (R$)** e **Observação do crédito** (motivo/origem).
- Na lista de clientes, quem tem crédito em aberto ganha um selo em destaque com o valor.

**Ao abrir um novo pedido**
- Assim que você escolher o cliente, aparece um aviso em destaque: "Este cliente possui crédito pendente de R$ X" junto com a observação registrada.

**Dentro do pedido aberto**
- Um bloco fixo no topo mostra o crédito pendente enquanto ele existir.

**Na tela de valores da remanufatura**
- O mesmo aviso aparece junto do total, com o botão **Aplicar crédito**.
- Ao aplicar: o valor entra como desconto da ordem (somado ao desconto já existente, nunca ultrapassando o total) e o saldo do cliente é reduzido no mesmo valor. Se o total for menor que o crédito, sobra o restante como saldo.
- A ação fica registrada na auditoria e a observação do crédito é atualizada com a referência da ordem.

## Detalhes técnicos

- Migração: `clientes.credito_pendente numeric NOT NULL DEFAULT 0` e `credito_observacao text`; refletir em `supabase/seed.sql`.
- `src/lib/trpc-real/clientes.ts`: expor `creditoPendente` e `creditoObservacao` em `ClienteRow`/`ClienteApp`/`toApp`/`toDb`.
- `src/components/ModalCliente.tsx`: campos de valor (máscara monetária simples) e observação; a observação não é convertida em caixa alta.
- `src/components/ModalNovoPedido.tsx`: após `handleSelecionarCliente`, alerta usando o cliente já carregado por `trpc.clientes.listar`.
- `src/pages/PedidoDetalhe.tsx`: banner de crédito a partir do cliente do pedido.
- `src/pages/RemanPedidoDetalhe.tsx`: banner ao lado do bloco de desconto; botão chama uma mutação que atualiza `reman_orders.discount`/`total` e `clientes.credito_pendente` em sequência, invalidando as queries de ordem e cliente.
- Registro em `src/lib/audit.ts` na aplicação do crédito.
- Permissão: aplicar crédito segue a mesma permissão já usada para editar o desconto da ordem.
