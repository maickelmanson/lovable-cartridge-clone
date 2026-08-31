# Resumo do pedido em uma única linha compacta

Hoje o detalhe do pedido mostra três cards grandes (Status, Data de Criação, Cartuchos), cada um com `p-6` e texto em duas linhas, ocupando bastante altura. A proposta é reduzir tudo para uma barra de uma linha só, com as informações distribuídas horizontalmente.

## O que será feito

1. **Substituir os 3 cards por uma barra única**
   - Um único `Card` com padding reduzido (`py-3 px-4` aproximadamente).
   - Layout em flex com divisão equilibrada: **Status: Aberto** | **Data de Criação: 31/08/2026** | **Cartuchos: 1**.
   - Formato "rótulo + valor" na mesma linha (rótulo menor e cinza, valor em negrito ao lado).
   - Status mantém a cor atual (azul para Aberto, verde para Finalizado).

2. **Responsividade**
   - Em telas estreitas (celular), a barra quebra para empilhar os itens sem cortar texto.

3. **Sem mudanças em dados ou lógica**
   - Apenas apresentação em `src/pages/PedidoDetalhe.tsx` (linhas 308-324). Nada no banco, nas queries ou nos demais cards (Observação geral e Cartuchos do Pedido permanecem como estão).

## Detalhes técnicos

- `src/pages/PedidoDetalhe.tsx`: substituir o bloco `grid grid-cols-3 gap-4` com os três `<Card className="p-6">` por um único card compacto usando flex (`flex flex-wrap items-center justify-between` com `min-w-0`/`shrink-0` conforme necessário), mantendo os mesmos valores exibidos.
