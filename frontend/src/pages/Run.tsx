import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, Activity, FileText, Download, XCircle, Settings, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient, queryKeys } from '@/lib/api';
import type { Execution, ExecutionStatus } from '@/types/execution';
import type { Agent as AgentType } from '@/types/agent';
import type { Task as TaskType } from '@/types/task';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function Run() {
  const location = useLocation();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [language, setLanguage] = useState<'pt' | 'en' | 'es' | 'fr'>('pt');
  const [inputData, setInputData] = useState<string>('{}');
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [agentInput, setAgentInput] = useState<string>('{}');
  const [taskInput, setTaskInput] = useState<string>('{}');

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => apiClient.getProjects(),
  });

  const projectOptions = useMemo(() => Array.isArray(projects) ? projects : [], [projects]);

  useEffect(() => {
    // Preselect project from query param
    const params = new URLSearchParams(location.search);
    const pid = params.get('projectId');
    if (pid) setSelectedProject(pid);

    if (!selectedProject && projectOptions.length) {
      setSelectedProject(String(projectOptions[0].id));
    }
  }, [projectOptions, selectedProject, location.search]);

  // Load agents and tasks for selected project; propose input JSON
  useEffect(() => {
    const load = async () => {
      if (!selectedProject) return;
      try {
        const ag = await apiClient.getProjectAgents(selectedProject) as AgentType[];
        const tk = await apiClient.getProjectTasks(selectedProject) as TaskType[];
        setAgents(ag || []);
        setTasks(tk || []);
        if (!selectedAgent && ag && ag.length) setSelectedAgent(String(ag[0].id));
        if (!selectedTask && tk && tk.length) setSelectedTask(String(tk[0].id));
        // Suggest input keys from task descriptions
        const text = (tk || []).map((t: TaskType) => `${t.description} ${t.expected_output || ''}`).join(' ');
        const vars = Array.from(text.matchAll(/\{([a-zA-Z0-9_]+)\}/g)).map(m => m[1]);
        const example: Record<string, string> = {};
        const defaults: Record<string, string> = { topic: 'IA', industry: 'tecnologia', platform: 'Instagram' };
        vars.forEach(v => { example[v] = defaults[v] || 'exemplo'; });
        if (Object.keys(example).length && (!inputData || inputData.trim() === '{}')) {
          setInputData(JSON.stringify(example, null, 2));
        }
      } catch { }
    };
    load();
  }, [selectedProject]);

  const handleRunProject = async () => {
    if (!selectedProject) {
      toast({ title: 'Projeto necessário', description: 'Selecione um projeto', variant: 'destructive' });
      return;
    }

    try {
      let parsedInput: any = {};
      if (inputData.trim()) parsedInput = JSON.parse(inputData);

      // Start execution (returns running execution with id)
      const started = await apiClient.run.project(Number(selectedProject), { inputs: parsedInput, language }) as Execution;
      if (!started || !started.id) {
        throw new Error('Falha ao iniciar execução: ID não encontrado');
      }
      setCurrentExecutionId(started.id);
      // Progress starts indeterminate
      setProgress(0);
      const name = projectOptions.find((p: any) => String(p.id) === selectedProject)?.name;
      toast({ title: 'Execução iniciada', description: `${name || 'Projeto'}: Iniciando...` });
    } catch (e: any) {
      toast({ title: 'Erro na execução', description: e?.message || 'Falha ao executar', variant: 'destructive' });
    }
  };

  const handleStop = () => {
    setCurrentExecutionId(null);
    setProgress(0);
    toast({ title: 'Execução cancelada', description: 'Execução cancelada pelo usuário' });
  };

  const runAgent = async () => {
    if (!selectedAgent) return;
    try {
      const parsed = agentInput?.trim() ? JSON.parse(agentInput) : {};
      const started = await apiClient.run.agent(Number(selectedAgent), { inputs: parsed, language }) as Execution;
      if (!started || !started.id) {
        throw new Error('Falha ao iniciar execução do agente: ID não encontrado');
      }
      setCurrentExecutionId(started.id);
      setProgress(0);
      toast({ title: 'Execução de agente iniciada', description: `Agente: ${agents.find(a => String(a.id) === selectedAgent)?.name || 'Desconhecido'}` });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao executar agente', variant: 'destructive' });
    }
  };

  const runTask = async () => {
    if (!selectedTask) return;
    try {
      const parsed = taskInput?.trim() ? JSON.parse(taskInput) : {};
      const started = await apiClient.run.task(Number(selectedTask), { inputs: parsed, language }) as Execution;
      if (!started || !started.id) {
        throw new Error('Falha ao iniciar execução da task: ID não encontrado');
      }
      setCurrentExecutionId(started.id);
      setProgress(0);
      toast({ title: 'Execução de task iniciada', description: `Task: ${tasks.find(t => String(t.id) === selectedTask)?.description?.slice(0, 50) || 'Desconhecida'}` });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao executar task', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status?: ExecutionStatus) => {
    switch (status) {
      case 'completed': return <Badge className="bg-accent-green text-white">Concluído</Badge>;
      case 'error': return <Badge variant="destructive">Erro</Badge>;
      case 'running': return <Badge variant="outline">Em execução</Badge>;
      case 'created': return <Badge variant="secondary">Criado</Badge>;
      default: return <Badge variant="secondary">N/A</Badge>;
    }
  };

  const executionQuery = useQuery<Execution, Error>({
    queryKey: ['execution', currentExecutionId],
    queryFn: () => currentExecutionId ? apiClient.executions.get(Number(currentExecutionId)) as Promise<Execution> : Promise.reject(new Error('No execution ID')),
    enabled: !!currentExecutionId,
    refetchInterval: (query) => query.state.data?.status === 'running' ? 1000 : false,
    refetchIntervalInBackground: true,
    retry: 3,
  });

  // Handle query errors
  useEffect(() => {
    if (executionQuery.error) {
      toast({
        title: 'Erro ao buscar execução',
        description: executionQuery.error.message || 'Falha na conexão',
        variant: 'destructive'
      });
    }
  }, [executionQuery.error, toast]);

  const currentExecution: Execution | null = executionQuery.data ?? null;
  const isRunning = currentExecution?.status === 'running';
  const queryError = executionQuery.error;

  // Toast on status change (replaces onSuccess)
  useEffect(() => {
    if (currentExecution && !isRunning) {
      setProgress(100);
      let title = '';
      let description = '';
      const projectName = projectOptions?.find((p: any) => String(p.id) === selectedProject)?.name;
      const agentName = agents?.find((a: any) => String(a.id) === (currentExecution.agent_id || ''))?.name;
      const taskDesc = tasks?.find((t: any) => String(t.id) === (currentExecution.task_id || ''))?.description?.slice(0, 50);

      switch (currentExecution.status) {
        case 'completed':
          title = 'Execução concluída';
          description = `${projectName || agentName || taskDesc || 'Execução'}: Sucesso!`;
          break;
        case 'error':
          title = 'Erro na execução';
          description = `${projectName || agentName || taskDesc || 'Execução'}: ${currentExecution.error_message || 'Falha desconhecida'}`;
          break;
        case 'created':
          title = 'Execução criada';
          description = 'Aguardando início...';
          break;
      }
      if (title) {
        toast({ title, description, variant: currentExecution.status === 'error' ? 'destructive' : 'default' });
      }
      // Invalidate related queries if needed
      if (!isRunning) {
        queryClient.invalidateQueries({ queryKey: queryKeys.executions() });
      }
    }
  }, [currentExecution?.status, projectOptions, agents, tasks, selectedProject, toast, queryClient]);

  // Update progress based on status
  useEffect(() => {
    if (currentExecution) {
      if (currentExecution.status === 'running') {
        setProgress(50); // Indeterminate-like
      } else {
        setProgress(100);
      }
    } else if (!currentExecutionId) {
      setProgress(0);
    }
  }, [currentExecution?.status, currentExecutionId]);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2 sm:gap-3">
          <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          Executar Projetos
        </h1>
        <p className="text-muted-foreground text-sm sm:text-lg">Execute seus projetos e visualize logs e resultados em tempo real</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-8">
        <div className="xl:col-span-2 space-y-4 lg:space-y-6">
          <Card className="card-notion border-2 border-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Configuração do Projeto
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">Selecione o projeto e configure os parâmetros de execução</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Projeto</Label>
                <select
                  className="w-full p-3 sm:p-4 border-2 border-border rounded-lg bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm sm:text-base"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={loadingProjects || !projectOptions.length}
                >
                  {!projectOptions.length && <option value="">Carregando projetos...</option>}
                  {projectOptions.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Idioma de Saída</Label>
                  <select className="w-full p-3 sm:p-4 border-2 border-border rounded-lg bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm sm:text-base" value={language} onChange={(e) => setLanguage(e.target.value as any)}>
                    <option value="pt">🇧🇷 Português</option>
                    <option value="en">🇺🇸 English</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="fr">🇫🇷 Français</option>
                  </select>
                </div>
              </div>      {/* Simple task status grid */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Zap className="h-5 w-5" /> Status das Tasks</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {tasks.map((t: any) => {
                    const status = currentExecution?.status === 'running' ? 'running' : (currentExecution?.status || 'idle');
                    const color = status === 'completed' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : status === 'running' ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20' : status === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-muted text-muted-foreground border-border';
                    return (
                      <div key={t.id} className={`p-3 rounded-lg border ${color} transition-all duration-200 hover:shadow-sm`}>
                        <div className="text-sm font-medium mb-1">Task #{t.id}</div>
                        <div className="text-xs opacity-80 mb-2 line-clamp-2">{t.description?.slice(0, 60)}{t.description?.length > 60 ? '...' : ''}</div>
                        <div className="text-xs font-medium">Status: {status}</div>
                      </div>
                    );
                  })}
                  {tasks.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">Nenhuma task no projeto selecionado.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Agent and Task execution sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
                <Card className="card-notion">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Executar Agente</CardTitle>
                    <CardDescription className="text-sm">Escolha um agente do projeto e execute suas tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Agente</Label>
                      <select className="w-full p-3 border-2 border-border rounded-lg bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                        <option value="">Selecione um agente...</option>
                        {agents.map((a: any) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Parâmetros (JSON)</Label>
                      <Textarea value={agentInput} onChange={(e) => setAgentInput(e.target.value)} className="min-h-[120px] font-mono text-sm resize-none" placeholder='{"input": "valor"}' />
                    </div>
                    <Button onClick={runAgent} disabled={!selectedAgent || isRunning} className="w-full btn-primary h-11 text-sm font-medium">
                      <Play className="h-4 w-4 mr-2" /> Executar Agente
                    </Button>
                  </CardContent>
                </Card>

                <Card className="card-notion">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Executar Task</CardTitle>
                    <CardDescription className="text-sm">Execute uma task específica do projeto</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Task</Label>
                      <select className="w-full p-3 border-2 border-border rounded-lg bg-background hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm" value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                        <option value="">Selecione uma task...</option>
                        {tasks.map((t: any) => (<option key={t.id} value={t.id}>#{t.id} - {t.description?.slice(0, 40)}...</option>))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Parâmetros (JSON)</Label>
                      <Textarea value={taskInput} onChange={(e) => setTaskInput(e.target.value)} className="min-h-[120px] font-mono text-sm resize-none" placeholder='{"input": "valor"}' />
                    </div>
                    <Button onClick={runTask} disabled={!selectedTask || isRunning} variant="outline" className="w-full h-11 text-sm font-medium">
                      <Play className="h-4 w-4 mr-2" /> Executar Task
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label>Parâmetros (JSON)</Label>
                <Textarea value={inputData} onChange={(e) => setInputData(e.target.value)} className="min-h-[120px] font-mono text-sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-notion">
            <CardContent className="p-4 sm:p-6">
              {!isRunning ? (
                <Button onClick={handleRunProject} disabled={!selectedProject || executionQuery.isFetching} className="w-full btn-primary gap-2 h-12 text-base font-medium">
                  <Play className="h-5 w-5" /> Executar Projeto Completo
                </Button>
              ) : (
                <div className="space-y-4">
                  <Button onClick={handleStop} variant="destructive" className="w-full gap-2 h-12 text-base font-medium" disabled={executionQuery.isFetching}>
                    <Square className="h-5 w-5" /> Parar Execução
                  </Button>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Progresso</span>
                      <span className="text-muted-foreground">
                        {currentExecution?.status === 'running' ? 'Em andamento...' : `${progress}%`}
                      </span>
                    </div>
                    <Progress value={currentExecution?.status === 'running' ? undefined : progress} className="h-3" />
                  </div>
                  {queryError && (
                    <Alert className="border-destructive">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive text-sm">
                        Erro de conexão: {queryError.message}. Tentando reconectar...
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 xl:col-span-2 space-y-4 lg:space-y-6 xl:space-y-8">
          {currentExecution ? (
            <>
              <Card className="card-notion">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getStatusBadge(currentExecution.status)}
                    <span className="text-sm text-muted-foreground">ID: {currentExecution.id}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-muted-foreground">Projeto:</span>
                      <span className="font-medium break-all">{(currentExecution as any).project_name || selectedProject}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-muted-foreground">Início:</span>
                      <span className="break-all">{new Date(currentExecution.created_at).toLocaleString()}</span>
                    </div>
                    {currentExecution.execution_time && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-muted-foreground">Duração:</span>
                        <span>{currentExecution.execution_time}s</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {currentExecution.output_payload?.result && (
                <Card className="card-notion">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg"><Zap className="h-5 w-5" /> Resultado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted/30 p-3 sm:p-4 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {typeof currentExecution.output_payload.result === 'string'
                        ? currentExecution.output_payload.result
                        : JSON.stringify(currentExecution.output_payload.result, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {currentExecution.logs && currentExecution.logs.trim() && (
                <Card className="card-notion">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5" /> Logs</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-64 sm:max-h-96 overflow-y-auto">
                    <pre className="bg-muted/30 p-3 sm:p-4 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                      {currentExecution.logs}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {currentExecution.error_message && (
                <Alert className="border-destructive">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <strong>Erro:</strong> {currentExecution.error_message}
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Card className="card-notion">
              <CardContent className="p-6 sm:p-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-base sm:text-lg">Nenhuma execução em andamento</h3>
                <p className="text-muted-foreground text-sm">Execute um projeto, agente ou task para ver logs e resultados em tempo real</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
