# Funcionalidades de Eliminação de Nós

## Problemas Resolvidos

### 1. Erro de Importação
- **Problema**: `Sparkles is not defined` ao recarregar página
- **Solução**: Adicionado `Sparkles`, `Trash2`, `X` aos imports do lucide-react

### 2. Eliminação Individual vs Múltipla
- **Problema**: Usuário tinha que eliminar nós um por um
- **Solução**: Sistema de seleção múltipla com eliminação em lote

## Funcionalidades Implementadas

### 1. Seleção Múltipla de Nós

#### A. Seleção com Ctrl/Cmd + Click
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

#### B. Estado de Seleção
```typescript
const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
```

### 2. Eliminação de Nós Selecionados

#### A. Função de Eliminação
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

#### B. Eliminação Completa do Editor
```typescript
const clearAllNodes = useCallback(() => {
  if (nodes.length === 0) return;

  // Delete all nodes from API
  nodes.forEach(node => {
    if (node.data.refId) {
      const nodeType = node.type === 'agent' ? 'agent' : 'task';
      if (nodeType === 'agent') {
        apiClient.deleteAgent(String(node.data.refId)).catch(console.error);
      } else {
        apiClient.deleteTask(String(node.data.refId)).catch(console.error);
      }
    }
  });

  // Clear visual editor
  setNodes([]);
  setEdges([]);
  setCurrentExecution(null);
  setRunningNodes(new Set());
  setSelectedNodes(new Set());
  setSelectedNode(null);
  setIsInspectorOpen(false);

  toast({
    title: 'Editor limpo',
    description: 'Todos os workflows foram removidos do editor.',
  });

  // Refresh data
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.agents(String(projectId)) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks(String(projectId)) });
  }
}, [nodes, setNodes, setEdges, toast, projectId, queryClient]);
```

### 3. Interface de Eliminação

#### A. Botão de Eliminação Dinâmico
```typescript
{/* Delete Selected Nodes Button */}
{selectedNodes.size > 0 && (
  <Button
    onClick={deleteSelectedNodes}
    variant="destructive"
    size="sm"
    title={`Eliminar ${selectedNodes.size} nó${selectedNodes.size > 1 ? 's' : ''} selecionado${selectedNodes.size > 1 ? 's' : ''}`}
    className="text-xs md:text-sm"
  >
    <Trash2 className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
    <span className="hidden md:inline">
      Eliminar ({selectedNodes.size})
    </span>
  </Button>
)}
```

#### B. Botão Limpar Editor Melhorado
```typescript
<Button
  onClick={clearAllNodes}
  variant="outline"
  size="sm"
  title="Limpar editor"
  className="text-xs md:text-sm"
  disabled={nodes.length === 0}
>
  <RotateCcw className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
  <span className="hidden md:inline">Limpar Editor</span>
</Button>
```

### 4. Atalhos de Teclado

#### A. Tecla Delete
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

### 5. Debug e Monitoramento

#### A. Painel de Debug Atualizado
```typescript
{process.env.NODE_ENV === 'development' && (
  <Panel position="top-center" className="bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow-lg border border-yellow-300 dark:border-yellow-700 m-4 p-2">
    <div className="text-xs text-yellow-800 dark:text-yellow-200">
      <div>Agents: {agents.length} | Tasks: {tasks.length}</div>
      <div>Nodes: {nodes.length} | Edges: {edges.length}</div>
      <div>Running: {runningNodes.size} | Execution: {currentExecution?.status || 'none'}</div>
      <div>Selected: {selectedNodes.size} | Inspector: {isInspectorOpen ? 'Open' : 'Closed'}</div>
    </div>
  </Panel>
)}
```

## Como Usar

### 1. Seleção Individual
```
1. Clique em um nó para selecioná-lo
2. Inspector abre automaticamente (desktop)
3. Nó fica destacado visualmente
```

### 2. Seleção Múltipla
```
1. Clique em um nó para selecionar
2. Segure Ctrl (Windows/Linux) ou Cmd (Mac)
3. Clique em outros nós para adicionar à seleção
4. Clique novamente em nó selecionado para remover da seleção
```

### 3. Eliminação de Nós Selecionados
```
Opção 1: Botão "Eliminar (X)" aparece quando há nós selecionados
Opção 2: Pressione tecla Delete
Opção 3: Use botão "Limpar Editor" para eliminar tudo
```

### 4. Limpeza de Seleção
```
1. Pressione tecla Escape
2. Clique em área vazia do editor
3. Selecione outros nós
```

## Funcionalidades Técnicas

### 1. Sincronização API ↔ Visual
- ✅ Eliminação na API remove do banco de dados
- ✅ Eliminação visual remove da interface
- ✅ Conexões são removidas automaticamente
- ✅ Dados são atualizados via query invalidation

### 2. Gestão de Estado
- ✅ Estado de seleção múltipla
- ✅ Limpeza automática de seleção
- ✅ Fechamento de inspector ao eliminar
- ✅ Atualização de contadores

### 3. Feedback Visual
- ✅ Botão aparece apenas quando há seleção
- ✅ Contador de nós selecionados
- ✅ Toast com confirmação
- ✅ Botões desabilitados quando apropriado

### 4. Atalhos de Teclado
- ✅ Delete: Elimina nós selecionados
- ✅ Escape: Limpa seleção
- ✅ Ctrl/Cmd + Click: Seleção múltipla

## Resultado Final

### ✅ Funcionalidades Implementadas
1. **Seleção múltipla**: Ctrl/Cmd + Click
2. **Eliminação em lote**: Botão dinâmico + tecla Delete
3. **Limpeza completa**: Botão "Limpar Editor"
4. **Atalhos de teclado**: Delete e Escape
5. **Sincronização API**: Eliminação real no banco
6. **Feedback visual**: Contadores e toasts
7. **Debug melhorado**: Painel com informações de seleção

### 🎯 Experiência do Usuário
- ✅ **Seleção intuitiva**: Ctrl/Cmd + Click
- ✅ **Eliminação rápida**: Tecla Delete ou botão
- ✅ **Feedback claro**: Contadores e confirmações
- ✅ **Controle total**: Limpeza individual ou completa
- ✅ **Atalhos úteis**: Escape para limpar seleção

**O sistema de eliminação de nós agora é completo e intuitivo!** 🚀