# Implementação de Deleção em Massa de Nós

## Funcionalidades Implementadas

### 1. Painel de Seleção Visual

#### A. Painel Central de Seleção
```typescript
{/* Selection Panel */}
{selectedNodes.size > 0 && (
  <Panel position="top-center" className="bg-blue-100 dark:bg-blue-900 rounded-lg shadow-lg border border-blue-300 dark:border-blue-700 m-4 p-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <CheckSquare className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">
            {selectedNodes.size} nó{selectedNodes.size > 1 ? 's' : ''} selecionado{selectedNodes.size > 1 ? 's' : ''}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-300">
            {(() => {
              const selectedNodesList = Array.from(selectedNodes);
              const agents = selectedNodesList.filter(id => nodes.find(n => n.id === id)?.type === 'agent').length;
              const tasks = selectedNodesList.filter(id => nodes.find(n => n.id === id)?.type === 'task').length;
              return `${agents} agente${agents > 1 ? 's' : ''} e ${tasks} tarefa${tasks > 1 ? 's' : ''}`;
            })()} • Pressione Delete ou clique em "Eliminar"
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={clearSelection} variant="outline" size="sm">
          <X className="h-3 w-3 mr-1" />
          Cancelar
        </Button>
        <Button onClick={deleteSelectedNodes} variant="destructive" size="sm">
          <Trash2 className="h-3 w-3 mr-1" />
          Eliminar ({selectedNodes.size})
        </Button>
      </div>
    </div>
  </Panel>
)}
```

### 2. Botões de Seleção Inteligente

#### A. Seleção por Tipo
```typescript
{/* Select All Button */}
{nodes.length > 0 && selectedNodes.size < nodes.length && (
  <div className="flex gap-1">
    {/* Selecionar Todos */}
    <Button
      onClick={() => {
        const allNodeIds = nodes.map(node => node.id);
        setSelectedNodes(new Set(allNodeIds));
        setSelectedNode(null);
        setIsInspectorOpen(false);
      }}
      variant="outline"
      size="sm"
      title="Selecionar todos os nós"
    >
      <CheckSquare className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
      <span className="hidden md:inline">Todos</span>
    </Button>
    
    {/* Selecionar Apenas Agentes */}
    {nodes.some(node => node.type === 'agent') && (
      <Button
        onClick={() => {
          const agentNodeIds = nodes.filter(node => node.type === 'agent').map(node => node.id);
          setSelectedNodes(new Set(agentNodeIds));
          setSelectedNode(null);
          setIsInspectorOpen(false);
        }}
        variant="outline"
        size="sm"
        title="Selecionar apenas agentes"
      >
        <Users className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
        <span className="hidden md:inline">Agentes</span>
      </Button>
    )}
    
    {/* Selecionar Apenas Tasks */}
    {nodes.some(node => node.type === 'task') && (
      <Button
        onClick={() => {
          const taskNodeIds = nodes.filter(node => node.type === 'task').map(node => node.id);
          setSelectedNodes(new Set(taskNodeIds));
          setSelectedNode(null);
          setIsInspectorOpen(false);
        }}
        variant="outline"
        size="sm"
        title="Selecionar apenas tasks"
      >
        <CheckSquare className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
        <span className="hidden md:inline">Tasks</span>
      </Button>
    )}
  </div>
)}
```

#### B. Botões de Controle
```typescript
{/* Clear Selection Button */}
{selectedNodes.size > 0 && (
  <Button
    onClick={() => {
      setSelectedNodes(new Set());
      setSelectedNode(null);
      setIsInspectorOpen(false);
    }}
    variant="outline"
    size="sm"
    title="Limpar seleção"
  >
    <X className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
    <span className="hidden md:inline">Limpar Seleção</span>
  </Button>
)}

{/* Delete Selected Nodes Button */}
{selectedNodes.size > 0 && (
  <Button
    onClick={deleteSelectedNodes}
    variant="destructive"
    size="sm"
    title={`Eliminar ${selectedNodes.size} nó${selectedNodes.size > 1 ? 's' : ''} selecionado${selectedNodes.size > 1 ? 's' : ''}`}
  >
    <Trash2 className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
    <span className="hidden md:inline">
      Eliminar ({selectedNodes.size})
    </span>
  </Button>
)}
```

### 3. Funcionalidades de Seleção

#### A. Seleção Múltipla com Ctrl/Cmd
```typescript
const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
  // Handle multi-selection with Ctrl/Cmd key
  if (event.ctrlKey || event.metaKey) {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id); // Remove from selection
      } else {
        newSet.add(node.id); // Add to selection
      }
      return newSet;
    });
  } else {
    setSelectedNode(node);
    setSelectedNodes(new Set([node.id]));
    // Only auto-open inspector on desktop
    if (window.innerWidth >= 1024) {
      setIsInspectorOpen(true);
    }
  }
}, []);
```

#### B. Atalhos de Teclado
```typescript
// Handle keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Delete selected nodes with Delete key
    if (event.key === 'Delete' && selectedNodes.size > 0) {
      event.preventDefault();
      deleteSelectedNodes();
    }
    
    // Clear selection with Escape key
    if (event.key === 'Escape') {
      setSelectedNodes(new Set());
      setSelectedNode(null);
      setIsInspectorOpen(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedNodes, deleteSelectedNodes]);
```

