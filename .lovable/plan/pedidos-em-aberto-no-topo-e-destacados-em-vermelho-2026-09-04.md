# Pedidos em aberto no topo e destacados em vermelho

## O que será feito
- Reordenar a lista da tela **Pedidos** para que pedidos com status `aberto` fiquem sempre no topo.
- Destacar visualmente cada linha de pedido em aberto com cor vermelha (texto e/ou fundo suave).
- Manter o filtro por número/cliente funcionando sobre a lista reordenada.

## Arquivos envolvidos
- `src/pages/Pedidos.tsx` — ordenação, destaque visual e ajustes na tabela.

## Detalhes técnicos
1. Ordenar `pedidosFiltrados` colocando itens com `status === "aberto"` antes dos demais, preservando a ordem original dentro de cada grupo.
2. Aplicar classes de destaque vermelho na linha (`tr`) e/ou no badge de status quando o pedido estiver aberto, respeitando o design system do projeto (sem cores hexadecimais hardcoded).
3. Garantir que a interação de clique, botões "Abrir" e "Deletar" continuem funcionando normalmente.

## Validação
- Typecheck (`bunx tsgo --noEmit -p tsconfig.json`).
- Verificar visualmente no preview que pedidos abertos aparecem primeiro e estão destacados em vermelho.
