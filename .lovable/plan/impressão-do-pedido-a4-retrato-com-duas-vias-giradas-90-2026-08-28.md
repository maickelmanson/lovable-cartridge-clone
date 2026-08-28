# Impressão do pedido: A4 retrato com duas vias giradas 90°

## Objetivo
Reproduzir exatamente o formato circulado em azul na foto: folha A4 **retrato** (210 × 297 mm) dividida ao meio por uma linha de corte horizontal, com **duas vias idênticas** (metades de 210 × 148,5 mm) e o conteúdo de cada via **rotacionado 90° no sentido horário**. O formato atual (duas colunas estreitas lado a lado, marcado com X vermelho) é descartado.

## Layout alvo

```text
+----------------------------------+  <- A4 retrato, 210mm
|  [ VIA 1 - conteúdo girado 90° ] |     210 x 148.5mm
|                                  |
+- - - - - linha de corte - - - - -+
|  [ VIA 2 - conteúdo girado 90° ] |     210 x 148.5mm
|                                  |
+----------------------------------+
```

Dentro de cada metade, o conteúdo é renderizado em modo paisagem lógico (148,5 mm de "largura" da folha × 210 mm de "altura" do bloco) e girado, de modo que o cabeçalho do pedido fique encostado no lado esquerdo da folha física.

## Alterações (apenas `src/pages/RemanPedidoImpressao.tsx`)

1. **Estrutura**: substituir o container `.vias` de duas colunas (`flex-row`) por duas metades empilhadas (`.via-half`), com uma linha de corte tracejada horizontal entre elas.
2. **Rotação**: cada `.via-half` recebe um wrapper interno com
   `width: 210mm; height: 148.5mm; transform: rotate(90deg)` e `transform-origin` calculado, para que o bloco de 148,5 × 210 mm caiba exatamente na metade.
3. **Página**: `@page { size: A4 portrait; margin: 0; }`; `html, body` sem margem; `box-sizing: border-box` e padding rígido no container para garantir **uma única página**, sem quebra.
4. **Dimensionamento do conteúdo**: a via passa a preencher toda a metade — largura útil ~200 mm (no eixo girado) e altura ~143 mm; fontes e tabelas ajustadas para ocupar o espaço sem estourar (tabelas `width: 100%`, fonte base ~9–10 px com ajuste conforme sobra/estouro).
5. **Ordem do conteúdo** (mantida, agora em paisagem):
   - Topo: logo + nome da empresa, CNPJ, WhatsApp, endereço, data e número do pedido
   - Dados do Cliente (Nome/Razão Social, Endereço, Telefone 1 e 2)
   - Tabela de itens (Produto/Modelo, Qtd, Preço, Total) + total e desconto
   - Blocos Cartuchos Funcionando / Garantia / Com Problema (Modelo, Código, Peso de Saída ou Defeito)
   - Rodapé com observação geral e espaço de assinatura
6. **Exportar PDF**: `jsPDF` volta para `orientation: "portrait"`, formato A4, para bater com o layout impresso.
7. **Sem alterações** em dados, backend, tRPC ou em outras telas.

## Validação
Renderizar a rota de impressão de um pedido real no preview e conferir por captura: uma única página A4 retrato, duas vias iguais giradas, linha de corte no centro, nada cortado nem transbordando.