### 4. Função de Deleção em Massa

#### A. Deleção Inteligente
```typescript
const deleteSelectedNodes = useCallback(() => {
  if (selectedNodes.size === 0) return;

  const nodesToDelete = Array.from(selectedNodes);
  
  // Delete nodes from API if they have refId
  nodesToDelete.forEach(nodeId => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.data.refId) {
      const nodeType = node.type === 'agent' ? 'agent' : 'task';
      // Delete from API
      if (nodeType === 'agent') {
        apiClient.deleteAgent(String(node.data.refId)).catch(console.error);
      } else {
        apiClient.deleteTask(String(node.data.refId)).catch(console.error);
      }
    }
  });

  // Remove nodes from visual editor
  setNodes(prevNodes => prevNodes.filter(node => !selectedNodes.has(node.id)));
  
  // Remove edges connected to deleted nodes
  setEdges(prevEdges => prevEdges.filter(edge => 
    !selectedNodes.has(edge.source) && !selectedNodes.has(edge.target)
  ));

  // Clear selection
  setSelectedNodes(new Set());
  setSelectedNode(null);
  setIsInspectorOpen(false);

  toast({
    title: 'Nós eliminados',
    description: `${nodesToDelete.length} nó${nodesToDelete.length > 1 ? 's' : ''} e suas conexões foram removidos.`,
  });

  // Refresh data
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.agents(String(projectId)) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks(String(projectId)) });
  }
}, [selectedNodes, nodes, setNodes, setEdges, toast, projectId, queryClient]);
```

## Como Usar

### 1. Seleção Individual
```
1. Clique em um nó para selecioná-lo
2. Inspector abre automaticamente (desktop)
3. Painel de seleção aparece no topo
```

### 2. Seleção Múltipla Manual
```
1. Clique em um nó
2. Segure Ctrl (Windows/Linux) ou Cmd (Mac)
3. Clique em outros nós para adicionar à seleção
4. Clique novamente em nó selecionado para remover
```

### 3. Seleção em Massa
```
Opção 1: Botão "Todos" - seleciona todos os nós
Opção 2: Botão "Agentes" - seleciona apenas agentes
Opção 3: Botão "Tasks" - seleciona apenas tasks
```

### 4. Eliminação
```
Opção 1: Painel central - botão "Eliminar (X)"
Opção 2: Toolbar - botão "Eliminar (X)"
Opção 3: Tecla Delete
Opção 4: Botão "Limpar Editor" para tudo
```

### 5. Cancelar Seleção
```
Opção 1: Painel central - botão "Cancelar"
Opção 2: Toolbar - botão "Limpar Seleção"
Opção 3: Tecla Escape
Opção 4: Clique em área vazia
```

## Funcionalidades Técnicas

### 1. Interface Inteligente
- ✅ **Painel central**: Aparece quando há seleção
- ✅ **Informações detalhadas**: Mostra quantos agentes e tasks
- ✅ **Botões contextuais**: Aparecem quando necessário
- ✅ **Feedback visual**: Contadores e indicadores

### 2. Seleção Flexível
- ✅ **Por tipo**: Agentes, tasks ou todos
- ✅ **Manual**: Ctrl/Cmd + Click
- ✅ **Individual**: Click simples
- ✅ **Limpeza**: Escape ou botões

### 3. Deleção Robusta
- ✅ **API integrada**: Eliminação real no banco
- ✅ **Conexões**: Edges removidas automaticamente
- ✅ **Sincronização**: Dados atualizados
- ✅ **Feedback**: Toasts de confirmação

### 4. Atalhos Úteis
- ✅ **Delete**: Elimina seleção
- ✅ **Escape**: Limpa seleção
- ✅ **Ctrl/Cmd**: Seleção múltipla
- ✅ **Click**: Seleção individual

## Resultado Final

### ✅ Funcionalidades Implementadas
1. **Painel de seleção visual**: Centralizado e informativo
2. **Seleção por tipo**: Todos, agentes ou tasks
3. **Seleção múltipla**: Ctrl/Cmd + Click
4. **Deleção em massa**: Múltiplos nós de uma vez
5. **Atalhos de teclado**: Delete e Escape
6. **Interface inteligente**: Botões aparecem quando necessário
7. **Feedback detalhado**: Contadores e informações

### 🎯 Experiência do Usuário
- ✅ **Seleção intuitiva**: Botões claros e específicos
- ✅ **Deleção rápida**: Múltiplas opções
- ✅ **Feedback claro**: Painel informativo
- ✅ **Controle total**: Seleção individual ou em massa
- ✅ **Atalhos úteis**: Teclado e mouse

**Agora você tem controle total sobre a deleção de nós!** 🚀

**Pode selecionar todos os nós, apenas agentes, apenas tasks, ou selecionar manualmente com Ctrl/Cmd + Click, e eliminar tudo de uma vez com suas conexões.** ✨