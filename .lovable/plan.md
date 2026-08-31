# Reposicionar e simplificar observações do pedido

Mover o bloco "Observação geral do pedido" para o final da tela de detalhe do pedido e deixá-lo sempre editável, sem a necessidade de clicar em "Editar".

## O que será feito

1. **Mover o card de observações para o final**
   - Na página `PedidoDetalhe`, o card "Observação geral do pedido" passa a ser renderizado depois do card "Cartuchos do Pedido".
   - Ele se torna o último elemento da página, conforme solicitado.

2. **Deixar o campo sempre livre para edição**
   - Remover o estado `editandoObs` e o botão "Editar".
   - O `Textarea` será exibido diretamente com o valor atual da observação.
   - Adicionar botão "Salvar" ao lado do campo para persistir a alteração.
   - Ao digitar, o campo atualiza o estado local `obsTemp`; o salvamento continua usando a mutation `atualizarObservacao` existente.
   - Manter mensagens de sucesso/erro via toast e recarregar o pedido após salvar.

## Detalhes técnicos

- Arquivo alterado: `src/pages/PedidoDetalhe.tsx`.
- Estados removidos: `editandoObs`.
- Estados mantidos: `obsTemp` e `obsMutation`.
- A mutation `trpc.pedidos.atualizarObservacao.useMutation()` já existe e continuará sendo usada.
- Nenhuma alteração de banco de dados ou backend é necessária.
