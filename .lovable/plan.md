# Busca prática de modelo no modal de cartucho

## Problema
No modal "Adicionar/Editar Cartucho" (dentro do pedido), o campo **Modelo Cadastrado** é um Select comum: ao abrir, lista todos os modelos e não dá para digitar para filtrar — a busca fica ruim com muitos cadastros.

## Solução
Substituir o Select por um **campo de busca com digitação (combobox)**, usando os componentes `Command` + `Popover` já existentes no projeto (sem instalar nada novo):

1. O campo vira um botão que mostra o modelo selecionado (ex.: "EPS 662 BK REMAN - EPS 662 PRETO...").
2. Ao clicar, abre um popover com **caixa de texto no topo**: basta digitar o número/modelo (ex.: "662") e a lista filtra na hora, procurando tanto em `modelo02` (código) quanto em `modelo01` (descrição), ignorando acentos e maiúsculas.
3. Ao clicar no item, seleciona e fecha. O botão "+" de criar novo modelo continua ao lado, sem alteração.
4. Nada muda na gravação, nas regras ou nas demais telas — apenas a forma de escolher o modelo.

## Arquivos
- `src/components/ModalCartucho.tsx` — troca do Select de modelo pelo combobox com busca (único arquivo alterado).

## Observação
Ajuste simples de frontend, bem dentro de 0,70 créditos. Não altera nada que já funciona (salvar, pesos, responsável, etc.).
