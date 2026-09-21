# Valores editáveis no pedido e responsável automático

## 1. Valores dentro do pedido (antes de finalizar)

- Cada cartucho do pedido passa a ter um campo **Valor (R$)** no modal de adicionar/editar. Ele já vem preenchido com o preço do modelo conforme o perfil do cliente (cliente final ou revenda) e pode ser alterado só naquele pedido.
- A lista de cartuchos do pedido ganha a coluna **Valor**.
- Abaixo da lista aparece um resumo com **Subtotal**, **Desconto** (editável no próprio pedido) e **Total**, no mesmo estilo já usado na tela de remanufatura.
- Só contam no subtotal os cartuchos cobráveis (funcionando e fora de garantia), igual à regra atual de faturamento.
- Ao finalizar o pedido, a remanufatura gerada usa os valores e o desconto digitados no pedido, em vez de buscar sempre o preço do cadastro. Se nenhum valor foi digitado, continua usando o preço do modelo (comportamento atual).
- Edição de valores e desconto respeita a permissão de editar pedido e fica registrada na auditoria.

## 2. Responsável automático

Hoje o responsável só é gravado quando o cartucho é incluído pelo modal dentro de um pedido já aberto. Quando os cartuchos são adicionados na criação do pedido (tela de novo pedido), o responsável não é enviado e fica vazio — por isso muitos cartuchos aparecem sem nome.

- Na criação do pedido, cada cartucho incluído passa a gravar o usuário logado como responsável.
- Ao editar um cartucho que está sem responsável, o campo vem preenchido com o usuário logado (continua podendo ser trocado).
- A lista de responsáveis passa a incluir sempre o usuário logado, mesmo que a lista de usuários ativos ainda não tenha carregado.

## Detalhes técnicos

- Migração: `pedido_cartuchos.preco_unitario numeric NULL` e `pedidos.desconto numeric NOT NULL DEFAULT 0`; `supabase/seed.sql` atualizado com as duas colunas.
- `src/lib/trpc-real/pedidoCartuchos.ts`: mapear `preco_unitario` ↔ `precoUnitario` em `toApp`/`toDb`.
- `src/lib/trpc-real/pedidos.ts`: gravar `usuario_id` e `preco_unitario` nos cartuchos criados junto com o pedido; nova mutação `atualizarDesconto`; `gerarRemanAPartirDoPedido` usa `preco_unitario` quando presente (fallback no preço do modelo) e copia `pedidos.desconto` para `reman_orders.discount` no cálculo do total.
- `src/components/ModalCartucho.tsx`: campo de valor com máscara monetária, preenchido a partir do modelo/perfil do cliente; `usuarioId` com fallback para o usuário logado também na edição.
- `src/components/ModalNovoPedido.tsx`: envia `usuarioId` e `precoUnitario` por cartucho.
- `src/pages/PedidoDetalhe.tsx`: coluna Valor, bloco de subtotal/desconto/total com edição inline do desconto.
- Auditoria via `registrarAuditoria` nas alterações de valor e desconto.
