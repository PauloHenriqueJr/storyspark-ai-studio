import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiClient, queryKeys } from '@/lib/api';
import {
  Play,
  RotateCcw,
  RotateCw,
  Download,
  Maximize,
  Users,
  CheckSquare,
  Plus,
  Settings,
  Layers,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { useChatDockStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Agent } from '@/types/agent';
import type { Task } from '@/types/task';
import type { Execution } from '@/types/execution';
import {
  createGraphFromProject,
  applyAutoLayout,
  validateConnection,
  GraphNodeType,
  AgentNodeData,
  TaskNodeData,
  GraphEdge
} from '@/types/graph';
type GraphNode = Node<AgentNodeData | TaskNodeData>;

type ReactFlowNode = Node<AgentNodeData | TaskNodeData>;
type ReactFlowEdge = Edge;
const initialNodes = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 100 },
    data: {
      label: (
        <div className="p-4 bg-surface border border-border rounded-radius-lg shadow-sm min-w-[280px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-accent-purple rounded-radius flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Support Specialist</h3>
              <p className="text-xs text-muted-foreground">Customer Support Agent</p>
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">Active</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Handle customer inquiries efficiently and escalate complex issues
          </p>
          <div className="flex gap-1 mb-3">
            <Badge variant="outline" className="text-xs">WebSearch</Badge>
            <Badge variant="outline" className="text-xs">Email</Badge>
            <Badge variant="outline" className="text-xs">Slack</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Memory: ✓</span>
              <span>Delegation: ✓</span>
            </div>
            <Button size="sm" variant="ghost" className="p-1">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 250, y: 350 },
    data: {
      label: (
        <div className="p-4 bg-surface border border-border rounded-radius-lg shadow-sm min-w-[300px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-accent-green rounded-radius flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Analyze Customer Inquiry</h3>
              <p className="text-xs text-muted-foreground">Process and categorize support request</p>
            </div>
            <Badge variant="outline" className="text-xs">Required</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Expected: Structured analysis with category, priority, and suggested response
          </p>
          <div className="flex gap-1 mb-3">
            <Badge variant="outline" className="text-xs">WebSearch</Badge>
            <Badge variant="outline" className="text-xs">Email</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Variables: {'{topic}, {customer_email}'}</span>
            <Button size="sm" variant="ghost" className="p-1">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    },
  },
  {
    id: '3',
    type: 'default',
    position: { x: 650, y: 100 },
    data: {
      label: (
        <div className="p-4 bg-surface border border-border rounded-radius-lg shadow-sm min-w-[280px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-accent-yellow rounded-radius flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Technical Expert</h3>
              <p className="text-xs text-muted-foreground">Technical Support Specialist</p>
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">Idle</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Resolve technical issues and provide detailed guidance
          </p>
          <div className="flex gap-1 mb-3">
            <Badge variant="outline" className="text-xs">CodeTool</Badge>
            <Badge variant="outline" className="text-xs">GitHub</Badge>
            <Badge variant="outline" className="text-xs">Database</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Memory: ✓</span>
              <span>Delegation: ✗</span>
            </div>
            <Button size="sm" variant="ghost" className="p-1">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'hsl(var(--primary))' },
  },
];

export default function VisualEditor() {
  const location = useLocation();
  const { toast } = useToast();
  const { initializeWithPrompt, addMessage, setOpen: setChatOpen } = useChatDockStore();
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [currentExecution, setCurrentExecution] = useState<Execution | null>(null);
  const [lastLogSize, setLastLogSize] = useState(0);

  // Get project ID from URL
  const projectId = new URLSearchParams(location.search).get('projectId');

  // Auto-navigate to first project if none selected
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!projectId) {
        try {
          const projects = await apiClient.getProjects();
          if (Array.isArray(projects) && projects.length > 0) {
            window.location.href = `/app/editor?projectId=${projects[0].id}`;
          }
        } catch (e) {
          console.error('Failed to load projects:', e);
        }
      }
    };
    checkAndRedirect();
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold mb-4">Editor Visual</h2>
        <p className="text-muted-foreground">Carregando projetos...</p>
      </div>
    );
  }

  const { data: project } = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => apiClient.getProject(projectId),
    enabled: !!projectId,
  });

  const { data: agentsData } = useQuery({
    queryKey: queryKeys.agents(projectId),
    queryFn: () => apiClient.getProjectAgents(projectId),
    enabled: !!projectId,
  });

  const agents: Agent[] = (agentsData as Agent[]) || [];

  const { data: tasksData } = useQuery({
    queryKey: queryKeys.tasks(projectId),
    queryFn: () => apiClient.getProjectTasks(projectId),
    enabled: !!projectId,
  });

  const tasks: Task[] = (tasksData as Task[]) || [];

  // Check if we received a prompt from Dashboard and auto-start AI Builder
  useEffect(() => {
    const state = location.state as { prompt?: string };
    if (state?.prompt) {
      initializeWithPrompt(state.prompt);
      // Clear the state to prevent reopening on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, initializeWithPrompt]);

  // Auto-refresh when agents/tasks change
  useEffect(() => {
    const interval = setInterval(async () => {
      if (projectId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.agents(projectId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      }
    }, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [projectId, queryClient]);

  useEffect(() => {
    if (project && agents.length >= 0 && tasks.length >= 0) {
      const { nodes: newNodes, edges: newEdges } = createGraphFromProject(agents, tasks);

      // Decorate nodes with label content for default renderer
      const decorated = (newNodes as any[]).map((n) => {
        const data: any = n.data || {};
        const isAgent = !!data.agent;
        const isTask = !!data.task;
        const label = (
          <div className="p-4 bg-surface border border-border rounded-radius-lg shadow-sm min-w-[260px]">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-7 h-7 ${isAgent ? 'bg-accent-purple' : 'bg-accent-green'} rounded-radius flex items-center justify-center`}>
                <Users className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{data.label}</h3>
                <p className="text-xs text-muted-foreground truncate">{data.description}</p>
              </div>
              <Badge variant={isAgent ? 'secondary' : 'outline'} className="ml-auto text-[10px]">{isAgent ? 'Agente' : 'Tarefa'}</Badge>
            </div>
            {isTask && data.task?.expected_output && (
              <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{data.task.expected_output}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-muted-foreground">
                {isTask && data.agentName ? `Agente: ${data.agentName}` : null}
              </div>
              <Button size="sm" variant="ghost" className="p-1 h-6">
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
        return {
          ...n,
          type: 'default',
          data: {
            ...n.data,
            label,
          },
        };
      });

      setNodes(decorated as ReactFlowNode[]);
      setEdges(newEdges.map((e: GraphEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep' as const,
        animated: false,
        style: { stroke: 'hsl(var(--primary))' },
      } as ReactFlowEdge)));
    }
  }, [project, agents, tasks]);

  const runMutation = useMutation({
    mutationFn: (inputs: Record<string, any>) => apiClient.run.project(Number(projectId), { inputs, language: 'pt-br' }),
    onSuccess: (data: Execution) => {
      setCurrentExecution(data);
      setChatOpen(true);
      addMessage({ id: `exec-id-${data.id}`, type: 'assistant', content: `Execução iniciada (ID: ${data.id}).`, timestamp: new Date().toISOString() });
      toast({
        title: "Workflow Executado",
        description: `Execução iniciada com ID: ${data.id}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Falha ao executar workflow",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => apiClient.exportProject(projectId),
    onSuccess: (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${projectId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Exportado",
        description: "Projeto exportado como ZIP",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no Export",
        description: "Falha ao exportar",
        variant: "destructive",
      });
    },
  });

  const executionQuery = useQuery({
    queryKey: queryKeys.execution(currentExecution?.id || ''),
    queryFn: () => apiClient.getExecution(currentExecution!.id),
    enabled: !!currentExecution && !!currentExecution.id && currentExecution.status === 'running',
    refetchInterval: 1000,
    onSuccess: (data: Execution) => {
      setCurrentExecution(data);

      // Append new logs to chat
      try {
        const logs = data.logs || '';
        if (logs && logs.length > lastLogSize) {
          const delta = logs.slice(lastLogSize);
          const lines = delta.split('\n').map(l => l.trim()).filter(Boolean).slice(-5); // append last few lines to avoid spam
          if (lines.length) {
            setChatOpen(true);
            lines.forEach((line) => addMessage({ id: `log-${data.id}-${Math.random()}`, type: 'assistant', content: line, timestamp: new Date().toISOString() }));
          }
          setLastLogSize(logs.length);
        }
      } catch {}

      if (data.status !== 'running') {
        setNodes((nds) =>
          nds.map((node: ReactFlowNode) => ({
            ...node,
            data: {
              ...node.data,
              isRunning: false,
              status: data.status,
            },
          }))
        );
        setChatOpen(true);
        addMessage({ id: `exec-end-${data.id}`, type: 'assistant', content: data.status === 'completed' ? 'Execução concluída com sucesso.' : `Execução falhou: ${data.error_message || 'verifique os logs'}`, timestamp: new Date().toISOString() });
        toast({
          title: data.status === 'completed' ? "Concluído" : "Falha",
          description: data.output_payload?.result || data.logs || data.error_message,
        });
      } else {
        setNodes((nds) =>
          nds.map((node: ReactFlowNode) => ({
            ...node,
            data: {
              ...node.data,
              isRunning: true,
              status: 'running',
            },
          }))
        );
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na execução",
        description: error.message || "Falha ao buscar status",
        variant: "destructive",
      });
    },
  });

  const onConnect = useCallback(
    async (params: Connection | Edge) => {
      setEdges((eds) => addEdge(params, eds));
      // Persist agent-task assignment if applicable
      try {
        const sourceId = (params as Connection).source || (params as any).source;
        const targetId = (params as Connection).target || (params as any).target;
        if (!sourceId || !targetId) return;
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        if (!sourceNode || !targetNode) return;
        const isSourceAgent = !!(sourceNode.data as any)?.agent;
        const isTargetAgent = !!(targetNode.data as any)?.agent;
        const isSourceTask = !!(sourceNode.data as any)?.task;
        const isTargetTask = !!(targetNode.data as any)?.task;

        // agent -> task or task -> agent means set task.agent_id
        let taskNode: any | null = null;
        let agentNode: any | null = null;
        if (isSourceAgent && isTargetTask) {
          agentNode = sourceNode;
          taskNode = targetNode;
        } else if (isSourceTask && isTargetAgent) {
          agentNode = targetNode;
          taskNode = sourceNode;
        }
        if (taskNode && agentNode) {
          const taskRefId = (taskNode.data as any).refId;
          const agentRefId = (agentNode.data as any).refId;
          if (taskRefId && agentRefId) {
            await apiClient.updateTask(String(taskRefId), { agent_id: String(agentRefId) });
            await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId!) });
            toast({ title: 'Conexão salva', description: 'Tarefa associada ao agente.' });
          }
        }
      } catch (e: any) {
        toast({ title: 'Falha ao salvar conexão', description: e?.message || 'Erro desconhecido', variant: 'destructive' });
      }
    },
    [setEdges, nodes, queryClient, projectId, toast],
  );

  const onNodeClick = useCallback((_event: any, node: any) => {
    setSelectedNode(node);
    setIsInspectorOpen(true);
  }, []);

  const handleRunWorkflow = () => {
    if (!projectId) {
      toast({
        title: "Erro",
        description: "ID do projeto não encontrado",
        variant: "destructive",
      });
      return;
    }

    const inputs = {}; // TODO: collect inputs from UI if available
    setChatOpen(true);
    addMessage({ id: `exec-start-${Date.now()}`, type: 'assistant', content: 'Iniciando execução do workflow...', timestamp: new Date().toISOString() });
    runMutation.mutate(inputs);
  };

  const handleValidate = () => {
    if (nodes.length === 0) {
      toast({
        title: "Workflow Inválido",
        description: "Adicione pelo menos um agente ou task",
        variant: "destructive",
      });
      return;
    }

    let isValid = true;
    const errors: string[] = [];

    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        const sourceType: GraphNodeType = 'agent' in sourceNode.data ? 'agent' : 'task';
        const targetType: GraphNodeType = 'agent' in targetNode.data ? 'agent' : 'task';
        const validation = validateConnection(sourceType, targetType, sourceNode.data, targetNode.data);
        if (!validation.isValid && validation.reason) {
          isValid = false;
          errors.push(validation.reason);
        }
      } else {
        isValid = false;
        errors.push('Conexão inválida');
      }
    });

    if (isValid) {
      toast({
        title: "Workflow Válido",
        description: "O workflow está configurado corretamente",
      });
    } else {
      toast({
        title: "Workflow Inválido",
        description: errors.length > 0 ? errors[0] : "Verifique as conexões",
        variant: "destructive",
      });
    }
  };

  const handleAutoLayout = () => {
    const updatedNodes = applyAutoLayout(nodes as unknown as GraphNode[], edges as unknown as GraphEdge[]);
    setNodes(updatedNodes as unknown as ReactFlowNode[]);

    toast({
      title: "Layout Aplicado",
      description: "Os nós foram reorganizados automaticamente",
    });
  };

  const handleExportPNG = () => {
    if (!projectId) {
      toast({
        title: "Erro",
        description: "ID do projeto não encontrado",
        variant: "destructive",
      });
      return;
    }

    exportMutation.mutate();

    toast({
      title: "PNG",
      description: "Para PNG, use captura de tela do browser. ZIP foi exportado.",
    });
  };

  return (
    <div className="h-[calc(100vh-var(--topbar-height)-3rem)] flex">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 bg-surface border border-border rounded-radius-lg shadow-lg p-2 flex gap-2">
          <Button onClick={handleRunWorkflow} className="btn-primary gap-2" size="sm" disabled={runMutation.isPending || !projectId} title={!projectId ? "Selecione um projeto primeiro" : "Executar workflow"}>
            <Play className="h-4 w-4" />
            {runMutation.isPending ? 'Executando...' : 'Run'}
          </Button>
          {runMutation.isPending && <div className="text-xs text-muted-foreground mt-1">Carregando execução...</div>}
          {!projectId && <div className="text-xs text-muted-foreground mt-1">Selecione um projeto para executar</div>}
          <Button onClick={handleValidate} variant="outline" size="sm">
            Validate
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button onClick={handleAutoLayout} variant="ghost" size="sm">
            <Layers className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()} title="Reset view">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleAutoLayout()} title="Re-layout">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => document.fullscreenEnabled && document.body.requestFullscreen?.()} title="Fullscreen">
            <Maximize className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button onClick={handleExportPNG} variant="ghost" size="sm" disabled={exportMutation.isPending || !projectId} title={!projectId ? "Selecione um projeto primeiro" : "Exportar como PNG/ZIP"}>
            <Download className="h-4 w-4" />
            {exportMutation.isPending && <span className="ml-2">Exportando...</span>}
          </Button>
          {!projectId && <div className="text-xs text-muted-foreground mt-1">Selecione um projeto para exportar</div>}
        </div>

        {/* Toolbox */}
        <div className="absolute top-4 right-4 z-10 bg-surface border border-border rounded-radius-lg shadow-lg p-4 w-64">
          <h3 className="font-semibold text-sm mb-3">Toolbox</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" size="sm"
              onClick={async () => {
                if (!projectId) return;
                // Quick add: blank agent
                try {
                  await apiClient.createAgent(projectId, { name: 'Novo Agente', role: 'Função', goal: 'Objetivo', backstory: '', tools: [], verbose: true, memory: false, allow_delegation: false });
                  await queryClient.invalidateQueries({ queryKey: queryKeys.agents(projectId) });
                } catch (e: any) {
                  toast({ title: 'Falha ao criar agente', description: e?.message || 'Erro', variant: 'destructive' });
                }
              }}>
              <Users className="h-4 w-4" />
              Add Agent
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm"
              onClick={async () => {
                if (!projectId) return;
                // Quick add: blank task, assign to first agent if exists
                try {
                  const firstAgent = agents?.[0];
                  await apiClient.createTask(projectId, { agent_id: firstAgent?.id || '', description: 'Nova Tarefa {input}', expected_output: 'Resultado esperado...', tools: [], async_execution: false, output_file: '' });
                  await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
                } catch (e: any) {
                  toast({ title: 'Falha ao criar tarefa', description: e?.message || 'Erro', variant: 'destructive' });
                }
              }}>
              <CheckSquare className="h-4 w-4" />
              Add Task
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Add Connection
            </Button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          className="bg-background"
          fitView
          attributionPosition="bottom-left"
        >
          <Controls position="bottom-left" />
          <MiniMap
            position="bottom-right"
            className="bg-surface border border-border rounded-radius"
            nodeColor="hsl(var(--primary))"
            maskColor="hsl(var(--muted) / 0.5)"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="hsl(var(--border))"
          />
        </ReactFlow>
      </div>

      {/* Inspector Panel */}
      {isInspectorOpen && (
        <div className="w-80 bg-surface border-l border-border p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Inspector</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsInspectorOpen(false)}
            >
              ✕
            </Button>
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Node Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">ID</label>
                    <p className="text-sm text-muted-foreground">{selectedNode.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <p className="text-sm text-muted-foreground">{selectedNode.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Position</label>
                    <p className="text-sm text-muted-foreground">
                      x: {selectedNode.position.x}, y: {selectedNode.position.y}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Select a node to edit its properties
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">No Selection</h4>
              <p className="text-sm text-muted-foreground">
                Click on a node or edge to inspect and edit its properties
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}