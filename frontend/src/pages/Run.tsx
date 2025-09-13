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
import { useQuery } from '@tanstack/react-query';

export default function Run() {
  const location = useLocation();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [language, setLanguage] = useState<'pt'|'en'|'es'|'fr'>('pt');
  const [inputData, setInputData] = useState<string>('{}');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentExecution, setCurrentExecution] = useState<any>(null);
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
        const ag = await apiClient.getProjectAgents(selectedProject);
        const tk = await apiClient.getProjectTasks(selectedProject);
        setAgents(ag || []);
        setTasks(tk || []);
        if (!selectedAgent && ag && ag.length) setSelectedAgent(String(ag[0].id));
        if (!selectedTask && tk && tk.length) setSelectedTask(String(tk[0].id));
        // Suggest input keys from task descriptions
        const text = (tk || []).map((t: any) => `${t.description} ${t.expected_output || ''}`).join(' ');
        const vars = Array.from(text.matchAll(/\{([a-zA-Z0-9_]+)\}/g)).map(m => m[1]);
        const example: Record<string, string> = {};
        const defaults: Record<string, string> = { topic: 'IA', industry: 'tecnologia', platform: 'Instagram' };
        vars.forEach(v => { example[v] = defaults[v] || 'exemplo'; });
        if (Object.keys(example).length && (!inputData || inputData.trim() === '{}' )) {
          setInputData(JSON.stringify(example, null, 2));
        }
      } catch {}
    };
    load();
  }, [selectedProject]);

  const handleRunProject = async () => {
    if (!selectedProject) {
      toast({ title: 'Projeto necessário', description: 'Selecione um projeto', variant: 'destructive' });
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setCurrentExecution(null);

    try {
      let parsedInput: any = {};
      if (inputData.trim()) parsedInput = JSON.parse(inputData);

      const progressInterval = setInterval(() => setProgress((p) => (p >= 90 ? 90 : p + 10)), 400);
      // Start execution (returns running execution with id)
      const started = await apiClient.run.project(Number(selectedProject), { inputs: parsedInput, language });
      setCurrentExecution(started);
      // Poll until completed/error
      const poll = setInterval(async () => {
        try {
          const latest = await apiClient.executions.get(started.id);
          setCurrentExecution(latest);
          if (latest.status !== 'running') {
            clearInterval(poll);
            clearInterval(progressInterval);
            setProgress(100);
            const name = projectOptions.find((p: any) => String(p.id) === selectedProject)?.name;
            toast({ title: latest.status === 'completed' ? 'Execução concluída' : 'Execução finalizada', description: `${name || 'Projeto'}: ${latest.status}` });
          }
        } catch {}
      }, 1000);
    } catch (e: any) {
      setCurrentExecution({ status: 'error', error_message: e?.message || 'Falha na execução' });
      toast({ title: 'Erro na execução', description: e?.message || 'Falha ao executar', variant: 'destructive' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setProgress(0);
    setCurrentExecution({ status: 'cancelled', error_message: 'Execução cancelada pelo usuário' });
  };

  const runAgent = async () => {
    if (!selectedAgent) return;
    setIsRunning(true);
    setProgress(10);
    try {
      const parsed = agentInput?.trim() ? JSON.parse(agentInput) : {};
      const started = await apiClient.run.agent(Number(selectedAgent), { inputs: parsed, language });
      const poll = setInterval(async () => {
        const latest = await apiClient.executions.get(started.id);
        setCurrentExecution(latest);
        if (latest.status !== 'running') { clearInterval(poll); setIsRunning(false); setProgress(100); }
      }, 1000);
    } catch (e: any) {
      setIsRunning(false);
      toast({ title: 'Erro', description: e?.message || 'Falha ao executar agente', variant: 'destructive' });
    }
  };

  const runTask = async () => {
    if (!selectedTask) return;
    setIsRunning(true);
    setProgress(10);
    try {
      const parsed = taskInput?.trim() ? JSON.parse(taskInput) : {};
      const started = await apiClient.run.task(Number(selectedTask), { inputs: parsed, language });
      const poll = setInterval(async () => {
        const latest = await apiClient.executions.get(started.id);
        setCurrentExecution(latest);
        if (latest.status !== 'running') { clearInterval(poll); setIsRunning(false); setProgress(100); }
      }, 1000);
    } catch (e: any) {
      setIsRunning(false);
      toast({ title: 'Erro', description: e?.message || 'Falha ao executar task', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-accent-green text-white">Concluído</Badge>;
      case 'error': return <Badge variant="destructive">Erro</Badge>;
      case 'running': return <Badge variant="outline">Em execução</Badge>;
      default: return <Badge variant="secondary">N/A</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title flex items-center gap-3">
          <Activity className="h-7 w-7 text-primary" />
          Executar Projetos
        </h1>
        <p className="text-muted-foreground">Execute seus projetos e visualize logs e resultados</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" /> Configuração
              </CardTitle>
              <CardDescription>Selecione o projeto e os parâmetros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Projeto</Label>
                <select
                  className="w-full p-3 border border-border rounded-radius bg-input"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={loadingProjects || !projectOptions.length}
                >
                  {!projectOptions.length && <option value="">Carregando...</option>}
                  {projectOptions.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <select className="w-full p-3 border border-border rounded-radius bg-input" value={language} onChange={(e) => setLanguage(e.target.value as any)}>
                    <option value="pt">Português</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
        </div>
      </div>

      {/* Simple task status grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Zap className="h-5 w-5" /> Status das Tasks</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.map((t: any) => {
            const status = currentExecution?.status === 'running' ? 'running' : (currentExecution?.status || 'idle');
            const color = status === 'completed' ? 'bg-accent-green/10 text-accent-green' : status === 'running' ? 'bg-accent-yellow/10 text-accent-yellow' : status === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground';
            return (
              <div key={t.id} className={`p-3 rounded-radius border ${color}`}>
                <div className="text-sm font-medium">Task #{t.id}</div>
                <div className="text-xs opacity-80">{t.description?.slice(0, 60)}{t.description?.length>60?'...':''}</div>
                <div className="mt-2 text-xs">Status: {status}</div>
              </div>
            );
          })}
          {tasks.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhuma task no projeto selecionado.</div>
          )}
        </div>
      </div>

      {/* Agent and Task execution sections */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-notion">
          <CardHeader>
            <CardTitle>Executar Agente</CardTitle>
            <CardDescription>Escolha um agente do projeto e execute suas tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Agente</Label>
              <select className="w-full p-2 border rounded" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                {agents.map((a: any) => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Parâmetros (JSON)</Label>
              <Textarea value={agentInput} onChange={(e) => setAgentInput(e.target.value)} className="min-h-[120px] font-mono text-sm" />
            </div>
            <Button onClick={runAgent} disabled={!selectedAgent || isRunning} className="btn-primary">Executar Agente</Button>
          </CardContent>
        </Card>

        <Card className="card-notion">
          <CardHeader>
            <CardTitle>Executar Task</CardTitle>
            <CardDescription>Execute uma task específica do projeto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Task</Label>
              <select className="w-full p-2 border rounded" value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                {tasks.map((t: any) => (<option key={t.id} value={t.id}>#{t.id} - {t.description?.slice(0,40)}...</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Parâmetros (JSON)</Label>
              <Textarea value={taskInput} onChange={(e) => setTaskInput(e.target.value)} className="min-h-[120px] font-mono text-sm" />
            </div>
            <Button onClick={runTask} disabled={!selectedTask || isRunning} variant="outline">Executar Task</Button>
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
            <CardContent className="p-6">
              {!isRunning ? (
                <Button onClick={handleRunProject} disabled={!selectedProject} className="w-full btn-primary gap-2 h-12 text-base">
                  <Play className="h-5 w-5" /> Executar Projeto
                </Button>
              ) : (
                <div className="space-y-4">
                  <Button onClick={handleStop} variant="destructive" className="w-full gap-2 h-12 text-base">
                    <Square className="h-5 w-5" /> Parar Execução
                  </Button>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {currentExecution ? (
            <>
              <Card className="card-notion">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusBadge(currentExecution.status)}
                    <span className="text-sm text-muted-foreground">ID: {currentExecution.id}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Projeto:</span><span className="font-medium">{currentExecution.project_name || selectedProject}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Início:</span><span>{new Date(currentExecution.created_at).toLocaleString()}</span></div>
                  </div>
                </CardContent>
              </Card>

              {currentExecution.output_payload && (
                <Card className="card-notion">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Resultado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentExecution.output_payload.result && (
                      <pre className="bg-muted/30 p-4 rounded-radius text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                        {currentExecution.output_payload.result}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentExecution.logs && (
                <Card className="card-notion">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted/30 p-4 rounded-radius text-xs overflow-x-auto font-mono">{currentExecution.logs}</pre>
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
              <CardContent className="p-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma execução exibida</h3>
                <p className="text-muted-foreground text-sm">Selecione um projeto e execute para ver os resultados aqui</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
