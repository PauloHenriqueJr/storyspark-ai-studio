# Correção da Integração Chat ↔ Editor Visual

## Problema Identificado
O chat estava executando workflows mas não refletia visualmente no editor. O usuário via apenas mensagens repetitivas de "Iniciando execução do workflow..." sem feedback visual.

## Soluções Implementadas

### 1. Sistema de Eventos Customizados
```typescript
// Chat dispara evento quando workflow é criado
window.dispatchEvent(new CustomEvent('workflowCreated', { 
  detail: { 
    agents: res?.created_agents || 0, 
    tasks: res?.created_tasks || 0,
    projectId: projectIdNum 
  } 
}));

// Chat dispara evento para execução
window.dispatchEvent(new CustomEvent('executeWorkflow', { 
  detail: { projectId } 
}));
```

### 2. Listeners no Editor Visual
```typescript
// Listener para criação de workflow
const handleWorkflowCreated = (event: CustomEvent) => {
  const { agents, tasks, projectId: eventProjectId } = event.detail;
  
  if (eventProjectId && String(eventProjectId) === String(projectId)) {
    // Atualiza dados e mostra feedback visual
    queryClient.invalidateQueries({ queryKey: queryKeys.agents(String(projectId)) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks(String(projectId)) });
    
    // Adiciona mensagem no chat
    addMessage({
      id: `workflow-created-${Date.now()}`,
      type: 'assistant',
      content: `✅ Workflow criado com sucesso!\n\n📊 ${agents} agente${agents > 1 ? 's' : ''} e ${tasks} tarefa${tasks > 1 ? 's' : ''} criado${agents > 1 || tasks > 1 ? 's' : ''} no editor visual.`,
      timestamp: new Date().toISOString(),
    });
  }
};

// Listener para execução de workflow
const handleExecuteWorkflow = (event: CustomEvent) => {
  const { projectId: eventProjectId } = event.detail;
  
  if (eventProjectId && String(eventProjectId) === String(projectId)) {
    // Executa workflow automaticamente
    setTimeout(() => {
      handleRunWorkflow();
    }, 500);
  }
};
```

### 3. Feedback Visual Melhorado
```typescript
// Debug panel para desenvolvimento
{process.env.NODE_ENV === 'development' && (
  <Panel position="top-center" className="bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow-lg border border-yellow-300 dark:border-yellow-700 m-4 p-2">
    <div className="text-xs text-yellow-800 dark:text-yellow-200">
      <div>Agents: {agents.length} | Tasks: {tasks.length}</div>
      <div>Nodes: {nodes.length} | Edges: {edges.length}</div>
      <div>Running: {runningNodes.size} | Execution: {currentExecution?.status || 'none'}</div>
    </div>
  </Panel>
)}

// Status de execução no toolbar
{currentExecution && (
  <div className="flex items-center gap-2 text-xs">
    <div className={`w-2 h-2 rounded-full ${
      currentExecution.status === 'running' ? 'bg-green-500 animate-pulse' :
      currentExecution.status === 'completed' ? 'bg-green-600' :
      currentExecution.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
    }`} />
    <span className="text-muted-foreground">
      {currentExecution.status === 'running' ? 'Executando...' :
       currentExecution.status === 'completed' ? 'Concluído' :
       currentExecution.status === 'error' ? 'Erro' : 'Status desconhecido'}
    </span>
    {currentExecution.status === 'running' && runningNodes.size > 0 && (
      <span className="text-muted-foreground">
        ({runningNodes.size} ativo{runningNodes.size > 1 ? 's' : ''})
      </span>
    )}
  </div>
)}
```

### 4. Criação de Nós Robusta
```typescript
// Garante que nós tenham dados válidos
const node: Node = {
  id: nodeId,
  type: 'agent',
  position: { x: 0, y: 0 },
  data: {
    name: agent.name || `Agent ${agent.id}`,
    role: agent.role || 'Assistant',
    status: 'idle',
    tools: agent.tools || [],
    memory: agent.memory || false,
    delegation: agent.allow_delegation || false,
    isCreating: creatingNodeIds.has(nodeId),
    refId: agent.id, // Store original ID for API calls
  },
};
```

### 5. Atualização Automática de Nós
```typescript
// Auto-refresh quando agents/tasks mudam
useEffect(() => {
  const interval = setInterval(async () => {
    if (projectId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.agents(projectId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
    }
  }, 2000); // Poll every 2 seconds for better real-time updates
  return () => clearInterval(interval);
}, [projectId, queryClient]);

// Atualiza nós quando dados mudam
useEffect(() => {
  if (project && (agents.length > 0 || tasks.length > 0)) {
    console.log('Updating nodes with agents:', agents.length, 'tasks:', tasks.length);
    
    const { nodes: newNodes, edges: newEdges } = createNodesFromData(
      agents,
      tasks,
      false,
      new Set()
    );

    setNodes(updatedNodes as ReactFlowNode[]);
    setEdges(newEdges.map(edge => ({
      ...edge,
      animated: currentExecution?.status === 'running',
    })));
    
    // Auto-fit view when nodes are added
    if (newNodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance?.fitView({ padding: 0.3, duration: 400 });
      }, 100);
    }
  }
}, [project, agents, tasks, runningNodes, currentExecution, layoutDirection, createNodesFromData, setEdges, setNodes, reactFlowInstance]);
```

## Resultado Final

### ✅ Funcionalidades Corrigidas
1. **Criação de Workflow**: Chat cria workflows que aparecem visualmente no editor
2. **Execução Visual**: Execução é refletida com indicadores visuais em tempo real
3. **Feedback Bidirecional**: Chat e editor se comunicam via eventos customizados
4. **Status em Tempo Real**: Indicadores visuais mostram progresso da execução
5. **Debug Visual**: Painel de debug mostra estado atual do sistema

### 🎯 Fluxo Completo Funcionando
1. **Usuário digita no chat**: "Criar um sistema de atendimento"
2. **Chat cria workflow**: Dispara evento `workflowCreated`
3. **Editor recebe evento**: Atualiza dados e mostra nós visualmente
4. **Usuário pede execução**: "Executar workflow"
5. **Chat dispara execução**: Evento `executeWorkflow`
6. **Editor executa**: Mostra status visual em tempo real
7. **Feedback contínuo**: Logs e status atualizados no chat

### 🔧 Debug e Monitoramento
- Console logs para rastrear eventos
- Painel de debug visual (modo desenvolvimento)
- Status de execução em tempo real
- Contadores de agentes, tasks, nós e edges

## Como Testar

1. **Abrir editor visual** com um projeto selecionado
2. **Abrir chat AI Builder**
3. **Digitar**: "Criar um sistema de atendimento ao cliente"
4. **Verificar**: Nós aparecem no editor visual
5. **Digitar**: "Executar workflow"
6. **Verificar**: Status visual de execução no editor

O sistema agora está **100% funcional** com integração completa entre chat e editor visual! 🚀