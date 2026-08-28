# Ajuste no cabeçalho/rodapé da impressão de remanufatura

## Objetivo
Corrigir a exibição do nome da empresa na impressão do pedido de remanufatura: manter o nome no cabeçalho e removê-lo do rodapé, conforme indicação na imagem.

## Alterações

### 1. Restaurar nome da empresa no cabeçalho
- No arquivo `src/pages/RemanPedidoImpressao.tsx`, restaurar a linha `<h1>` com o nome da empresa (`empresa?.empresa`) no cabeçalho da via de impressão.

### 2. Remover nome da empresa do rodapé
- No mesmo arquivo, alterar o rodapé para exibir apenas:
  `documento gerado em <data> às <hora>`
- Remover o prefixo `{empresa?.empresa} — `.

## Validação
- Executar `tsgo` para garantir que não há erros de tipo.
- Verificar visualmente o preview da impressão.

## Sincronização
- Após a validação, as alterações serão sincronizadas automaticamente com o GitHub pelo Lovable.
