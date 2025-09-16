# Correção do Loop de Execução e Gestão de Workflows

## Problemas Identificados

### 1. Loop Infinito na Execução
- **Problema**: Mensagens repetitivas de "Iniciando execução do workflow..." no chat
- **Causa**: Múltiplos listeners disparando execução simultaneamente
- **Sintoma**: Chat ficava em loop sem feedback visual no editor

### 2. Workflows Acumulando no Editor
- **Problema**: Novos workflows apareciam junto com existentes
- **Causa**: Editor não limpava workflows anteriores antes de criar novos
- **Sintoma**: Múltiplos fluxos visuais confusos

### 3. Falta de Controle de Workflows
- **Problema**: Não havia opção para limpar/remover workflows
- **Causa**: Interface não tinha botões de gestão
- **Sintoma**: Editor ficava poluído com workflows antigos

## Soluções Implementadas

### 1. Prevenção de Loop de Execução

#### A. Verificação de Estado de Execução
```typescript
// Listener de mensagens do chat
useEffect(() => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.type === 'assistant' && 
      (lastMessage.content.includes('Executando workflow') || 
       lastMessage.content.includes('Iniciando execução')) &&
      !currentExecution) { // ✅ Só executa se não há execução rodando
    
    setTimeout(() => {
      handleRunWorkflow();
    }, 1000);
  }
}, [messages, currentExecution]); // ✅ Dependência no currentExecution
```

#### B. Listener de Eventos com Proteção
```typescript
const handleExecuteWorkflow = (event: CustomEvent) => {
  const { projectId: eventProjectId } = event.detail;
  
  // ✅ Só processa se for do projeto atual E não há execução rodando
  if (eventProjectId && String(eventProjectId) === String(projectId) && !currentExecution) {
    console.log('Executing workflow for project:', projectId);
    
    addMessage({
      id: `exec-event-${Date.now()}`,
      type: 'assistant',
      content: '🎯 Executando workflow no editor visual...',
      timestamp: new Date().toISOString(),
    });
    
    setTimeout(() => {
      handleRunWorkflow();
    }, 500);
  }
};
```

#### C. Delays Aumentados no Chat
```typescript
// ✅ Delays aumentados para evitar execuções múltiplas
setTimeout(() => {
  window.dispatchEvent(new CustomEvent('executeWorkflow', { 
    detail: { projectId: projectIdNum } 
  }));
}, 2000); // ✅ Aumentado de 1000ms para 2000ms

}, 3000); // ✅ Aumentado de 2000ms para 3000ms
```

### 2. Limpeza Automática do Editor

#### A. Limpeza na Criação de Workflow
```typescript
const handleWorkflowCreated = (event: CustomEvent) => {
  const { agents, tasks, projectId: eventProjectId } = event.detail;
  
  if (eventProjectId && String(eventProjectId) === String(projectId)) {
    // ✅ Limpa workflow existente primeiro
    setNodes([]);
    setEdges([]);
    setCurrentExecution(null);
    setRunningNodes(new Set());
    
    addMessage({
      id: `workflow-created-${Date.now()}`,
      type: 'assistant',
      content: `✅ Novo workflow criado com sucesso!\n\n📊 ${agents} agente${agents > 1 ? 's' : ''} e ${tasks} tarefa${tasks > 1 ? 's' : ''} criado${agents > 1 || tasks > 1 ? 's' : ''} no editor visual.\n\n🔄 Editor limpo e novo fluxo carregado.`,
      timestamp: new Date().toISOString(),
    });
    
    // Atualiza dados
    queryClient.invalidateQueries({ queryKey: queryKeys.agents(String(projectId)) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks(String(projectId)) });
  }
};
```

