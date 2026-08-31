# Plano: Sidebar com Auto-Hide e Expansão no Hover

## Objetivo
Deixar o dashboard mais limpo fazendo a sidebar recolher automaticamente por padrão. Ao aproximar o mouse da aba lateral (rail), a sidebar se expande suavemente; ao afastar, ela recolhe novamente.

## O que será alterado

### 1. Comportamento da sidebar
- Alterar `DashboardLayout` para iniciar a sidebar em modo **recolhido/offcanvas** por padrão (desktop).
- Trocar `collapsible="icon"` para `collapsible="offcanvas"` no componente `Sidebar`, para que, quando recolhida, a sidebar fique totalmente escondida e ocupe quase nenhum espaço horizontal.
- Inserir o componente `<SidebarRail />` do shadcn/ui como a "aba" sensível ao mouse na borda esquerda.

### 2. Expansão automática no hover
- Adicionar estado local `isHovering` no `DashboardLayoutContent`.
- Implementar eventos `onMouseEnter`/`onMouseLeave` na área da sidebar + rail para expandir e recolher.
- Usar um pequeno delay (ex: 200-300 ms) no mouseleave para evitar piscar quando o mouse cruza rapidamente.
- A expansão por hover deve ser independente do estado salvo no `localStorage`, mas respeitar o toggle manual (botão do cabeçalho) enquanto o mouse não estiver sobre a sidebar.

### 3. Ajustes de layout
- Garantir que o `SidebarInset` (conteúdo principal) ocupe toda a larguta disponível quando a sidebar estiver recolhida.
- Preservar a funcionalidade de redimensionamento da sidebar quando ela estiver expandida.
- Manter o comportamento mobile atual (sheet/bottom sheet), sem auto-hide.

### 4. Persistência
- Continuar respeitando a preferência de largura salva em `localStorage`.
- O estado de aberto/fechado passa a ser controlado principalmente pelo hover, mas o botão de toggle ainda funciona para "travar" a sidebar aberta se desejado.

## Arquivos envolvidos
- `src/components/DashboardLayout.tsx` — lógica de hover, estado e renderização da sidebar.
- `src/components/ui/sidebar.tsx` — ajustes pontuais se necessário (provavelmente nenhuma alteração, apenas uso do `SidebarRail`).
- `src/styles.css` — classes utilitárias de transição, se necessário.

## Critério de aceitação
- Ao carregar a tela em desktop, a sidebar aparece recolhida (apenas uma aba fina na esquerda).
- Ao passar o mouse sobre a aba, a sidebar desliza para a direita, expandida.
- Ao retirar o mouse, a sidebar recolhe de volta após breve delay.
- O botão de toggle no cabeçalho ainda permite abrir/fechar manualmente.
- O redimensionamento continua funcionando quando expandido.
- Mobile permanece com o menu hambúrguer/sheet atual.
