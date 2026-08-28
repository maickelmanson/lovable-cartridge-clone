# Plano: Impressão de duas vias em A4 paisagem

## Objetivo
Alterar o layout de impressão do pedido de remanufatura (`src/pages/RemanPedidoImpressao.tsx`) para que as duas vias sejam impressas em uma folha A4 na orientação **paisagem** (horizontal), uma via na metade esquerda e outra na metade direita, mantendo a linha de corte pontilhada no centro.

## Escopo
- Apenas o arquivo `src/pages/RemanPedidoImpressao.tsx`.
- Nenhuma alteração visual fora da tela de impressão.
- Nenhuma mudança em dados/backend.

## Passos

1. **Orientação da página para paisagem**
   - Alterar `@page { size: A4 portrait; }` para `@page { size: A4 landscape; }`.
   - Alterar a configuração do `jsPDF` no exportador PDF de `orientation: "portrait"` para `orientation: "landscape"`.

2. **Redimensionar o container de impressão**
   - Ajustar `.print-doc` para `width: 297mm` (largura do A4 paisagem).
   - Manter padding reduzido (ex.: `4mm`) para aproveitar o espaço.

3. **Redimensionar as colunas das vias**
   - Cada via deve ocupar aproximadamente metade da largura útil (`~145mm`).
   - Ajustar `.via-col` para `width: 145mm; max-width: 145mm`.
   - Manter `page-break-inside: avoid` para evitar quebras indesejadas.

4. **Ajustar a linha de corte**
   - Manter a linha pontilhada vertical no centro.
   - Ajustar `.cut-line` para `min-height: ~200mm` (altura útil do A4 paisagem) e `align-self: stretch`.

5. **Ajustar fontes e espaçamentos**
   - Aproveitar a maior largura horizontal para evitar quebras de linha desnecessárias.
   - Revisar tamanhos de fonte do cabeçalho, tabelas e rodapé para garantir legibilidade na nova proporção.

6. **Validação visual**
   - Usar o preview do Lovable para simular a impressão e confirmar que as duas vias ficam corretamente dispostas na horizontal.
   - Se necessário, ajustar margens e larguras com base no resultado visual.

## Fora de escopo
- Alterações no conteúdo das vias (campos, tabelas, textos).
- Alterações em outros arquivos do sistema.
- Mudanças no backend ou banco de dados.
