# Plan: Sidebar com Mini-Variante no Recolhimento Automático

## Objetivo
Alterar o comportamento de recolhimento automático da sidebar para que, ao invés de sumir totalmente (offcanvas), ela fique em modo compacto exibindo apenas os ícones dos itens de menu.

## Alterações propostas

1. **Mudar o modo de recolhimento**
   - Substituir `collapsible="offcanvas"` por `collapsible="icon"` no componente `Sidebar` de `src/components/DashboardLayout.tsx`.
   - Com isso, a sidebar recolhida ocupará uma faixa estreita (mini variant) mostrando apenas os ícones, em vez de desaparecer completamente.

2. **Ajustar o estado de abertura padrão**
   - Manter a opção de iniciar recolhida para deixar a tela limpa, mas agora ela será apenas mini (ícones visíveis), não oculta.
   - Preservar a persistência do estado expandido/retraído no `localStorage`.

3. **Manter a expansão automática no hover**
   - Ao passar o mouse sobre a sidebar mini, ela se expande para a largura completa mostrando ícones + labels.
   - Ao retirar o mouse, após o delay configurado, ela volta ao modo mini.
   - Preservar o botão de pinagem/fixar para manter a sidebar expandida permanentemente.

4. **Ajustar o layout do conteúdo**
   - Garantir que o `SidebarInset` e o conteúdo principal se adaptem à nova largura mini da sidebar.
   - Verificar se o redimensionamento manual continua funcionando quando expandida.

5. **Verificar visuais**
   - Confirmar que o avatar/rodapé da sidebar fique adequado no modo mini.
   - Confirmar que tooltips ou labels não fiquem truncados de forma estranha.

## Validação
- Testar no preview desktop: sidebar inicia mostrando apenas ícones, hover expande, saída do mouse recolhe para ícones.
- Testar pinagem para fixar expandido.
- Testar mobile para garantir que não houve regressão.
