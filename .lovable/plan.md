# Teste do fluxo de crédito pendente

O recurso já está implementado no sistema. Este plano é apenas para validar o funcionamento de ponta a ponta com dados de exemplo, sem alterar o código.

## O que já existe hoje

- Campo **Crédito pendente (R$)** e **Observação do crédito** na ficha do cliente.
- Selo amarelo com o valor na lista de clientes.
- Aviso ao escolher o cliente em um novo pedido e dentro do pedido aberto.
- Botão **Aplicar crédito** na tela de valores da remanufatura: o abatimento é limitado ao total da ordem, então o pedido zera quando o crédito é maior, e o saldo que sobra continua guardado no cliente.

## Teste que será feito

1. Criar um cliente de teste com crédito de R$ 300,00 e uma observação.
2. Conferir o selo amarelo na lista de clientes.
3. Abrir um pedido para esse cliente e confirmar o aviso do crédito na tela.
4. Gerar a ordem de remanufatura com total menor que o crédito (cerca de R$ 90,00).
5. Clicar em **Aplicar crédito** e conferir:
   - total da ordem fica em R$ 0,00;
   - saldo do cliente cai para o restante (cerca de R$ 210,00);
   - a observação do crédito registra o abatimento parcial.
6. Repetir uma segunda aplicação em uma ordem com total maior que o saldo, para conferir que o saldo zera e o desconto fica igual ao crédito disponível.
7. Apagar todos os registros de teste ao final e relatar o resultado.

## Detalhes técnicos

- Validação via navegador (Playwright) contra o app local, mais consultas de leitura no banco para conferir `clientes.credito_pendente`, `reman_orders.discount` e `reman_orders.total`.
- Cálculo verificado: `aplicar = Math.min(creditoPendente, totalAtual)` em `RemanPedidoDetalhe.tsx`; totais recalculados por `recomputeTotals` (`max(0, subtotal - discount)`).
- Nenhuma alteração de código ou de schema está prevista. Se o teste revelar um defeito, ele é reportado antes de qualquer correção.
