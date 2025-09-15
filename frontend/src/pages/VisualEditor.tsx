import { useCallback, useState, useEffect, useRef } from 'react';
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
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import AgentNode from '@/components/nodes/AgentNode';
import TaskNode from '@/components/nodes/TaskNode';
import { getLayoutedElements } from '@/utils/layoutUtils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
// Custom node types
const nodeTypes = {
  agent: AgentNode,
  task: TaskNode,
};

type ReactFlowNode = Node<any>;
type ReactFlowEdge = Edge;

// Animation keyframes
const nodeAnimationStyle = `
  @keyframes nodeEntry {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

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

function VisualEditorContent() {
  const [isLoadingFlow, setIsLoadingFlow] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'inspector' | 'toolbox'>('canvas');
  const [showChat, setShowChat] = useState(true);
  const location = useLocation();
  const { toast } = useToast();
  const { initializeWithPrompt, addMessage, setOpen: setChatOpen, workflow } = useChatDockStore();
  const queryClient = useQueryClient();
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ReactFlowEdge>([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [currentExecution, setCurrentExecution] = useState<Execution | null>(null);
  const [lastLogSize, setLastLogSize] = useState(0);
  const [editingNode, setEditingNode] = useState<any>(null);
  const [runningNodes, setRunningNodes] = useState<Set<string>>(new Set());
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');

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
      window.history.replaceState({}, document.title);
    }
  }, [location.state, initializeWithPrompt]);

  // Add animation styles to document
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = nodeAnimationStyle;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Helper function to create nodes from agents and tasks
  const createNodesFromData = (agents: Agent[], tasks: Task[], withAnimation = false) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let nodeIdCounter = 0;

    // Create agent nodes
    agents.forEach((agent, index) => {
      const nodeId = `agent-${agent.id}`;
      const node: Node = {
        id: nodeId,
        type: 'agent',
        position: { x: 0, y: 0 }, // Will be calculated by layout
        data: {
          name: agent.name,
          role: agent.role,
          status: 'idle',
          tools: agent.tools || [],
          memory: agent.memory,
          delegation: agent.allow_delegation,
        },
      };

      if (withAnimation) {
        node.style = {
          opacity: 0,
          animation: `nodeEntry 0.5s ease-out ${index * 0.1}s forwards`,
        };
      }

      newNodes.push(node);
    });

    // Create task nodes and edges
    tasks.forEach((task, index) => {
      const taskId = `task-${task.id}`;
      const agentNode = agents.find(a => a.id === task.agent_id);
      
      const node: Node = {
        id: taskId,
        type: 'task',
        position: { x: 0, y: 0 }, // Will be calculated by layout
        data: {
          description: task.description,
          expectedOutput: task.expected_output,
          status: 'pending',
          agentName: agentNode?.name,
          async: task.async_execution,
          outputFile: task.output_file,
        },
      };

      if (withAnimation) {
        node.style = {
          opacity: 0,
          animation: `nodeEntry 0.5s ease-out ${(agents.length + index) * 0.1}s forwards`,
        };
      }

      newNodes.push(node);

      // Create edge from agent to task
      if (task.agent_id) {
        const edge: Edge = {
          id: `edge-${nodeIdCounter++}`,
          source: `agent-${task.agent_id}`,
          target: taskId,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#94a3b8',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: '#94a3b8',
          },
        };
        newEdges.push(edge);
      }
    });

    // Apply automatic layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      newNodes,
      newEdges,
      layoutDirection
    );

    return { nodes: layoutedNodes, edges: layoutedEdges };
  };

  // Listen for workflow generated by chat and update visual editor
  useEffect(() => {
    if (workflow && workflow.agents && workflow.tasks) {
      setIsLoadingFlow(true);
      setNodes([]);
      setEdges([]);
      
      setTimeout(() => {
        const { nodes: newNodes, edges: newEdges } = createNodesFromData(
          workflow.agents,
          workflow.tasks,
          true // with animation
        );
        
        setNodes(newNodes);
        setEdges(newEdges);
        setIsLoadingFlow(false);
        
        toast({
          title: 'Workflow criado',
          description: `${workflow.agents.length} agentes e ${workflow.tasks.length} tarefas criados com sucesso.`,
        });
        
        // Auto-fit after loading
        setTimeout(() => reactFlowInstance?.fitView({ padding: 0.3, duration: 400 }), 500);
      }, 300);
    }
  }, [workflow, setNodes, setEdges, toast, reactFlowInstance, layoutDirection]);

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

  // Update nodes when agents/tasks change
  useEffect(() => {
    if (project && (agents.length > 0 || tasks.length > 0)) {
      const { nodes: newNodes, edges: newEdges } = createNodesFromData(
        agents,
        tasks,
        false // no animation for updates
      );

      // Update status for running nodes
      const updatedNodes = newNodes.map(node => {
        if (runningNodes.has(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              status: 'running',
            },
          };
        }
        return node;
      });

      setNodes(updatedNodes);
      setEdges(newEdges.map(edge => ({
        ...edge,
        animated: currentExecution?.status === 'running',
      })));
    }
  }, [project, agents, tasks, runningNodes, currentExecution, layoutDirection]);

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
  });

  useEffect(() => {
    if (executionQuery.isSuccess && executionQuery.data) {
      const data: Execution = executionQuery.data;
      setCurrentExecution(data);

      // Track running nodes
      if (data.status === 'running') {
        // Simulate node progression (in real app, this would come from backend)
        const simulatedActiveNodes = new Set<string>();
        nodes.forEach((node, index) => {
          if (index === 0 || (index === 1 && Math.random() > 0.5)) {
            simulatedActiveNodes.add(node.id);
          }
        });
        setRunningNodes(simulatedActiveNodes);
      } else {
        setRunningNodes(new Set());
      }

      // Append new logs to chat
      try {
        const logs = data.logs || '';
        if (logs && logs.length > lastLogSize) {
          const delta = logs.slice(lastLogSize);
          const lines = delta.split('\n').map(l => l.trim()).filter(Boolean).slice(-5);
          if (lines.length) {
            setChatOpen(true);
            lines.forEach((line) => {
              // Clean up log messages
              const cleanedLine = line
                .replace(/\*\*/g, '')
                .replace(/[🎯✅📋🔧💡]/g, '')
                .trim();
              if (cleanedLine) {
                addMessage({ 
                  id: `log-${data.id}-${Math.random()}`, 
                  type: 'assistant', 
                  content: cleanedLine, 
                  timestamp: new Date().toISOString() 
                });
              }
            });
          }
          setLastLogSize(logs.length);
        }
      } catch { }

      if (data.status !== 'running') {
        setRunningNodes(new Set());
        // Update all nodes to refresh their labels
        setNodes((nds) =>
          nds.map((node: ReactFlowNode) => {
            const nodeData = node.data as any;
            return {
              ...node,
              data: {
                ...nodeData,
                label: createNodeLabel(nodeData, false),
                isRunning: false,
                status: data.status,
              },
            };
          })
        );
        setChatOpen(true);
        addMessage({ 
          id: `exec-end-${data.id}`, 
          type: 'assistant', 
          content: data.status === 'completed' 
            ? 'Execução concluída com sucesso.' 
            : `Execução falhou: ${data.error_message || 'verifique os logs'}`, 
          timestamp: new Date().toISOString() 
        });
        toast({
          title: data.status === 'completed' ? "Concluído" : "Falha",
          description: data.output_payload?.result || data.logs || data.error_message,
        });
      } else {
        // Update running nodes with animation
        setNodes((nds) =>
          nds.map((node: ReactFlowNode) => {
            const nodeData = node.data as any;
            const isRunning = runningNodes.has(node.id);
            return {
              ...node,
              data: {
                ...nodeData,
                label: createNodeLabel(nodeData, isRunning),
                isRunning,
                status: 'running',
              },
            };
          })
        );
      }
    }
    if (executionQuery.isError && executionQuery.error) {
      const error = executionQuery.error;
      toast({
        title: "Erro na execução",
        description: (error as any).message || "Falha ao buscar status",
        variant: "destructive",
      });
    }
  }, [executionQuery.data, executionQuery.isSuccess, executionQuery.isError, executionQuery.error, setCurrentExecution, setNodes, setChatOpen, addMessage, toast, lastLogSize, setLastLogSize]);

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
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      layoutDirection
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setTimeout(() => reactFlowInstance?.fitView({ padding: 0.3, duration: 400 }), 100);
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsInspectorOpen(window.innerWidth >= 1024);
      if (window.innerWidth < 768) {
        setActiveTab('canvas');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-fit view when nodes change
  useEffect(() => {
    if (nodes.length > 0 && reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
      }, 100);
    }
  }, [nodes, reactFlowInstance]);

  return (
    <div className="h-[calc(100vh-var(--topbar-height))] flex flex-col bg-gray-50 dark:bg-gray-950">

      {/* Main Canvas */}
      <div className="flex-1 relative min-h-0">
        {isLoadingFlow && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80">
            <div className="p-6 rounded-radius-lg bg-surface border border-border shadow-lg flex flex-col items-center gap-3">
              <span className="text-lg font-semibold">Carregando novo fluxo...</span>
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </div>
        )}
        {/* Clean Toolbar */}
        <Panel position="top-left" className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 m-4">
          <Button 
            onClick={() => {
              setNodes([]);
              setEdges([]);
              toast({ title: 'Fluxo limpo', description: 'Todos os cards e conexões foram removidos.' });
            }} 
            variant="outline" 
            size="sm" 
            title="Limpar fluxo"
            className="text-xs md:text-sm"
          >
            <RotateCcw className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden md:inline">Limpar</span>
          </Button>
          <Button 
            onClick={handleRunWorkflow} 
            className="btn-primary gap-1 md:gap-2" 
            size="sm" 
            disabled={runMutation.isPending || !projectId} 
            title={!projectId ? "Selecione um projeto primeiro" : "Executar workflow"}
          >
            <Play className="h-3 w-3 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">{runMutation.isPending ? 'Run...' : 'Run'}</span>
          </Button>
          {runMutation.isPending && <div className="text-xs text-muted-foreground mt-1">Carregando execução...</div>}
          {!projectId && <div className="text-xs text-muted-foreground mt-1">Selecione um projeto para executar</div>}
          <Button 
            onClick={handleValidate} 
            variant="outline" 
            size="sm"
            className="text-xs md:text-sm"
          >
            <CheckSquare className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden md:inline">Validar</span>
          </Button>
          <Separator orientation="vertical" className="h-4 md:h-6 hidden md:block" />
          <Button 
            onClick={handleAutoLayout} 
            variant="ghost" 
            size="sm"
            title="Auto Layout"
          >
            <Layers className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => reactFlowInstance?.fitView({ padding: 0.2, duration: 200 })} 
            title="Fit View"
          >
            <Maximize className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          <Separator orientation="vertical" className="h-4 md:h-6 hidden md:block" />
          <Button 
            onClick={handleExportPNG} 
            variant="ghost" 
            size="sm" 
            disabled={exportMutation.isPending || !projectId} 
            title={!projectId ? "Selecione um projeto primeiro" : "Exportar"}
          >
            <Download className="h-3 w-3 md:h-4 md:w-4" />
            {exportMutation.isPending && <span className="ml-1 text-xs hidden md:inline">...</span>}
          </Button>
          {!projectId && <div className="text-xs text-muted-foreground mt-1">Selecione um projeto para exportar</div>}
        </Panel>

        {/* Layout Control Panel */}
        <Panel position="top-right" className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 m-4">
          <div className="p-2 flex items-center gap-2">
            <Button
              variant={layoutDirection === 'TB' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setLayoutDirection('TB');
                handleAutoLayout();
              }}
              title="Vertical Layout"
            >
              <Layers className="h-4 w-4 rotate-0" />
            </Button>
            <Button
              variant={layoutDirection === 'LR' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setLayoutDirection('LR');
                handleAutoLayout();
              }}
              title="Horizontal Layout"
            >
              <Layers className="h-4 w-4 rotate-90" />
            </Button>
          </div>
        </Panel>

        {/* React Flow Canvas - Clean Style */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          connectionMode={ConnectionMode.Loose}
          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900"
          fitView
          fitViewOptions={{ padding: 0.3 }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls 
            position="bottom-left" 
            className="!bg-surface !border-border !shadow-lg"
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          <MiniMap
            position="bottom-right"
            className="!bg-surface !border-border !rounded-radius hidden md:block"
            nodeColor={(node) => runningNodes.has(node.id) ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
            maskColor="hsl(var(--muted) / 0.5)"
            pannable
            zoomable
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={0.8}
            color="#e5e7eb"
            className="dark:opacity-20"
          />
        </ReactFlow>

      </div>


      {/* Inspector Panel - Clean Sidebar */}
      {selectedNode && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-20 overflow-y-auto">
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
                  <CardTitle className="text-base flex items-center justify-between">
                    Edit Properties
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editingNode) {
                          // Save changes
                          setNodes((nds) =>
                            nds.map((node) => {
                              if (node.id === selectedNode.id) {
                                return {
                                  ...node,
                                  data: {
                                    ...node.data,
                                    label: editingNode.label,
                                    description: editingNode.description,
                                  },
                                };
                              }
                              return node;
                            })
                          );
                          setEditingNode(null);
                          toast({ title: 'Node updated', description: 'Changes saved successfully.' });
                        } else {
                          setEditingNode({
                            label: selectedNode.data?.label || '',
                            description: selectedNode.data?.description || '',
                          });
                        }
                      }}
                    >
                      {editingNode ? 'Save' : 'Edit'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editingNode ? (
                    <>
                      <div>
                        <label className="text-sm font-medium">Label</label>
                        <Input
                          value={editingNode.label}
                          onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })}
                          placeholder="Enter label"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={editingNode.description}
                          onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                          placeholder="Enter description"
                          rows={3}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Click "Edit" to modify node properties
                    </div>
                  )}
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

export default function VisualEditor() {
  return (
    <ReactFlowProvider>
      <VisualEditorContent />
    </ReactFlowProvider>
  );
}
