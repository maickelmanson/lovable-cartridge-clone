# Observação geral editável dentro do pedido

Hoje o campo "Observação geral do pedido" só existe na tela de criação (Novo Pedido). O texto é gravado no banco, mas depois não aparece nem pode ser editado ao abrir o pedido.

## O que será feito

1. **Card de Observações no detalhe do pedido**
   - Na página do pedido (abaixo dos cards Status / Data de Criação / Cartuchos), entra um bloco "Observação geral do pedido".
   - Mostra o texto já salvo na criação; se estiver vazio, mostra um aviso discreto ("Sem observações").
   - Botão "Editar" abre a área de texto; botões "Salvar" e "Cancelar" concluem a edição.
   - Confirmação por toast ao salvar e mensagem de erro em caso de falha.

2. **Salvamento no banco**
   - Nova operação para atualizar apenas a observação do pedido, com registro em auditoria como as demais alterações.
   - Após salvar, a tela recarrega o pedido para refletir o novo texto.

3. **Reflexo na impressão/remanufatura**
   - A observação editada continua sendo copiada para o pedido de remanufatura quando o pedido é finalizado (comportamento já existente), agora com o texto atualizado.

## Detalhes técnicos

- `src/lib/trpc-real/pedidos.ts`: adicionar mutation `atualizarObservacao` ({ id, observacaoGeral }) que faz `update` de `observacao_geral` em `pedidos`, chama `requirePermission` no mesmo padrão das demais mutations, registra auditoria com `diff` e invalida as queries `pedidos`.
- `src/pages/PedidoDetalhe.tsx`: estado local `editandoObs` / `obsTemp`, card com `Textarea`, uso de `trpc.pedidos.atualizarObservacao.useMutation()` e `pedidoQuery.refetch()`.
- Sem alteração de banco de dados: a coluna `observacao_geral` já existe em `pedidos`.
