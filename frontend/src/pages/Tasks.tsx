import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  CheckSquare,
  Clock,
  User,
  Edit,
  Trash2,
  Copy,
  Play,
  Settings,
  FileText,
  Target,
  Workflow,
  Calendar,
  AlertCircle,
  FolderOpen,
  Users,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient, queryKeys } from '@/lib/api';
import { NewTaskModal } from '@/components/modals/new-task-modal';
import { EditTaskModal } from '@/components/modals/edit-task-modal';

export default function Tasks() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [recentlyDuplicated, setRecentlyDuplicated] = useState<Set<string>>(new Set());
  const [executingTasks, setExecutingTasks] = useState<Set<string>>(new Set());
  const [newTask, setNewTask] = useState({
    project_id: '',
    description: '',
    expected_output: '',
    agent_id: '',
    tools: [] as string[],
    async_execution: false,
    output_file: ''
  });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Fetch data from API
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => apiClient.getProjects(),
  });

  // Set default project if none selected
  useEffect(() => {
    if (!selectedProjectId && Array.isArray(projects) && projects.length) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects, selectedProjectId]);

  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: queryKeys.tasks(selectedProjectId || 'all'),
    queryFn: () => selectedProjectId ? apiClient.getProjectTasks(selectedProjectId) : Promise.resolve([]),
    enabled: !!selectedProjectId,
  });

  const { data: allAgents = [], isLoading: agentsLoading } = useQuery({
    queryKey: queryKeys.agents(selectedProjectId || 'all'),
    queryFn: () => selectedProjectId ? apiClient.getProjectAgents(selectedProjectId) : Promise.resolve([]),
    enabled: !!selectedProjectId,
  });

  const filteredTasks = (allTasks as any[]).filter(task => {
    const agent = (allAgents as any[]).find(a => a.id === task.agent_id);

    return (
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.expected_output.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateTask = async () => {
    if (!selectedProjectId || !newTask.description || !newTask.expected_output || !newTask.agent_id) {
      toast({
        title: "Campos Obrigatórios",
        description: "Selecione um projeto e preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditMode && editingTask) {
        // Update existing task
        await apiClient.updateTask(String(editingTask.id), {
          ...newTask,
          project_id: selectedProjectId,
        });

        // Remove duplicated badge when task is edited
        setRecentlyDuplicated(prev => {
          const newSet = new Set(prev);
          newSet.delete(String(editingTask.id));
          return newSet;
        });

        toast({
          title: "Task Atualizada",
          description: "Task foi atualizada com sucesso",
        });
      } else {
        // Create new task
        await apiClient.createTask(selectedProjectId, {
          ...newTask,
          project_id: selectedProjectId,
        });

        toast({
          title: "Task Criada",
          description: "Nova task foi criada com sucesso",
        });
      }

      setIsCreateDialogOpen(false);
      setIsEditMode(false);
      setEditingTask(null);
      setNewTask({
        project_id: '',
        description: '',
        expected_output: '',
        agent_id: '',
        tools: [],
        async_execution: false,
        output_file: ''
      });

      await qc.invalidateQueries({ queryKey: queryKeys.tasks(selectedProjectId) });
    } catch (error) {
      toast({
        title: "Erro",
        description: isEditMode ? "Falha ao atualizar task" : "Falha ao criar task",
        variant: "destructive",
      });
    }
  };

  const handleTaskAction = async (action: string, taskId: string, taskObj?: any) => {
    const task = taskObj || (allTasks as any[]).find(t => String(t.id) === String(taskId));

    switch (action) {
      case 'visual-editor':
        if (!selectedProjectId) {
          toast({
            title: "Erro",
            description: "Selecione um projeto antes de abrir o editor visual",
            variant: "destructive",
          });
          return;
        }
        navigate(`/app/editor?projectId=${selectedProjectId}&taskId=${taskId}`);
        toast({
          title: "Editor Visual",
          description: `Abrindo editor visual com a task "${task?.description}"`,
        });
        break;
      case 'run':
        try {
          setExecutingTasks(prev => new Set(prev).add(taskId));
          const execution = await apiClient.executeTask(taskId, {
            inputs: {},
            language: 'pt'
          });
          toast({
            title: "Task Executada",
            description: `Task iniciada com sucesso. ID da execução: ${(execution as any).id}`,
          });
          // Redirect to executions page or show execution details
        } catch (error) {
          console.error('Error executing task:', error);
          toast({
            title: "Erro na Execução",
            description: "Não foi possível executar a task",
            variant: "destructive",
          });
        } finally {
          setExecutingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
        }
        break;
      case 'edit':
        if (task) {
          setEditingTask(task);
          setNewTask({
            project_id: String(task.project_id),
            description: task.description,
            expected_output: task.expected_output || '',
            agent_id: String(task.agent_id),
            tools: task.tools || [],
            async_execution: !!task.async_execution,
            output_file: task.output_file || ''
          });
          setIsEditMode(true);
          setIsCreateDialogOpen(true);
        }
        break;
      case 'duplicate':
        duplicateTask(taskId);
        break;
      case 'delete':
        setDeleteTarget(task);
        break;
    }
  };

  const duplicateTask = async (taskId: string) => {
    try {
      const original = (allTasks as any[]).find(t => String(t.id) === String(taskId));
      if (!original) return;

      // Create duplicate with same description
      const duplicated = await apiClient.createTask(String(original.project_id), {
        description: original.description,
        expected_output: original.expected_output || '',
        agent_id: original.agent_id,
        tools: original.tools || [],
        async_execution: !!original.async_execution,
        output_file: original.output_file || '',
      });

      // Refresh tasks list
      await qc.invalidateQueries({ queryKey: queryKeys.tasks(selectedProjectId) });

      // Mark as recently duplicated for visual indicator
      setRecentlyDuplicated(prev => new Set([...prev, (duplicated as any).id]));

      toast({
        title: "Task Duplicada",
        description: "Task foi duplicada com sucesso",
      });
    } catch (error) {
      console.error('Error duplicating task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar a task",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const projectId = String(deleteTarget.project_id);
    console.log('Deleting task:', deleteTarget.id);
    try {
      await apiClient.deleteTask(String(deleteTarget.id));
      console.log('Task deleted successfully');
      setDeleteTarget(null);
      await qc.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      toast({
        title: "Task Removida",
        description: "Task foi removida permanentemente",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a task",
        variant: "destructive",
      });
    }
  };

  const getTaskStatusColor = (task: any) => {
    const hasAgent = (allAgents as any[]).find(a => a.id === task.agent_id);
    return hasAgent ? 'bg-accent-green' : 'bg-warning';
  };

  const availableTools = [
    'WebSearchTool', 'EmailTool', 'SlackChannelTool', 'CodeInterpreterTool',
    'GitHubSearchTool', 'DatabaseTool', 'NotionTool', 'SerperDevTool',
    'TwitterTool', 'FileReadTool', 'FileWriteTool', 'CalculatorTool'
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* New Task Modal */}
      <NewTaskModal
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={selectedProjectId}
      />

      <EditTaskModal
        open={isEditMode}
        onOpenChange={(open) => {
          setIsEditMode(open);
          if (!open) {
            setEditingTask(null);
          }
        }}
        task={editingTask}
        projectId={selectedProjectId}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível. Tem certeza que deseja excluir a task "{deleteTarget?.description}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 sm:p-6 lg:p-8 border border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
                <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Tasks
              </span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
              Gerencie as tarefas dos seus agentes criativos • {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} encontrado{filteredTasks.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 self-start lg:self-center">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!selectedProjectId}
              className="btn-primary gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group self-start sm:self-center"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="hidden sm:inline">Nova Task</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Project Selector */}
      {Array.isArray(projects) && projects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pointer-events-none">
            <FolderOpen className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium text-foreground/80">Selecionar Projeto</Label>
          </div>

          {(projects as any[]).length <= 6 ? (
            // Layout horizontal para poucos projetos
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {(projects as any[]).map((project: any) => (
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
                        <CheckSquare className="h-3 w-3" />
                        <span className="hidden sm:inline">{project.tasks_count || 0} tasks</span>
                        <span className="sm:hidden">{project.tasks_count || 0}</span>
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
                      {(projects as any[]).find((p: any) => String(p.id) === selectedProjectId)?.name || 'Selecionar projeto'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(projects as any[]).find((p: any) => String(p.id) === selectedProjectId)?.tasks_count || 0} tasks
                    </div>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isProjectDropdownOpen ? 'rotate-180' : ''
                  }`} />
              </button>

              {isProjectDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                  {(projects as any[]).map((project: any) => (
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
                            <CheckSquare className="h-3 w-3" />
                            {project.tasks_count || 0} tasks • {project.agents_count || 0} agentes
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 input-notion"
          />
        </div>
        <Button variant="outline" className="gap-2 h-10 justify-center sm:justify-start">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredTasks.map((task: any) => {
          const project = (projects as any[]).find(p => p.id === task.project_id);
          const agent = (allAgents as any[]).find(a => a.id === task.agent_id);

          return (
            <Card key={task.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 hover:from-card hover:to-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
              {/* Decorative gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

              <CardHeader className="pb-3 sm:pb-4 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text group-hover:from-primary group-hover:to-primary/80 transition-all duration-300 truncate">
                        Task #{task.id}
                      </CardTitle>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{agent?.name}</span>
                        </div>
                        <div className="hidden sm:block w-1 h-1 bg-muted-foreground/50 rounded-full flex-shrink-0"></div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FolderOpen className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{project?.name}</span>
                        </div>
                        {recentlyDuplicated.has(task.id) && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 animate-pulse flex-shrink-0">
                            <Copy className="h-3 w-3 mr-1" />
                            Duplicada
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs sm:text-sm leading-relaxed group-hover:text-foreground/80 transition-colors line-clamp-2">
                        {task.description}
                      </CardDescription>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/10 hover:text-primary flex-shrink-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleTaskAction('run', task.id)} className="gap-2">
                        <Play className="h-4 w-4 text-green-600" />
                        <span>Executar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTaskAction('visual-editor', task.id)} className="gap-2">
                        <Zap className="h-4 w-4 text-purple-600" />
                        <span>Editor Visual</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTaskAction('edit', task.id)} className="gap-2">
                        <Edit className="h-4 w-4 text-blue-600" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTaskAction('duplicate', task.id)} className="gap-2">
                        <Copy className="h-4 w-4 text-purple-600" />
                        <span>Duplicar</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleTaskAction('delete', task.id, task)}
                        className="gap-2 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remover</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4">
                {/* Expected Output */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-md flex-shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-foreground/80">Resultado Esperado</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-7 line-clamp-2 group-hover:text-foreground/80 transition-colors">
                    {task.expected_output}
                  </p>
                </div>

                {/* Tools and Settings */}
                <div className="space-y-3">
                  {task.tools && task.tools.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                      <Settings className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-primary">{task.tools.length}</div>
                        <div className="text-xs text-primary/80">ferramentas</div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {task.async_execution ? 'Assíncrono' : 'Síncrono'}
                      </span>
                    </div>
                    {task.output_file && (
                      <Badge variant="secondary" className="gap-1.5 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all duration-200 text-xs flex-shrink-0">
                        <FileText className="h-3 w-3" />
                        {task.output_file}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-xs sm:text-sm"
                    onClick={() => handleTaskAction('run', task.id)}
                    disabled={executingTasks.has(task.id)}
                  >
                    {executingTasks.has(task.id) ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Executando...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        Executar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 hover:bg-blue-500 hover:text-white transition-all duration-200 text-xs sm:text-sm"
                    onClick={() => handleTaskAction('edit', task.id)}
                  >
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && !tasksLoading && (
        <div className="text-center py-8 sm:py-12 lg:py-16">
          <div className="relative mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:h-12 text-primary/60" />
            </div>
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center animate-bounce">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {searchTerm ? 'Nenhuma task encontrada' : 'Comece criando sua primeira task'}
          </h3>

          <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed text-sm sm:text-base px-4">
            {searchTerm
              ? 'Tente ajustar os termos da sua busca ou remova os filtros para ver todas as tasks disponíveis.'
              : 'Tasks são as unidades de trabalho que seus agentes executam. Cada task tem um objetivo claro e pode usar ferramentas específicas.'
            }
          </p>

          {!searchTerm && (
            <div className="space-y-4">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="btn-primary gap-2 sm:gap-3 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Criar Primeira Task
              </Button>

              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Defina objetivos claros</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Configure ferramentas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Atribua aos agentes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t">
        <div className="text-center">
          <div className="text-2xl font-semibold text-heading">{(allTasks as any[]).length}</div>
          <div className="text-sm text-muted-foreground">Total de Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-heading">
            {(allTasks as any[]).filter(t => (allAgents as any[]).find(a => a.id === t.agent_id)).length}
          </div>
          <div className="text-sm text-muted-foreground">Com Agente</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-heading">
            {(allTasks as any[]).filter(t => t.async_execution).length}
          </div>
          <div className="text-sm text-muted-foreground">Assíncronas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-heading">
            {(allTasks as any[]).filter(t => t.tools && t.tools.length > 0).length}
          </div>
          <div className="text-sm text-muted-foreground">Com Ferramentas</div>
        </div>
      </div>
    </div>
  );
}
