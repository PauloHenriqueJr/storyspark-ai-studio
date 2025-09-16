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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
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
  Zap,
  User
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

type NodeData = AgentNodeData | TaskNodeData;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const { initializeWithPrompt, addMessage, setOpen: setChatOpen, workflow, messages, isOpen: isChatOpen } = useChatDockStore();
  const queryClient = useQueryClient();
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ReactFlowEdge>([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [currentExecution, setCurrentExecution] = useState<Execution | null>(null);
  const [lastLogSize, setLastLogSize] = useState(0);
  const [runningNodes, setRunningNodes] = useState<Set<string>>(new Set());
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [creatingNodes, setCreatingNodes] = useState<Set<string>>(new Set());

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
      } else {
        // Clear editor when project changes
        setNodes([]);
        setEdges([]);
        setCurrentExecution(null);
        setRunningNodes(new Set());
      }
    };
    checkAndRedirect();
  }, [projectId]);

  // All hooks must be defined before any conditional returns
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
  const createNodesFromData = useCallback((agents: Agent[], tasks: Task[], withAnimation = false, creatingNodeIds = new Set<string>()) => {
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

      if (withAnimation) {
        node.style = {
          opacity: 0,
          animation: `nodeEntry 0.5s ease-out ${index * 0.1}s forwards`,
        };
      }

      // Add visual indicator for creating nodes
      if (creatingNodeIds.has(nodeId)) {
        node.style = {
          ...node.style,
          border: '2px solid hsl(var(--primary))',
          boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
          animation: 'pulse 2s infinite',
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
          description: task.description || `Task ${task.id}`,
          expectedOutput: task.expected_output || 'Output expected',
          status: 'pending',
          agentName: agentNode?.name || 'Unknown Agent',
          async: task.async_execution || false,
          outputFile: task.output_file || '',
          isCreating: creatingNodeIds.has(taskId),
          refId: task.id, // Store original ID for API calls
        },
      };

      if (withAnimation) {
        node.style = {
          opacity: 0,
          animation: `nodeEntry 0.5s ease-out ${(agents.length + index) * 0.1}s forwards`,
        };
      }

      // Add visual indicator for creating nodes
      if (creatingNodeIds.has(taskId)) {
        node.style = {
          ...node.style,
          border: '2px solid hsl(var(--primary))',
          boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
          animation: 'pulse 2s infinite',
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
  }, [layoutDirection]);

  // Listen for workflow generated by chat and update visual editor
  useEffect(() => {
    if (workflow && workflow.agents && workflow.tasks) {
      setIsLoadingFlow(true);
      setNodes([]);
      setEdges([]);

      // Mark nodes as being created
      const newCreatingNodes = new Set<string>();
      workflow.agents.forEach(agent => {
        newCreatingNodes.add(`agent-${agent.id}`);
      });
      workflow.tasks.forEach(task => {
        newCreatingNodes.add(`task-${task.id}`);
      });
      setCreatingNodes(newCreatingNodes);

      setTimeout(() => {
        const { nodes: newNodes, edges: newEdges } = createNodesFromData(
          workflow.agents,
          workflow.tasks,
          true, // with animation
          newCreatingNodes // creating node ids
        );

        setNodes(newNodes as ReactFlowNode[]);
        setEdges(newEdges);
        setIsLoadingFlow(false);

        // Clear creating state after animation
        setTimeout(() => {
          setCreatingNodes(new Set());
        }, 2000);

        toast({
          title: 'Workflow criado',
          description: `${workflow.agents.length} agentes e ${workflow.tasks.length} tarefas criados com sucesso.`,
        });

        // Auto-fit after loading
        setTimeout(() => reactFlowInstance?.fitView({ padding: 0.3, duration: 400 }), 500);
      }, 300);
    }
  }, [workflow, setNodes, setEdges, toast, reactFlowInstance, layoutDirection, createNodesFromData]);

  // Listen for chat messages to trigger workflow execution
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.type === 'assistant' && 
        (lastMessage.content.includes('Executando workflow') || 
         lastMessage.content.includes('Iniciando execução')) &&
        !currentExecution) { // Only execute if no execution is running
      
      // Auto-execute workflow after chat message
      setTimeout(() => {
        handleRunWorkflow();
      }, 1000);
    }
  }, [messages, currentExecution]);

  // Listen for workflow creation events from chat
  useEffect(() => {
    const handleWorkflowCreated = (event: CustomEvent) => {
      const { agents, tasks, projectId: eventProjectId } = event.detail;
      
      // Only process if it's for the current project
      if (eventProjectId && String(eventProjectId) === String(projectId)) {
        console.log('Workflow created event received:', { agents, tasks, projectId });
        
        // Clear existing workflow first
        setNodes([]);
        setEdges([]);
        setCurrentExecution(null);
        setRunningNodes(new Set());
        
        // Add message to chat
        addMessage({
          id: `workflow-created-${Date.now()}`,
          type: 'assistant',
          content: `✅ Novo workflow criado com sucesso!\n\n📊 ${agents} agente${agents > 1 ? 's' : ''} e ${tasks} tarefa${tasks > 1 ? 's' : ''} criado${agents > 1 || tasks > 1 ? 's' : ''} no editor visual.\n\n🔄 Editor limpo e novo fluxo carregado.`,
          timestamp: new Date().toISOString(),
        });
        
        // Force refresh of agents and tasks data
        queryClient.invalidateQueries({ queryKey: queryKeys.agents(String(projectId)) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks(String(projectId)) });
        
        toast({
          title: 'Novo Workflow Criado',
          description: `Editor limpo e ${agents} agentes + ${tasks} tarefas carregados.`,
        });
      }
    };

    const handleExecuteWorkflow = (event: CustomEvent) => {
      const { projectId: eventProjectId } = event.detail;
      
      // Only process if it's for the current project and no execution is running
      if (eventProjectId && String(eventProjectId) === String(projectId) && !currentExecution) {
        console.log('Executing workflow for project:', projectId);
        
        // Add message to chat
        addMessage({
          id: `exec-event-${Date.now()}`,
          type: 'assistant',
          content: '🎯 Executando workflow no editor visual...',
          timestamp: new Date().toISOString(),
        });
        
        // Auto-execute workflow
        setTimeout(() => {
          handleRunWorkflow();
        }, 500);
      }
    };

    window.addEventListener('workflowCreated', handleWorkflowCreated as EventListener);
    window.addEventListener('executeWorkflow', handleExecuteWorkflow as EventListener);
    
    return () => {
      window.removeEventListener('workflowCreated', handleWorkflowCreated as EventListener);
      window.removeEventListener('executeWorkflow', handleExecuteWorkflow as EventListener);
    };
  }, [projectId, queryClient, toast]);

  // Auto-refresh when agents/tasks change
  useEffect(() => {
    const interval = setInterval(async () => {
      if (projectId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.agents(projectId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      }
    }, 2000); // Poll every 2 seconds for better real-time updates
    return () => clearInterval(interval);
  }, [projectId, queryClient]);

  // Update nodes when agents/tasks change
  useEffect(() => {
    if (project && (agents.length > 0 || tasks.length > 0)) {
      console.log('Updating nodes with agents:', agents.length, 'tasks:', tasks.length);
      
      const { nodes: newNodes, edges: newEdges } = createNodesFromData(
        agents,
        tasks,
        false, // no animation for updates
        new Set() // no creating nodes for updates
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

  const runMutation = useMutation({
    mutationFn: (inputs: Record<string, unknown>) => apiClient.run.project(Number(projectId), { inputs, language: 'pt-br' }),
    onSuccess: (data: Execution) => {
      setCurrentExecution(data);
      // Chat será aberto automaticamente pelo ChatDock
      addMessage({ id: `exec-id-${data.id}`, type: 'assistant', content: `Execução iniciada (ID: ${data.id}).`, timestamp: new Date().toISOString() });
      toast({
        title: "Workflow Executado",
        description: `Execução iniciada com ID: ${data.id}`,
      });
    },
    onError: (error: Error) => {
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
    onError: (error: Error) => {
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
    enabled: !!currentExecution && !!currentExecution.id,
    refetchInterval: (data) => {
      // Poll more frequently when running, less when completed/error
      if (data?.status === 'running') return 1000;
      if (data?.status === 'completed' || data?.status === 'error') return false;
      return 2000;
    },
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (executionQuery.isSuccess && executionQuery.data) {
      const data: Execution = executionQuery.data as Execution;
      setCurrentExecution(data);

        // Track running nodes based on execution progress
        if (data.status === 'running') {
          const activeNodes = new Set<string>();

          // Analyze logs to determine which nodes are currently running
          const logs = data.logs || '';
          const recentLines = logs.split('\n').slice(-15); // Last 15 lines for better detection

          // Look for agent and task mentions in recent logs
          recentLines.forEach(line => {
            const lowerLine = line.toLowerCase();

            // Check for agent execution with more patterns
            agents.forEach(agent => {
              if (lowerLine.includes(agent.name.toLowerCase()) ||
                lowerLine.includes(`agent-${agent.id}`) ||
                lowerLine.includes(`agent ${agent.id}`) ||
                (lowerLine.includes('starting') && lowerLine.includes('agent')) ||
                (lowerLine.includes('running') && lowerLine.includes('agent')) ||
                (lowerLine.includes('executing') && lowerLine.includes('agent')) ||
                (lowerLine.includes('processing') && lowerLine.includes('agent'))) {
                activeNodes.add(`agent-${agent.id}`);
              }
            });

            // Check for task execution with more patterns
            tasks.forEach(task => {
              if (lowerLine.includes(task.description.toLowerCase()) ||
                lowerLine.includes(`task-${task.id}`) ||
                lowerLine.includes(`task ${task.id}`) ||
                (lowerLine.includes('executing') && lowerLine.includes('task')) ||
                (lowerLine.includes('running') && lowerLine.includes('task')) ||
                (lowerLine.includes('processing') && lowerLine.includes('task')) ||
                (lowerLine.includes('completing') && lowerLine.includes('task'))) {
                activeNodes.add(`task-${task.id}`);
              }
            });
          });

          // If no specific nodes found in logs, show progress through the flow
          if (activeNodes.size === 0) {
            // Try to find any node that might be running based on general execution indicators
            const executionIndicators = ['starting', 'running', 'executing', 'processing', 'working', 'analyzing'];
            const hasExecutionActivity = recentLines.some(line =>
              executionIndicators.some(indicator => line.toLowerCase().includes(indicator))
            );

            if (hasExecutionActivity) {
              // If there's execution activity but no specific nodes, highlight the first agent
              const firstAgent = agents[0];
              if (firstAgent) {
                activeNodes.add(`agent-${firstAgent.id}`);
              }
            }
          }

          setRunningNodes(activeNodes);      // Append new logs to chat
        try {
          const logs = data.logs || '';
          if (logs && logs.length > lastLogSize) {
            const delta = logs.slice(lastLogSize);
            const lines = delta.split('\n').map(l => l.trim()).filter(Boolean).slice(-5);
            if (lines.length) {
              // Chat será aberto automaticamente pelo ChatDock
              // Process logs in batches to avoid spam
              const recentLines = lines.slice(-3); // Last 3 lines

              recentLines.forEach((line) => {
                // Clean up log messages
                const cleanedLine = line
                  .replace(/\*\*/g, '')
                  .replace(/[🎯✅📋🔧💡]/gu, '')
                  .trim();

                if (cleanedLine && cleanedLine.length > 10) { // Filter out very short messages
                  // Determine message type and format accordingly
                  let formattedContent = cleanedLine;

                  // Check if it's an agent action
                  if (cleanedLine.toLowerCase().includes('agent') ||
                    cleanedLine.toLowerCase().includes('starting') ||
                    cleanedLine.toLowerCase().includes('executing')) {
                    formattedContent = `🤖 ${cleanedLine}`;
                  }
                  // Check if it's a task completion
                  else if (cleanedLine.toLowerCase().includes('completed') ||
                    cleanedLine.toLowerCase().includes('finished') ||
                    cleanedLine.toLowerCase().includes('done')) {
                    formattedContent = `✅ ${cleanedLine}`;
                  }
                  // Check if it's an error
                  else if (cleanedLine.toLowerCase().includes('error') ||
                    cleanedLine.toLowerCase().includes('failed') ||
                    cleanedLine.toLowerCase().includes('exception')) {
                    formattedContent = `❌ ${cleanedLine}`;
                  }

                  addMessage({
                    id: `log-${data.id}-${Math.random()}`,
                    type: 'assistant',
                    content: formattedContent,
                    timestamp: new Date().toISOString()
                  });
                }
              });
            }
            setLastLogSize(logs.length);
          }
        } catch {
          // Ignore errors when parsing logs
        }

        if (data.status !== 'running') {
          setRunningNodes(new Set());
          // Update all nodes to refresh their labels
          setNodes((nds) =>
            nds.map((node: ReactFlowNode) => {
              const nodeData = node.data;
              return {
                ...node,
                data: {
                  ...nodeData,
                  isRunning: false,
                  status: data.status,
                },
              };
            })
          );
          // Chat será aberto automaticamente pelo ChatDock
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const nodeData = node.data as any;
              const isRunning = runningNodes.has(node.id);
              return {
                ...node,
                data: {
                  ...nodeData,
                  isRunning,
                  status: 'running',
                },
              };
            })
          );
        }
      }
    }
  }, [executionQuery.data, executionQuery.isSuccess, setCurrentExecution, setNodes, setChatOpen, addMessage, toast, lastLogSize, setLastLogSize, nodes, runningNodes, agents, tasks]);

  const onConnect = useCallback(
    async (params: Connection | Edge) => {
      setEdges((eds) => addEdge(params, eds));
      // Persist agent-task assignment if applicable
      try {
        const sourceId = params.source;
        const targetId = params.target;
        if (!sourceId || !targetId) return;
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        if (!sourceNode || !targetNode) return;
        const isSourceAgent = 'agent' in sourceNode.data;
        const isTargetAgent = 'agent' in targetNode.data;
        const isSourceTask = 'task' in sourceNode.data;
        const isTargetTask = 'task' in targetNode.data;

        // agent -> task or task -> agent means set task.agent_id
        let taskNode: Node | null = null;
        let agentNode: Node | null = null;
        if (isSourceAgent && isTargetTask) {
          agentNode = sourceNode;
          taskNode = targetNode;
        } else if (isSourceTask && isTargetAgent) {
          agentNode = targetNode;
          taskNode = sourceNode;
        }
        if (taskNode && agentNode) {
          const taskRefId = (taskNode.data as NodeData).refId;
          const agentRefId = (agentNode.data as NodeData).refId;
          if (taskRefId && agentRefId) {
            await apiClient.updateTask(String(taskRefId), { agent_id: String(agentRefId) });
            await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId!) });
            toast({ title: 'Conexão salva', description: 'Tarefa associada ao agente.' });
          }
        }
      } catch (e: unknown) {
        toast({ title: 'Falha ao salvar conexão', description: e instanceof Error ? e.message : 'Erro desconhecido', variant: 'destructive' });
      }
    },
    [setEdges, nodes, queryClient, projectId, toast],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    // Only auto-open inspector on desktop (lg screens and up)
    if (window.innerWidth >= 1024) {
      setIsInspectorOpen(true);
    }
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
    
    // Add message to chat about execution starting
    addMessage({ 
      id: `exec-start-${Date.now()}`, 
      type: 'assistant', 
      content: '🚀 Iniciando execução do workflow...\n\nAgentes e tarefas serão executados em sequência.', 
      timestamp: new Date().toISOString() 
    });
    
    // Start execution
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
    setNodes(layoutedNodes as ReactFlowNode[]);
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

  // Handle window resize and initialize inspector state
  useEffect(() => {
    const handleResize = () => {
      // Close inspector on mobile/tablet, keep state on desktop
      if (window.innerWidth < 1024) {
        setIsInspectorOpen(false);
      }
      // Note: We don't auto-open on resize, only on node click for desktop
      if (window.innerWidth < 768) {
        setActiveTab('canvas');
      }
    };

    // Initialize on mount
    handleResize();

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

  // Early return for loading state
  if (!projectId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold mb-4">Editor Visual</h2>
        <p className="text-muted-foreground">Carregando projetos...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative min-h-0">
        {isLoadingFlow && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80">
            <div className="p-6 rounded-radius-lg bg-surface border border-border shadow-lg flex flex-col items-center gap-3">
              <span className="text-lg font-semibold">Carregando novo fluxo...</span>
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </div>
        )}
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Panel position="top-center" className="bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow-lg border border-yellow-300 dark:border-yellow-700 m-4 p-2">
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <div>Agents: {agents.length} | Tasks: {tasks.length}</div>
              <div>Nodes: {nodes.length} | Edges: {edges.length}</div>
              <div>Running: {runningNodes.size} | Execution: {currentExecution?.status || 'none'}</div>
            </div>
          </Panel>
        )}

        {/* Clean Toolbar */}
        <Panel position="top-left" className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 m-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setNodes([]);
                  setEdges([]);
                  setCurrentExecution(null);
                  setRunningNodes(new Set());
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
              <Button
                onClick={handleRunWorkflow}
                className="btn-primary gap-1 md:gap-2"
                size="sm"
                disabled={runMutation.isPending || !projectId || currentExecution?.status === 'running'}
                title={!projectId ? "Selecione um projeto primeiro" : "Executar workflow"}
              >
                <Play className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-xs md:text-sm">
                  {runMutation.isPending ? 'Run...' : 
                   currentExecution?.status === 'running' ? 'Running...' : 'Run'}
                </span>
              </Button>
            </div>
            
            {/* Execution Status */}
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
            
            {runMutation.isPending && <div className="text-xs text-muted-foreground">Carregando execução...</div>}
            {!projectId && <div className="text-xs text-muted-foreground">Selecione um projeto para executar</div>}
            
            <div className="flex gap-2">
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
              
              {/* Test Button for Development */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={() => {
                    // Simulate workflow creation
                    window.dispatchEvent(new CustomEvent('workflowCreated', { 
                      detail: { 
                        agents: 2, 
                        tasks: 3,
                        projectId: projectId 
                      } 
                    }));
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Test Workflow
                </Button>
              )}
            </div>
          </div>
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
        <div className="flex-1 relative pb-20">
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
              className="!bg-surface !border-border !shadow-lg !bottom-6 !left-6"
              showZoom={true}
              showFitView={true}
              showInteractive={false}
            />
            <MiniMap
              position="bottom-right"
              className="!bg-surface !border-border !rounded-radius !bottom-6 !right-6 hidden md:block"
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

      </div>

      {/* Inspector Sidebar */}
      {selectedNode && isInspectorOpen && (
        <InspectorPanel
          selectedNode={selectedNode}
          onClose={() => setIsInspectorOpen(false)}
          onUpdateNode={(nodeId, updates) => {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === nodeId) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      ...updates,
                    },
                  };
                }
                return node;
              })
            );
          }}
          onDeleteNode={(nodeId) => {
            setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
            setIsInspectorOpen(false);
          }}
        />
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
