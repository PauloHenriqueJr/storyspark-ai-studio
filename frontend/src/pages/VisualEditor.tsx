import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
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
import { ResultPanel } from '@/components/ResultPanel';
import { ResultBadge } from '@/components/ResultBadge';
import ErrorBoundary from '@/components/ErrorBoundary';
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
  User,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChatDockStore, useExecutionControlStore } from '@/lib/store';
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { initializeWithPrompt, addMessage, setOpen: setChatOpen, workflow, messages, isOpen: isChatOpen } = useChatDockStore();
  const {
    isExecuting: globalIsExecuting,
    isCreatingWorkflow: globalIsCreatingWorkflow,
    setIsExecuting: setGlobalIsExecuting,
    setIsCreatingWorkflow: setGlobalIsCreatingWorkflow,
    setExecutionId,
    nodeStates,
    setNodeState,
    resetNodeStates
  } = useExecutionControlStore();
  const queryClient = useQueryClient();
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ReactFlowEdge>([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [currentExecution, setCurrentExecution] = useState<Execution | null>(null);
  const [showResultPanel, setShowResultPanel] = useState(false);
  const [showResultBadge, setShowResultBadge] = useState(false);

  // State for execution control
  const [lastLogSize, setLastLogSize] = useState(0);
  const [runningNodes, setRunningNodes] = useState<Set<string>>(new Set());
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [creatingNodes, setCreatingNodes] = useState<Set<string>>(new Set());

  const lastExecutionStatusRef = useRef<string | null>(null);
  const latestExecutionPayload = currentExecution?.output_payload as Record<string, unknown> | undefined;
  const latestExecutionResult = typeof latestExecutionPayload?.result === 'string'
    ? String(latestExecutionPayload.result)
    : '';


  const executionStatus = currentExecution?.status ?? '';
  const isExecutionInProgress = useMemo(() => 
    ['running', 'pending', 'created'].includes(executionStatus), 
    [executionStatus]
  );
  const executionHasFailed = useMemo(() => 
    executionStatus === 'failed' || executionStatus === 'error', 
    [executionStatus]
  );
  const showStatusPanel = useMemo(() => 
    globalIsCreatingWorkflow || globalIsExecuting || isExecutionInProgress, 
    [globalIsCreatingWorkflow, globalIsExecuting, isExecutionInProgress]
  );
  const canExecuteWorkflow = useMemo(() => 
    !globalIsExecuting && !currentExecution, 
    [globalIsExecuting, currentExecution]
  );
  const canCreateWorkflowReady = useMemo(() => 
    !globalIsCreatingWorkflow && !globalIsExecuting, 
    [globalIsCreatingWorkflow, globalIsExecuting]
  );


  // Get project ID from URL
  const projectId = useMemo(() => 
    new URLSearchParams(location.search).get('projectId'), 
    [location.search]
  );

  // Get template ID from URL
  const templateId = useMemo(() => 
    new URLSearchParams(location.search).get('templateId'), 
    [location.search]
  );

  // Get agent ID from URL
  const agentId = useMemo(() => 
    new URLSearchParams(location.search).get('agentId'), 
    [location.search]
  );

  // Get task ID from URL
  const taskId = useMemo(() => 
    new URLSearchParams(location.search).get('taskId'), 
    [location.search]
  );
  const executionsPath = useMemo(() => 
    projectId ? `/app/executions?projectId=${projectId}` : '/app/executions', 
    [projectId]
  );

  const handleNavigateToExecutions = useCallback(() => {
    navigate(executionsPath);
  }, [navigate, executionsPath]);

  const handleCloseResultPanel = useCallback(() => {
    setShowResultPanel(false);
  }, []);

  const handleShowResultPanel = useCallback(() => {
    setShowResultPanel(true);
    setShowResultBadge(false);
  }, []);

  const handleCloseResultBadge = useCallback(() => {
    setShowResultBadge(false);
  }, []);

  // Template definitions for automatic workflow creation
  const templateDefinitions = useMemo(() => ({
    'story-generator': {
      name: 'Gerador de Histórias Interativas',
      description: 'Cria narrativas personalizadas baseadas no perfil do usuário',
      agents: [
        { name: 'Character Developer', role: 'Desenvolvedor de Personagens', goal: 'Criar personagens únicos e memoráveis' },
        { name: 'Plot Designer', role: 'Designer de Enredo', goal: 'Desenvolver tramas envolventes' },
        { name: 'Dialogue Specialist', role: 'Especialista em Diálogos', goal: 'Criar diálogos naturais e autênticos' },
        { name: 'World Builder', role: 'Construtor de Mundos', goal: 'Desenvolver ambientes ricos e detalhados' }
      ],
      tasks: [
        { description: 'Analisar perfil do usuário', expected_output: 'Perfil detalhado do usuário' },
        { description: 'Criar personagem principal', expected_output: 'Personagem principal desenvolvido' },
        { description: 'Desenvolver enredo base', expected_output: 'Estrutura básica do enredo' },
        { description: 'Criar diálogos iniciais', expected_output: 'Primeiros diálogos da história' },
        { description: 'Construir mundo da história', expected_output: 'Ambiente e contexto definidos' },
        { description: 'Gerar múltiplos finais', expected_output: 'Diferentes opções de conclusão' },
        { description: 'Revisar narrativa completa', expected_output: 'História finalizada e polida' },
        { description: 'Formatar para entrega', expected_output: 'História formatada e pronta' }
      ]
    },
    'social-content-creator': {
      name: 'Criador de Conteúdo Social',
      description: 'Automatiza criação de posts para múltiplas redes sociais',
      agents: [
        { name: 'Content Strategist', role: 'Estrategista de Conteúdo', goal: 'Desenvolver estratégias de conteúdo' },
        { name: 'Social Media Manager', role: 'Gerente de Redes Sociais', goal: 'Gerenciar presença nas redes sociais' },
        { name: 'Engagement Specialist', role: 'Especialista em Engajamento', goal: 'Maximizar interação e engajamento' }
      ],
      tasks: [
        { description: 'Analisar tendências atuais', expected_output: 'Relatório de tendências' },
        { description: 'Criar calendário de conteúdo', expected_output: 'Cronograma de posts' },
        { description: 'Gerar posts para Instagram', expected_output: 'Posts otimizados para Instagram' },
        { description: 'Gerar posts para Twitter', expected_output: 'Tweets otimizados' },
        { description: 'Gerar posts para LinkedIn', expected_output: 'Conteúdo profissional' },
        { description: 'Otimizar para engajamento', expected_output: 'Conteúdo otimizado' }
      ]
    },
    'podcast-producer': {
      name: 'Produtor de Podcast Automatizado',
      description: 'Pipeline completo para criação de episódios de podcast',
      agents: [
        { name: 'Research Specialist', role: 'Especialista em Pesquisa', goal: 'Conduzir pesquisas aprofundadas' },
        { name: 'Script Writer', role: 'Roteirista', goal: 'Criar roteiros envolventes' },
        { name: 'Audio Producer', role: 'Produtor de Áudio', goal: 'Produzir conteúdo de áudio' },
        { name: 'Distribution Manager', role: 'Gerente de Distribuição', goal: 'Gerenciar distribuição do conteúdo' },
        { name: 'Marketing Coordinator', role: 'Coordenador de Marketing', goal: 'Promover o podcast' }
      ],
      tasks: [
        { description: 'Definir tema do episódio', expected_output: 'Tema e objetivos definidos' },
        { description: 'Pesquisar conteúdo relevante', expected_output: 'Material de pesquisa coletado' },
        { description: 'Criar roteiro do episódio', expected_output: 'Roteiro estruturado' },
        { description: 'Preparar perguntas para entrevista', expected_output: 'Lista de perguntas preparada' },
        { description: 'Gravar introdução', expected_output: 'Introdução gravada' },
        { description: 'Conduzir entrevista', expected_output: 'Entrevista realizada' },
        { description: 'Editar áudio', expected_output: 'Áudio editado e polido' },
        { description: 'Criar descrição do episódio', expected_output: 'Descrição e tags criadas' },
        { description: 'Distribuir em plataformas', expected_output: 'Episódio publicado' },
        { description: 'Promover nas redes sociais', expected_output: 'Promoção realizada' },
        { description: 'Analisar métricas', expected_output: 'Relatório de performance' },
        { description: 'Planejar próximo episódio', expected_output: 'Plano para próximo episódio' }
      ]
    }
  }), []);

  // Function to create workflow from template
  const createWorkflowFromTemplate = useCallback(async (templateId: string) => {
    const template = templateDefinitions[templateId as keyof typeof templateDefinitions];
    if (!template || !projectId) return;

    try {
      // First, delete all existing agents and tasks to avoid accumulation
      console.log('Clearing existing agents and tasks before creating new workflow...');
      
      // Delete all existing tasks first (they depend on agents)
      if (tasks.length > 0) {
        for (const task of tasks) {
          try {
            await apiClient.deleteTask(task.id);
          } catch (error) {
            console.warn(`Failed to delete task ${task.id}:`, error);
          }
        }
      }
      
      // Delete all existing agents
      if (agents.length > 0) {
        for (const agent of agents) {
          try {
            await apiClient.deleteAgent(agent.id);
          } catch (error) {
            console.warn(`Failed to delete agent ${agent.id}:`, error);
          }
        }
      }
      
      // Wait a moment for deletions to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear the visual editor
      setNodes([]);
      setEdges([]);
      setCurrentExecution(null);
      setRunningNodes(new Set());
      
      // Create agents from template
      const createdAgents = [];
      for (const agentTemplate of template.agents) {
        const agentData = {
          name: agentTemplate.name,
          role: agentTemplate.role,
          goal: agentTemplate.goal,
          backstory: `Especialista em ${agentTemplate.role.toLowerCase()}`,
          tools: ['WebSearchTool', 'FileReadTool', 'FileWriteTool'],
          memory: true,
          allow_delegation: true
        };
        
        const createdAgent = await apiClient.createAgent(Number(projectId), agentData);
        createdAgents.push(createdAgent);
      }

      // Create tasks from template
      const createdTasks = [];
      for (const taskTemplate of template.tasks) {
        const taskData = {
          description: taskTemplate.description,
          expected_output: taskTemplate.expected_output,
          agent_id: createdAgents[Math.floor(Math.random() * createdAgents.length)].id,
          async_execution: false
        };
        
        const createdTask = await apiClient.createTask(Number(projectId), taskData);
        createdTasks.push(createdTask);
      }

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: queryKeys.agents(projectId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });

      toast({
        title: "Template Aplicado",
        description: `Workflow "${template.name}" criado com sucesso!`,
      });

      // Clear URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('templateId');
      window.history.replaceState({}, '', url.toString());

    } catch (error) {
      console.error('Error creating workflow from template:', error);
      toast({
        title: "Erro ao Criar Workflow",
        description: "Não foi possível criar o workflow do template",
        variant: "destructive",
      });
    }
  }, [templateDefinitions, projectId, queryClient, toast]);

  // Function to clear all agents and tasks for a project
  const clearAllAgentsAndTasks = useCallback(async (projectId: string) => {
    if (!projectId) return;
    
    try {
      console.log('Clearing all agents and tasks for project:', projectId);
      
      // Get current agents and tasks
      const currentAgents = await apiClient.getProjectAgents(projectId);
      const currentTasks = await apiClient.getProjectTasks(projectId);
      
      // Delete all tasks first (they depend on agents)
      if (currentTasks && currentTasks.length > 0) {
        for (const task of currentTasks) {
          try {
            await apiClient.deleteTask(task.id);
          } catch (error) {
            console.warn(`Failed to delete task ${task.id}:`, error);
          }
        }
      }
      
      // Delete all agents
      if (currentAgents && currentAgents.length > 0) {
        for (const agent of currentAgents) {
          try {
            await apiClient.deleteAgent(agent.id);
          } catch (error) {
            console.warn(`Failed to delete agent ${agent.id}:`, error);
          }
        }
      }
      
      // Clear the visual editor
      setNodes([]);
      setEdges([]);
      setCurrentExecution(null);
      setRunningNodes(new Set());
      
      // Refresh data
      await queryClient.invalidateQueries({ queryKey: queryKeys.agents(projectId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      
      console.log('All agents and tasks cleared successfully');
      
    } catch (error) {
      console.error('Error clearing agents and tasks:', error);
    }
  }, [queryClient]);

  // Auto-create workflow from template or agent
  useEffect(() => {
    if (templateId && projectId) {
      createWorkflowFromTemplate(templateId);
    }
  }, [templateId, projectId, createWorkflowFromTemplate]);


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
        lastExecutionStatusRef.current = null;
        setRunningNodes(new Set());
      }
    };
    checkAndRedirect();
  }, [projectId]);

  // All hooks must be defined before any conditional returns
  const { data: project, error: projectError } = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => apiClient.getProject(projectId),
    enabled: !!projectId,
    retry: 3,
    retryDelay: 1000,
  });

  const resolveExecutionLanguage = useCallback(() => {
    const raw = (project as { language?: string } | undefined)?.language?.toLowerCase();
    if (!raw) return 'pt';
    if (raw === 'pt-br' || raw === 'pt_br') return 'pt';
    if (['pt', 'en', 'es', 'fr'].includes(raw)) return raw;
    return 'pt';
  }, [project]);


  const { data: agentsData, error: agentsError } = useQuery({
    queryKey: queryKeys.agents(projectId),
    queryFn: () => apiClient.getProjectAgents(projectId),
    enabled: !!projectId,
    retry: 3,
    retryDelay: 1000,
  });

  const agents: Agent[] = (agentsData as Agent[]) || [];

  const { data: tasksData, error: tasksError } = useQuery({
    queryKey: queryKeys.tasks(projectId),
    queryFn: () => apiClient.getProjectTasks(projectId),
    enabled: !!projectId,
    retry: 3,
    retryDelay: 1000,
  });

  const tasks: Task[] = (tasksData as Task[]) || [];

  // Function to create workflow from agent
  const createWorkflowFromAgent = useCallback(async (agentId: string) => {
    if (!projectId) return;

    try {
      // First, delete all existing agents and tasks to avoid accumulation
      console.log('Clearing existing agents and tasks before creating new workflow from agent...');
      
      // Delete all existing tasks first (they depend on agents)
      if (tasks.length > 0) {
        for (const task of tasks) {
          try {
            await apiClient.deleteTask(task.id);
          } catch (error) {
            console.warn(`Failed to delete task ${task.id}:`, error);
          }
        }
      }
      
      // Delete all existing agents
      if (agents.length > 0) {
        for (const agent of agents) {
          try {
            await apiClient.deleteAgent(agent.id);
          } catch (error) {
            console.warn(`Failed to delete agent ${agent.id}:`, error);
          }
        }
      }
      
      // Wait a moment for deletions to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear the visual editor
      setNodes([]);
      setEdges([]);
      setCurrentExecution(null);
      setRunningNodes(new Set());
      
      // Get agent data (will be recreated)
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;

      // Create a simple task for the agent
      const taskData = {
        description: `Tarefa principal para ${agent.name}`,
        expected_output: `Resultado da execução de ${agent.name}`,
        agent_id: agentId,
        async_execution: false
      };
      
      const createdTask = await apiClient.createTask(Number(projectId), taskData);

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });

      toast({
        title: "Workflow Criado",
        description: `Workflow criado para o agente ${agent.name}!`,
      });

      // Clear URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('agentId');
      window.history.replaceState({}, '', url.toString());

    } catch (error) {
      console.error('Error creating workflow from agent:', error);
      toast({
        title: "Erro ao Criar Workflow",
        description: "Não foi possível criar o workflow do agente",
        variant: "destructive",
      });
    }
  }, [projectId, agents, queryClient, toast]);

  // Function to create workflow from task
  const createWorkflowFromTask = useCallback(async (taskId: string) => {
    if (!projectId) return;

    try {
      // First, delete all existing agents and tasks to avoid accumulation
      console.log('Clearing existing agents and tasks before creating new workflow from task...');
      
      // Delete all existing tasks first (they depend on agents)
      if (tasks.length > 0) {
        for (const task of tasks) {
          try {
            await apiClient.deleteTask(task.id);
          } catch (error) {
            console.warn(`Failed to delete task ${task.id}:`, error);
          }
        }
      }
      
      // Delete all existing agents
      if (agents.length > 0) {
        for (const agent of agents) {
          try {
            await apiClient.deleteAgent(agent.id);
          } catch (error) {
            console.warn(`Failed to delete agent ${agent.id}:`, error);
          }
        }
      }
      
      // Wait a moment for deletions to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear the visual editor
      setNodes([]);
      setEdges([]);
      setCurrentExecution(null);
      setRunningNodes(new Set());
      
      // Get task data (will be recreated)
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Get agent for the task (will be recreated)
      const agent = agents.find(a => a.id === task.agent_id);
      if (!agent) return;

      // Create additional tasks to form a workflow
      const additionalTasks = [
        {
          description: `Preparação para ${task.description}`,
          expected_output: `Preparação concluída para ${task.description}`,
          agent_id: task.agent_id,
          async_execution: false
        },
        {
          description: `Pós-processamento de ${task.description}`,
          expected_output: `Pós-processamento concluído para ${task.description}`,
          agent_id: task.agent_id,
          async_execution: false
        }
      ];

      // Create additional tasks
      for (const taskData of additionalTasks) {
        await apiClient.createTask(Number(projectId), taskData);
      }

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });

      toast({
        title: "Workflow Criado",
        description: `Workflow criado para a task "${task.description}"!`,
      });

      // Clear URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('taskId');
      window.history.replaceState({}, '', url.toString());

    } catch (error) {
      console.error('Error creating workflow from task:', error);
      toast({
        title: "Erro ao Criar Workflow",
        description: "Não foi possível criar o workflow da task",
        variant: "destructive",
      });
    }
  }, [projectId, tasks, agents, queryClient, toast]);

  // Handle query errors
  useEffect(() => {
    if (projectError) {
      toast({
        title: "Erro ao carregar projeto",
        description: projectError.message || "Falha ao carregar dados do projeto",
        variant: "destructive",
      });
    }
    if (agentsError) {
      toast({
        title: "Erro ao carregar agentes",
        description: agentsError.message || "Falha ao carregar agentes",
        variant: "destructive",
      });
    }
    if (tasksError) {
      toast({
        title: "Erro ao carregar tarefas",
        description: tasksError.message || "Falha ao carregar tarefas",
        variant: "destructive",
      });
    }
  }, [projectError, agentsError, tasksError, toast]);

  // Auto-create workflow from agent
  useEffect(() => {
    if (agentId && projectId && agents.length > 0) {
      createWorkflowFromAgent(agentId);
    }
  }, [agentId, projectId, agents.length, createWorkflowFromAgent]);

  // Auto-create workflow from task
  useEffect(() => {
    if (taskId && projectId && tasks.length > 0 && agents.length > 0) {
      createWorkflowFromTask(taskId);
    }
  }, [taskId, projectId, tasks.length, agents.length, createWorkflowFromTask]);

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

  // Update nodes when agents/tasks change
  useEffect(() => {
    if (project && (agents.length > 0 || tasks.length > 0)) {
      console.log('Updating nodes with agents:', agents.length, 'tasks:', tasks.length);

      // Only create new nodes if we don't have any nodes yet
      if (nodes.length === 0) {
        const { nodes: newNodes, edges: newEdges } = createNodesFromData(
          agents,
          tasks,
          false, // no animation for updates
          new Set() // no creating nodes for updates
        );

        setNodes(newNodes as ReactFlowNode[]);
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
      } else {
        // Just update the status of existing nodes without recreating them
        setNodes(prevNodes => prevNodes.map(node => {
          const isNodeRunning = runningNodes.has(node.id);
          const dataWithRunning = {
            ...node.data,
            isRunning: isNodeRunning,
          } as NodeData & { executionResult?: string };

          if (isNodeRunning) {
            return {
              ...node,
              data: {
                ...dataWithRunning,
                status: 'running',
              },
            };
          }

          if (currentExecution?.status === 'completed') {
            return {
              ...node,
              data: {
                ...dataWithRunning,
                status: 'completed',
                executionResult: latestExecutionResult || dataWithRunning.executionResult,
              },
            };
          }

          if (executionHasFailed) {
            return {
              ...node,
              data: {
                ...dataWithRunning,
                status: 'failed',
              },
            };
          }

          return {
            ...node,
            data: {
              ...dataWithRunning,
              status: 'idle',
              executionResult: dataWithRunning.executionResult,
            },
          };
        }));

        // Update edge animations
        setEdges(prevEdges => prevEdges.map(edge => ({
          ...edge,
          animated: currentExecution?.status === 'running',
        })));
      }
    }
  }, [project, agents, tasks, runningNodes, currentExecution, layoutDirection, createNodesFromData, setEdges, setNodes, reactFlowInstance]);

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

      // Only process if it's for the current project and not already creating
      if (eventProjectId && String(eventProjectId) === String(projectId) && canCreateWorkflowReady) {
        console.log('Workflow created event received:', { agents, tasks, projectId });

        setGlobalIsCreatingWorkflow(true);

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

        // Reset creation state after a delay
        setTimeout(() => {
          setGlobalIsCreatingWorkflow(false);
        }, 2000);
      }
    };

    const handleExecuteWorkflow = (event: CustomEvent) => {
      const { projectId: eventProjectId } = event.detail;

      // Only process if it's for the current project and no execution is running
      if (eventProjectId && String(eventProjectId) === String(projectId) && !currentExecution && canExecuteWorkflow) {
        console.log('Executing workflow for project:', projectId);

        setGlobalIsExecuting(true);

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
  }, [projectId, queryClient, toast, canCreateWorkflowReady, canExecuteWorkflow]);

  // Auto-refresh when agents/tasks change
  useEffect(() => {
    const interval = setInterval(async () => {
      if (projectId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.agents(projectId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      }
    }, 3000); // Poll every 3 seconds for better real-time updates
    return () => clearInterval(interval);
  }, [projectId, queryClient]);

  // Robust execution status polling
  useEffect(() => {
    if (!currentExecution || !currentExecution.id) return;

    let pollCount = 0;
    const maxPolls = 60; // Maximum 2 minutes of polling

    const executionInterval = setInterval(async () => {
      try {
        pollCount++;

        // Fetch execution status
        const executionData = await apiClient.getExecution(currentExecution.id);
        setCurrentExecution(executionData);

        if (executionData.status === 'running') {
          // Simulate progressive node completion
          const allNodeIds = nodes.map(node => node.id);
          const progress = Math.min(pollCount / 10, 1); // Progress over 20 polls (40 seconds)
          const completedCount = Math.floor(progress * allNodeIds.length);

          // Update node states progressively
          allNodeIds.forEach((nodeId, index) => {
            if (index < completedCount) {
              setNodeState(nodeId, 'completed');
            } else {
              setNodeState(nodeId, 'running');
            }
          });

          // Update visual nodes
          setNodes(prevNodes => prevNodes.map(node => {
            const nodeState = nodeStates[node.id] || 'running';
            return {
              ...node,
              data: {
                ...node.data,
                status: nodeState,
              },
            };
          }));

          // Add progress message every 5 polls
          if (pollCount % 5 === 0) {
            addMessage({
              id: `exec-progress-${Date.now()}`,
              type: 'assistant',
              content: `⚡ **Progresso da Execução:**\n\n📊 **Componentes concluídos:** ${completedCount}/${allNodeIds.length}\n🔄 **Status:** Executando...\n⏱️ **Tempo:** ${pollCount * 2}s\n\n👀 **Visualização:** Cards azuis = executando, verdes = concluídos!`,
              timestamp: new Date().toISOString(),
            });
          }

} else if (executionData.status === 'completed') {
  if (lastExecutionStatusRef.current !== 'completed') {
    lastExecutionStatusRef.current = 'completed';

    const resultText = typeof (executionData.output_payload as Record<string, unknown> | undefined)?.result === 'string'
      ? String((executionData.output_payload as Record<string, unknown>).result)
      : latestExecutionResult;
    const resultSection = resultText ? `\n\nResultado:\n${resultText}` : '';

    nodes.forEach(node => {
      setNodeState(node.id, 'completed');
    });

    setNodes(prevNodes => prevNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: 'completed',
        executionResult: resultText || (node.data as Record<string, unknown>).executionResult as string | undefined,
        isRunning: false,
      },
    })));

    setRunningNodes(new Set());
    setGlobalIsExecuting(false);
    setExecutionId(null);

    addMessage({
      id: `exec-completed-${Date.now()}`,
      type: 'assistant',
      content: `Execução concluída!\n\nStatus: ${executionData.status}\nID: ${executionData.id}\nTempo total: ${pollCount * 2}s${resultSection}\n\nAbra ${executionsPath} para revisar o resultado completo.`,
      timestamp: new Date().toISOString(),
    });

    // Show result badge for completed executions
    setShowResultBadge(true);
  }

          clearInterval(executionInterval);

} else if (executionData.status === 'failed') {
  if (lastExecutionStatusRef.current !== 'failed') {
    lastExecutionStatusRef.current = 'failed';
    const payload = executionData.output_payload as Record<string, unknown> | undefined;
    const payloadErrorValue = payload ? payload['error'] : undefined;
    const payloadError = typeof payloadErrorValue === 'string'
      ? payloadErrorValue
      : payloadErrorValue
        ? JSON.stringify(payloadErrorValue)
        : '';
    const fallbackLog = executionData.logs?.split('\\n').filter(Boolean).slice(-1)[0] ?? '';
    const errorDetails = payloadError || executionData.error_message || fallbackLog || 'Execução interrompida. Verifique os logs.';

    nodes.forEach(node => {
      setNodeState(node.id, 'failed');
    });

    setNodes(prevNodes => prevNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: 'failed',
        isRunning: false,
      },
    })));

    setGlobalIsExecuting(false);
    setExecutionId(null);
    setRunningNodes(new Set());

    addMessage({
      id: `exec-error-${Date.now()}`,
      type: 'assistant',
      content: `Execução falhou.\n\nDetalhes: ${errorDetails}\nID: ${executionData.id}\nTempo: ${pollCount * 2}s\n\nVerifique os logs em ${executionsPath} e tente novamente.`,
      timestamp: new Date().toISOString(),
    });

    // Show result badge for failed executions
    setShowResultBadge(true);

    toast({
      title: 'Execução falhou',
      description: errorDetails,
      variant: 'destructive',
    });
  }

  clearInterval(executionInterval);
}

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          clearInterval(executionInterval);
          addMessage({
            id: `exec-timeout-${Date.now()}`,
            type: 'assistant',
            content: `⏰ **Timeout da Execução**\n\n🕐 **Status:** Tempo limite atingido\n📊 **Resultado:** Execução pode estar ainda rodando\n🆔 **ID:** ${currentExecution.id}\n\n🔧 **Ação:** Verifique o status manualmente.`,
            timestamp: new Date().toISOString(),
          });
        }

      } catch (error) {
        console.error('Error fetching execution status:', error);

        // On error, mark as failed
        nodes.forEach(node => {
          setNodeState(node.id, 'failed');
        });

        setNodes(prevNodes => prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            status: 'failed',
            isRunning: false,
          },
        })));

        setGlobalIsExecuting(false);
        setExecutionId(null);
        setRunningNodes(new Set());
        lastExecutionStatusRef.current = 'error';

        addMessage({
          id: `exec-error-${Date.now()}`,
          type: 'assistant',
          content: `❌ **Erro na Verificação**\n\n🚨 **Falha:** Erro ao verificar status da execução\n📊 **Status:** Todos os componentes marcados como falharam\n\n🔧 **Ação:** Verifique a conexão e tente novamente.`,
          timestamp: new Date().toISOString(),
        });

        clearInterval(executionInterval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(executionInterval);
  }, [currentExecution?.id, nodes, nodeStates, setGlobalIsExecuting, setExecutionId, setNodeState]);


  // Cleanup execution state when execution completes
  useEffect(() => {
    if (currentExecution?.status === 'completed' || currentExecution?.status === 'failed') {
      const timer = setTimeout(() => {
        setCurrentExecution(null);
        setRunningNodes(new Set());
      }, 5000); // Clear after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [currentExecution]);


  const runMutation = useMutation({
    mutationFn: (inputs: Record<string, unknown>) =>
      apiClient.run.project(Number(projectId), { inputs, language: resolveExecutionLanguage() }),
    onSuccess: (data: Execution) => {
      setCurrentExecution(data);
      setExecutionId(data.id);
      setGlobalIsExecuting(true);
      lastExecutionStatusRef.current = data.status || 'running';

      resetNodeStates();

      const allNodeIds = nodes.map(node => node.id);
      allNodeIds.forEach(nodeId => setNodeState(nodeId, 'running'));
      setRunningNodes(new Set(allNodeIds));

      setNodes(prevNodes => prevNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: 'running',
          isRunning: true,
        },
      })));

      addMessage({
        id: `exec-id-${data.id}`,
        type: 'assistant',
        content: `🚀 **Execução iniciada!**

🆔 **ID:** ${data.id}
📊 **Status:** ${data.status}

Acompanhe o progresso diretamente nos cards do editor visual.`,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: 'Workflow executado',
        description: `Execução iniciada com ID: ${data.id}`,
      });
    },
    onError: (error: Error) => {
      setGlobalIsExecuting(false);
      setExecutionId(null);
      resetNodeStates();
      setRunningNodes(new Set());
      lastExecutionStatusRef.current = 'error';

      setNodes(prevNodes => prevNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: 'failed',
          isRunning: false,
        },
      })));

      addMessage({
        id: `exec-error-${Date.now()}`,
        type: 'assistant',
        content: `Erro ao iniciar o workflow.

Detalhes: ${error.message || 'Erro desconhecido'}`,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: 'Erro',
        description: 'Falha ao executar workflow',
        variant: 'destructive',
      });
    },
  });

  const handleRunWorkflow = useCallback(() => {
    if (!projectId) {
      toast({
        title: "Erro",
        description: "ID do projeto não encontrado",
        variant: "destructive",
      });
      return;
    }

    if (!canExecuteWorkflow || currentExecution) {
      toast({
        title: "Execução em andamento",
        description: "Aguarde a execução atual terminar",
        variant: "destructive",
      });
      return;
    }

    const inputs = {}; // TODO: collect inputs from UI if available

    // Add message to chat about execution starting
    addMessage({
      id: `exec-start-${Date.now()}`,
      type: 'assistant',
      content: '🚀 **Iniciando execução do workflow...**\n\n📊 **Status dos componentes:**\n• Agentes: Aguardando execução\n• Tarefas: Aguardando execução\n\n⚡ **Acompanhe o progresso em tempo real nos cards do editor visual!**',
      timestamp: new Date().toISOString()
    });

    // Start execution
    runMutation.mutate(inputs);
  }, [projectId, canExecuteWorkflow, currentExecution, toast, addMessage, runMutation]);

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
  // Handle multi-selection with Ctrl/Cmd key
  if (event.ctrlKey || event.metaKey) {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });
  } else {
    setSelectedNode(node);
    setSelectedNodes(new Set([node.id]));
    // Only auto-open inspector on desktop (lg screens and up)
    if (window.innerWidth >= 1024) {
      setIsInspectorOpen(true);
    }
  }
}, []);

