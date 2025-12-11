# Canvas Toolbar - Plano de Implementacao

## Objetivo

Criar uma barra de acoes lateral no canvas de automacao, similar a interface do Railway, com icones colapsados que expandem em um dropdown com opcoes.

## Referencia Visual

A toolbar deve ter:
1. **Estado colapsado**: Barra vertical com icones (grid, +, -, fullscreen, undo, redo)
2. **Estado expandido**: Ao clicar no icone de menu/grid, abre dropdown com opcoes

## Funcionalidades

### Icones Principais (sempre visiveis)
- Grid/Menu (abre dropdown)
- Zoom In (+)
- Zoom Out (-)
- Fit View (fullscreen)
- Undo (seta para esquerda)
- Redo (seta para direita)

### Opcoes do Dropdown
1. **Hide/Show Connections** - Toggle para esconder/mostrar as linhas (edges) entre nos
2. **Auto Layout** - Reorganiza os nos automaticamente usando algoritmo dagre
3. **Reset Canvas** - Reseta zoom e posicao para o estado inicial (fitView)

## Arquitetura

### Arquivos a criar/modificar

1. **Novo**: `ui/canvas-toolbar.tsx` - Componente da toolbar
2. **Modificar**: `ui/automation-canvas.tsx` - Integrar toolbar e adicionar estados

### Dependencias

- `@dagrejs/dagre` - Para auto layout (verificar se ja existe no projeto)
- Componentes shadcn: `Button`, `DropdownMenu`, `Separator`
- Icones lucide: `LayoutGrid`, `Plus`, `Minus`, `Maximize`, `Undo2`, `Redo2`, `Cable`, `LayoutDashboard`, `RotateCcw`

## Estrutura do Componente

```tsx
// canvas-toolbar.tsx
type CanvasToolbarProps = {
   showConnections: boolean;
   onToggleConnections: () => void;
   onAutoLayout: () => void;
   onResetCanvas: () => void;
};

export function CanvasToolbar({ ... }: CanvasToolbarProps) {
   // Usa Panel do React Flow para posicionar
   // Renderiza barra vertical com icones
   // Dropdown no icone de menu
}
```

## Implementacao do Auto Layout

Usar dagre para calcular posicoes automaticas:

```tsx
import Dagre from "@dagrejs/dagre";

function getAutoLayoutedElements(nodes, edges) {
   const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
   g.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 100 });

   nodes.forEach((node) => {
      g.setNode(node.id, { width: 280, height: 150 });
   });

   edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
   });

   Dagre.layout(g);

   return nodes.map((node) => {
      const position = g.node(node.id);
      return { ...node, position: { x: position.x, y: position.y } };
   });
}
```

## Posicionamento

- Toolbar: `top-left` no Panel do React Flow
- ZoomSlider existente: manter em `bottom-left` ou integrar na toolbar

## Estilos

Baseado na referencia do Railway:
- Background escuro com transparencia
- Bordas arredondadas
- Icones em cinza claro
- Hover com destaque
- Separadores sutis entre grupos de icones

## Checklist

- [ ] Criar componente CanvasToolbar
- [ ] Implementar dropdown menu
- [ ] Implementar toggle de connections (hide/show edges)
- [ ] Instalar/verificar dagre
- [ ] Implementar auto layout
- [ ] Implementar reset canvas
- [ ] Integrar no AutomationCanvas
- [ ] Adicionar estados necessarios (showConnections, etc)
- [ ] Testar todas funcionalidades
- [ ] Ajustar estilos para match com design system
