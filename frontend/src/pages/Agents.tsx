import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  User,
  Brain,
  Zap,
  Edit,
  Trash2,
  Copy,
  Play,
  Settings,
  Users,
  MessageSquare,
  Target,
  Wrench,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { NewAgentModal } from '@/components/modals/new-agent-modal';
import { EditAgentModal } from '@/components/modals/edit-agent-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient, queryKeys } from '@/lib/api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

export default function Agents() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [executingAgent, setExecutingAgent] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects()
  });

  // Set selected project from query param
  useEffect(() => {
    const pid = new URLSearchParams(location.search).get('projectId');
    if (pid) setSelectedProjectId(pid);
  }, [location.search]);

  // Set default project if none selected
  useEffect(() => {
    if (!selectedProjectId && Array.isArray(projects) && projects.length) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects, selectedProjectId]);

  const { data: agentsData } = useQuery({
    queryKey: selectedProjectId ? queryKeys.agents(selectedProjectId) : ['agents', '-'],
    queryFn: () => apiClient.getProjectAgents(selectedProjectId),
    enabled: !!selectedProjectId,
  });
  const agents = (Array.isArray(agentsData) ? agentsData : []) as any[];

  const filteredAgents = agents.filter(agent => (
    (agent.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.goal || '').toLowerCase().includes(searchTerm.toLowerCase())
  ));

  // Mutation for executing individual agent
  const executeAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) throw new Error('Agente não encontrado');
      
      // Create a simple task for the agent
      const taskData = {
        description: `Execução individual do agente ${agent.name}`,
        expected_output: 'Resultado da execução do agente',
        agent_id: agentId,
        async_execution: false
      };
      
      // Execute the agent through the project
      const execution = await apiClient.run.project(Number(selectedProjectId), { 
        inputs: { task: taskData },
        language: 'pt'
      });

      // Poll for completion if status is running
      if (execution.status === 'running') {
        return await pollExecutionCompletion(execution.id);
      }
      
      return execution;
    },
    onSuccess: (data) => {
      setExecutionResult(data);
      setExecutingAgent(null);
      toast({
        title: "Agente Executado",
        description: "Execução concluída com sucesso!",
      });
    },
    onError: (error: Error) => {
      setExecutingAgent(null);
      toast({
        title: "Erro na Execução",
        description: error.message || "Falha ao executar o agente",
        variant: "destructive",
      });
    },
  });

  // Function to poll execution completion
  const pollExecutionCompletion = async (executionId: number): Promise<any> => {
    const maxAttempts = 30; // 30 attempts = 30 seconds max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const execution = await apiClient.getExecution(executionId);
        
        if (execution.status === 'completed' || execution.status === 'failed') {
          return execution;
        }
        
        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.error('Error polling execution:', error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Execução não foi concluída no tempo esperado');
  };


  const handleAgentAction = (action: string, agentId: string) => {
    const agent = agents.find(a => a.id === agentId);

    switch (action) {
      case 'test':
        if (!selectedProjectId) {
          toast({
            title: "Erro",
            description: "Selecione um projeto antes de executar o agente",
            variant: "destructive",
          });
          return;
        }
        setExecutingAgent(agentId);
        executeAgentMutation.mutate(agentId);
        break;
      case 'visual-editor':
        if (!selectedProjectId) {
          toast({
            title: "Erro",
            description: "Selecione um projeto antes de abrir o editor visual",
            variant: "destructive",
          });
          return;
        }
        navigate(`/app/editor?projectId=${selectedProjectId}&agentId=${agentId}`);
        toast({
          title: "Editor Visual",
          description: `Abrindo editor visual com o agente ${agent?.name}`,
        });
        break;
      case 'edit':
        setEditingAgent(agent);
        setIsEditDialogOpen(true);
        break;
      case 'duplicate':
        toast({
          title: "Agente Duplicado",
          description: `${agent?.name} foi duplicado com sucesso`,
        });
        break;
      case 'delete':
        setDeleteTarget(agent);
        break;
    }
  };

  const confirmDeleteAgent = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.deleteAgent(String(deleteTarget.id));
      await qc.invalidateQueries({ queryKey: queryKeys.agents(selectedProjectId) });
      setDeleteTarget(null);
      toast({
        title: "Agente Removido",
        description: `${deleteTarget.name} foi removido permanentemente`,
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o agente",
        variant: "destructive",
      });
    }
  };

  const getAgentInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const availableTools = [
    'WebSearchTool', 'EmailTool', 'SlackChannelTool', 'CodeInterpreterTool',
    'GitHubSearchTool', 'DatabaseTool', 'NotionTool', 'SerperDevTool',
    'TwitterTool', 'FileReadTool', 'FileWriteTool', 'CalculatorTool',
    'StoryGeneratorTool', 'ContentOptimizerTool', 'CreativeWritingTool'
  ];

  const predefinedRoles = [
    'Creative Writer', 'Story Architect', 'Content Strategist', 'Character Developer',
    'Plot Designer', 'Dialogue Specialist', 'World Builder', 'Genre Expert',
    'Content Editor', 'Social Media Manager', 'Marketing Specialist', 'Data Analyst'
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 sm:p-6 lg:p-8 border border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Agentes por Projeto
              </span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
              Gerencie seus agentes organizados por projeto • {filteredAgents.length} agente{filteredAgents.length !== 1 ? 's' : ''} ativo{filteredAgents.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 self-start lg:self-center">
            <NewAgentModal
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              projectId={selectedProjectId}
            />

            <EditAgentModal
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              agent={editingAgent}
              projectId={selectedProjectId}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Agente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Tem certeza que deseja excluir o agente "{deleteTarget?.name}"? Todas as tasks associadas serão removidas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={confirmDeleteAgent}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              className="btn-primary gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group self-start sm:self-center"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="hidden sm:inline">Novo Agente</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Project Selector and Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar agentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 input-notion"
            />
          </div>
          <Button variant="outline" className="gap-2 h-10 justify-center sm:justify-start">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>

        {/* Modern Project Selector */}
        {Array.isArray(projects) && projects.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pointer-events-none">
              <FolderOpen className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium text-foreground/80">Selecionar Projeto</Label>
            </div>

            {projects.length <= 6 ? (
              // Layout horizontal para poucos projetos
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {projects.map((project: any) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(String(project.id))}
                    className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 text-sm ${selectedProjectId === String(project.id)
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/20'
                      : 'border-border hover:border-primary/50 bg-card hover:bg-primary/5'
                      }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${selectedProjectId === String(project.id)
                        ? 'bg-primary animate-pulse'
                        : 'bg-muted-foreground/50 hover:bg-primary/70'
                        }`} />
                      <div className="text-left min-w-0">
                        <div className={`text-xs sm:text-sm font-medium transition-colors duration-200 truncate ${selectedProjectId === String(project.id)
                          ? 'text-primary'
                          : 'text-foreground hover:text-primary'
                          }`}>
                          {project.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 sm:gap-2">
                          <Users className="h-3 w-3" />
                          <span className="hidden sm:inline">{project.agents_count || 0} agentes</span>
                          <span className="sm:hidden">{project.agents_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // Dropdown moderno para muitos projetos
              <div className="relative">
                <button
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl hover:border-primary/50 transition-all duration-200 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FolderOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {projects.find((p: any) => String(p.id) === selectedProjectId)?.name || 'Selecionar projeto'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {projects.find((p: any) => String(p.id) === selectedProjectId)?.agents_count || 0} agentes
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isProjectDropdownOpen ? 'rotate-180' : ''
                    }`} />
                </button>

                {isProjectDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                    {projects.map((project: any) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProjectId(String(project.id));
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl ${selectedProjectId === String(project.id) ? 'bg-primary/5 border-l-4 border-primary' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${selectedProjectId === String(project.id)
                            ? 'bg-primary animate-pulse'
                            : 'bg-muted-foreground/50'
                            }`} />
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm font-medium ${selectedProjectId === String(project.id) ? 'text-primary' : 'text-foreground'
                              }`}>
                              {project.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              {project.agents_count || 0} agentes • {project.tasks_count || 0} tasks
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 hover:from-card hover:to-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
            {/* Decorative gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

            <CardHeader className="pb-3 sm:pb-4 relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold text-sm sm:text-lg group-hover:scale-110 transition-transform duration-300">
                        {getAgentInitials(agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Status indicator */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-background rounded-full animate-pulse" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text group-hover:from-primary group-hover:to-primary/80 transition-all duration-300 truncate">
                      {agent.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                        <User className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="font-medium text-primary truncate">{agent.role}</span>
                      </div>
                    </CardDescription>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      onClick={() => handleAgentAction('test', agent.id)} 
                      className="gap-2"
                      disabled={executingAgent === agent.id || executeAgentMutation.isPending}
                    >
                      <Play className="h-4 w-4 text-green-600" />
                      <span>
                        {executingAgent === agent.id ? 'Executando...' : 'Testar Agente'}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAgentAction('visual-editor', agent.id)} className="gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span>Editor Visual</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAgentAction('edit', agent.id)} className="gap-2">
                      <Edit className="h-4 w-4 text-blue-600" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAgentAction('duplicate', agent.id)} className="gap-2">
                      <Copy className="h-4 w-4 text-purple-600" />
                      <span>Duplicar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleAgentAction('delete', agent.id)}
                      className="gap-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 sm:space-y-4">
              {/* Goal Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md flex-shrink-0">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground/80">Objetivo</h4>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-7 line-clamp-2 group-hover:text-foreground/80 transition-colors">
                  {agent.goal}
                </p>
              </div>

              {/* Backstory Section */}
              {agent.backstory && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-md flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-foreground/80">História</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-7 line-clamp-2 group-hover:text-foreground/80 transition-colors">
                    {agent.backstory}
                  </p>
                </div>
              )}

              {/* Tools and Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pt-2 border-t border-border/50">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1.5 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all duration-200 text-xs">
                    <Brain className="h-3 w-3 text-primary" />
                    <span className="font-medium">{agent.tools?.length || 0}</span>
                    <span className="text-xs">ferramentas</span>
                  </Badge>

                  {agent.memory && (
                    <Badge variant="outline" className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5 transition-all duration-200 text-xs">
                      <Zap className="h-3 w-3" />
                      <span className="text-xs font-medium">Memória</span>
                    </Badge>
                  )}

                  {agent.allow_delegation && (
                    <Badge variant="outline" className="gap-1.5 border-orange-500/20 text-orange-600 hover:bg-orange-500/5 transition-all duration-200 text-xs">
                      <Users className="h-3 w-3" />
                      <span className="text-xs font-medium">Delegação</span>
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-green-700">Ativo</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-xs sm:text-sm"
                  onClick={() => handleAgentAction('test', agent.id)}
                  disabled={executingAgent === agent.id || executeAgentMutation.isPending}
                >
                  <Play className="h-3 w-3" />
                  {executingAgent === agent.id ? 'Executando...' : 'Testar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 hover:bg-blue-500 hover:text-white transition-all duration-200 text-xs sm:text-sm"
                  onClick={() => handleAgentAction('edit', agent.id)}
                >
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {
        filteredAgents.length === 0 && (
          <div className="text-center py-8 sm:py-12 lg:py-16">
            <div className="relative mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary/60" />
              </div>
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center animate-bounce">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {searchTerm ? 'Nenhum agente encontrado' : 'Comece criando seu primeiro agente'}
            </h3>

            <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed text-sm sm:text-base px-4">
              {searchTerm
                ? 'Tente ajustar os termos da sua busca ou remova os filtros para ver todos os agentes disponíveis.'
                : 'Agentes são os membros da sua equipe de IA. Cada um tem habilidades específicas e trabalha em conjunto para completar tarefas complexas.'
              }
            </p>

            {!searchTerm && (
              <div className="space-y-4">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="btn-primary gap-2 sm:gap-3 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  Criar Primeiro Agente
                </Button>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Organize por projetos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Configure ferramentas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Defina objetivos claros</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }

      {/* Execution Result Modal */}
      <Dialog open={!!executionResult} onOpenChange={() => setExecutionResult(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resultado da Execução
            </DialogTitle>
            <DialogDescription>
              Resultado da execução individual do agente
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-4">
              {/* Status e Informações Básicas */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Status da Execução:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={executionResult?.status === 'completed' ? 'default' : 'destructive'}>
                      {executionResult?.status || 'Desconhecido'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono">{executionResult?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projeto:</span>
                    <span className="font-mono">{executionResult?.project_id}</span>
                  </div>
                </div>
              </div>

              {/* Resultado Principal */}
              {executionResult?.output_payload?.result && (
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Resultado:</h4>
                  <pre className="whitespace-pre-wrap text-sm font-mono text-green-800 dark:text-green-200">
                    {typeof executionResult.output_payload.result === 'string' 
                      ? executionResult.output_payload.result 
                      : JSON.stringify(executionResult.output_payload.result, null, 2)
                    }
                  </pre>
                </div>
              )}

              {/* Logs */}
              {executionResult?.logs && (
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Logs:</h4>
                  <pre className="whitespace-pre-wrap text-sm font-mono text-blue-800 dark:text-blue-200">
                    {executionResult.logs}
                  </pre>
                </div>
              )}

              {/* Erro */}
              {executionResult?.error_message && (
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-red-800 dark:text-red-200">Erro:</h4>
                  <pre className="whitespace-pre-wrap text-sm font-mono text-red-800 dark:text-red-200">
                    {executionResult.error_message}
                  </pre>
                </div>
              )}

              {/* Dados Completos (para debug) */}
              <details className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
                <summary className="font-semibold cursor-pointer text-gray-800 dark:text-gray-200">
                  Dados Completos (Debug)
                </summary>
                <pre className="whitespace-pre-wrap text-xs font-mono text-gray-700 dark:text-gray-300 mt-2">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              </details>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setExecutionResult(null)}
            >
              Fechar
            </Button>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(
                  typeof executionResult?.result === 'string' 
                    ? executionResult.result 
                    : JSON.stringify(executionResult, null, 2)
                );
                toast({
                  title: "Copiado!",
                  description: "Resultado copiado para a área de transferência",
                });
              }}
            >
              Copiar Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