// Function to delete selected nodes and their connections
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

// Function to clear all nodes
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

const handleValidate = useCallback(() => {
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
}, [nodes, edges, toast]);

const handleAutoLayout = useCallback(() => {
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
}, [nodes, edges, layoutDirection, setNodes, setEdges, reactFlowInstance, toast]);

const handleExportPNG = useCallback(() => {
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
}, [projectId, exportMutation, toast]);

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
      {/* Status Panel */}
      {showStatusPanel && (
        <Panel position="top-center" className="bg-green-100 dark:bg-green-900 rounded-lg shadow-lg border border-green-300 dark:border-green-700 m-4 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              {globalIsCreatingWorkflow ? (
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
              ) : globalIsExecuting ? (
                <Zap className="h-4 w-4 text-white animate-spin" />
              ) : (
                <Play className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                {globalIsCreatingWorkflow ? 'Criando Workflow...' :
                  globalIsExecuting ? 'Executando Workflow...' :
                    'Workflow em Execução'}
              </div>
              <div className="text-xs text-green-600 dark:text-green-300">
                {globalIsCreatingWorkflow ? 'Aguarde enquanto o novo fluxo é criado' :
                  globalIsExecuting ? 'Processando agentes e tarefas' :
                    `ID: ${currentExecution?.id} - Status: ${currentExecution?.status}`}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Result Panel */}
      {showResultPanel && currentExecution && (
        <Panel position="top-center" className="w-full max-w-4xl mx-auto m-4">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseResultPanel}
              className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <ResultPanel
              execution={currentExecution}
              onNavigateToExecutions={handleNavigateToExecutions}
            />
          </div>
        </Panel>
      )}

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
              <Button
                onClick={() => {
                  setSelectedNodes(new Set());
                  setSelectedNode(null);
                  setIsInspectorOpen(false);
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
              <Button
                onClick={deleteSelectedNodes}
                variant="destructive"
                size="sm"
                className="text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar ({selectedNodes.size})
              </Button>
            </div>
          </div>
        </Panel>
      )}


      {/* Clean Toolbar */}
      <Panel position="top-left" className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 m-4">
        <div className="flex flex-col gap-2">
          {/* Main Actions */}
          <div className="flex gap-2">
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

            <Button
              onClick={() => clearAllAgentsAndTasks(projectId)}
              variant="outline"
              size="sm"
              title="Limpar todos os agentes e tasks"
              className="text-xs md:text-sm"
              disabled={!projectId || (agents.length === 0 && tasks.length === 0)}
            >
              <Trash2 className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
              <span className="hidden md:inline">Limpar Tudo</span>
            </Button>


            {/* Separator */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            <Button
              onClick={handleRunWorkflow}
              className="btn-primary gap-1 md:gap-2"
              size="sm"
              disabled={runMutation.isPending || !projectId || currentExecution?.status === 'running' || globalIsExecuting || globalIsCreatingWorkflow}
              title={!projectId ? "Selecione um projeto primeiro" : "Executar workflow"}
            >
              <Play className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm">
                {runMutation.isPending || globalIsExecuting ? 'Executando...' :
                  globalIsCreatingWorkflow ? 'Criando...' :
                    currentExecution?.status === 'running' ? 'Executando...' : 'Executar'}
              </span>
            </Button>
          </div>

          {/* Selection Actions */}
          {nodes.length > 0 && (
            <>
              <Separator className="my-1" />
              <div className="flex gap-2">
                {/* Select All Button */}
                {selectedNodes.size < nodes.length && (
                  <div className="flex gap-1">
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
                      className="text-xs md:text-sm"
                    >
                      <CheckSquare className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                      <span className="hidden md:inline">Todos</span>
                    </Button>

                    {/* Select Agents Only */}
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
                        className="text-xs md:text-sm"
                      >
                        <Users className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                        <span className="hidden md:inline">Agentes</span>
                      </Button>
                    )}

                    {/* Select Tasks Only */}
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
                        className="text-xs md:text-sm"
                      >
                        <CheckSquare className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                        <span className="hidden md:inline">Tasks</span>
                      </Button>
                    )}
                  </div>
                )}

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
                    className="text-xs md:text-sm"
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
                    className="text-xs md:text-sm"
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                    <span className="hidden md:inline">
                      Eliminar ({selectedNodes.size})
                    </span>
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Execution Status */}
          {currentExecution && (
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${currentExecution.status === 'running' ? 'bg-green-500 animate-pulse' :
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
            {typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && (
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
                  onClick={clearAllNodes}
                  variant="ghost"
                  size="sm"
                  disabled={nodes.length === 0}
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

    {/* Result Badge */}
    {showResultBadge && currentExecution && (
      <ResultBadge
        execution={currentExecution}
        onShowResult={handleShowResultPanel}
        onNavigateToExecutions={handleNavigateToExecutions}
      />
    )}
  </div>
);
}

export default function VisualEditor() {
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <VisualEditorContent />
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}