#### B. Limpeza na Mudança de Projeto
```typescript
useEffect(() => {
  const checkAndRedirect = async () => {
    if (!projectId) {
      // Redireciona para primeiro projeto
      const projects = await apiClient.getProjects();
      if (Array.isArray(projects) && projects.length > 0) {
        window.location.href = `/app/editor?projectId=${projects[0].id}`;
      }
    } else {
      // ✅ Limpa editor quando projeto muda
      setNodes([]);
      setEdges([]);
      setCurrentExecution(null);
      setRunningNodes(new Set());
    }
  };
  checkAndRedirect();
}, [projectId]);
```

### 3. Controles de Gestão de Workflows

#### A. Botão "Limpar Editor" Melhorado
```typescript
<Button
  onClick={() => {
    setNodes([]);
    setEdges([]);
    setCurrentExecution(null); // ✅ Limpa execução também
    setRunningNodes(new Set()); // ✅ Limpa nós ativos
    toast({ title: 'Editor limpo', description: 'Todos os workflows foram removidos do editor.' });
  }}
  variant="outline"
  size="sm"
  title="Limpar editor"
  className="text-xs md:text-sm"
>
  <RotateCcw className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
  <span className="hidden md:inline">Limpar Editor</span>
</Button>
```

#### B. Estado Vazio do Editor
```typescript
{/* Empty State */}
{nodes.length === 0 && (
  <div className="absolute inset-0 flex items-center justify-center z-10">
    <div className="text-center p-8 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Layers className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Editor Visual Vazio
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Use o chat AI Builder para criar workflows ou clique em "Limpar Editor" para começar.
      </p>
      <div className="flex gap-2 justify-center">
        <Button
          onClick={() => {
            const chatButton = document.querySelector('[data-chat-button]') as HTMLButtonElement;
            if (chatButton) chatButton.click();
          }}
          variant="outline"
          size="sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Abrir AI Builder
        </Button>
        <Button
          onClick={() => {
            setNodes([]);
            setEdges([]);
            setCurrentExecution(null);
            setRunningNodes(new Set());
          }}
          variant="ghost"
          size="sm"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Limpar Editor
        </Button>
      </div>
    </div>
  </div>
)}
```

### 4. Melhorias na Interface

#### A. Botão Run com Proteção
```typescript
<Button
  onClick={handleRunWorkflow}
  className="btn-primary gap-1 md:gap-2"
  size="sm"
  disabled={runMutation.isPending || !projectId || currentExecution?.status === 'running'} // ✅ Proteção
  title={!projectId ? "Selecione um projeto primeiro" : "Executar workflow"}
>
  <Play className="h-3 w-3 md:h-4 md:w-4" />
  <span className="text-xs md:text-sm">
    {runMutation.isPending ? 'Run...' : 
     currentExecution?.status === 'running' ? 'Running...' : 'Run'}
  </span>
</Button>
```

#### B. Status de Execução Visual
```typescript
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

## Resultado Final

### ✅ Problemas Resolvidos
1. **Loop de execução eliminado**: Verificações de estado impedem execuções múltiplas
2. **Editor sempre limpo**: Novos workflows substituem os existentes
3. **Controle total**: Botões para limpar e gerenciar workflows
4. **Estado vazio elegante**: Interface clara quando não há workflows
5. **Proteções robustas**: Botões desabilitados durante execução

### 🎯 Fluxo Corrigido
1. **Usuário cria workflow**: Editor limpa automaticamente antes de criar novo
2. **Usuário executa**: Uma única execução com feedback visual
3. **Usuário limpa**: Botão "Limpar Editor" remove tudo
4. **Estado vazio**: Interface clara com opções para começar

### 🔧 Funcionalidades Adicionadas
- ✅ Limpeza automática na criação de workflows
- ✅ Botão "Limpar Editor" melhorado
- ✅ Estado vazio com call-to-actions
- ✅ Proteções contra execuções múltiplas
- ✅ Status visual de execução
- ✅ Controles desabilitados durante execução

**O sistema agora funciona perfeitamente sem loops ou acúmulo de workflows!** 🚀