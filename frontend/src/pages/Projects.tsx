import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Users,
  CheckSquare,
  Clock,
  Play,
  Edit,
  Trash2,
  Copy,
  Download,
  FolderOpen,
  Layers
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient, queryKeys } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NewProjectModal } from '@/components/modals/new-project-modal';
import { EditProjectModal } from '@/components/modals/edit-project-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function Projects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => apiClient.getProjects(),
  });
  const projects = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const filteredProjects = projects.filter((project: any) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = () => {
    setShowNewProjectModal(true);
  };

  const handleProjectAction = (action: string, projectId: string) => {
    if (action === 'run') {
      navigate(`/app/run?projectId=${projectId}`);
      return;
    }
    if (action === 'view') {
      navigate(`/app/agents?projectId=${projectId}`);
      return;
    }
    if (action === 'editor') {
      navigate(`/app/editor?projectId=${projectId}`);
      return;
    }
    if (action === 'edit') {
      const p = projects.find((x: any) => String(x.id) === String(projectId));
      setSelectedProject(p || null);
      setShowEditModal(true);
      return;
    }
    if (action === 'duplicate') {
      duplicateProject(projectId);
      return;
    }
    if (action === 'export') {
      exportProject(projectId);
      return;
    }
    if (action === 'delete') {
      const p = projects.find((x: any) => String(x.id) === String(projectId));
      setDeleteTarget(p || null);
      return;
    }
  };

  const exportProject = async (projectId: string) => {
    try {
      const blob = await apiClient.exportProject(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${projectId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Exportado', description: 'ZIP gerado com sucesso.' });
    } catch (e) { console.error(e); }
  };

  const duplicateProject = async (projectId: string) => {
    try {
      const original = projects.find((p: any) => String(p.id) === String(projectId));
      if (!original) return;
      // ensure unique name
      let base = `${original.name} (copy)`; let name = base; let n = 2;
      const names = new Set(projects.map((p: any) => p.name));
      while (names.has(name)) { name = `${base} ${n}`; n++; }

      const created = await apiClient.createProject({
        name,
        description: original.description || '',
        model_provider: original.model_provider,
        model_name: original.model_name,
        language: original.language || 'pt'
      }) as any;

      // copy agents
      const agents = await apiClient.getProjectAgents(String(original.id)) as any[];
      const newAgentIds: Record<string, number> = {};
      for (const a of agents) {
        const na = await apiClient.createAgent(String(created.id), {
          name: a.name,
          role: a.role,
          goal: a.goal,
          backstory: a.backstory || '',
          tools: a.tools || [],
          verbose: !!a.verbose,
          memory: !!a.memory,
          allow_delegation: !!a.allow_delegation,
        }) as any;
        newAgentIds[a.name] = na.id;
      }

      // copy tasks
      const tasks = await apiClient.getProjectTasks(String(original.id)) as any[];
      for (const t of tasks) {
        // map by agent name
        const agent = agents.find((x: any) => x.id === t.agent_id);
        const newAgentId = agent ? newAgentIds[agent.name] : undefined;
        if (!newAgentId) continue;
        await apiClient.createTask(String(created.id), {
          agent_id: newAgentId,
          description: t.description,
          expected_output: t.expected_output || '',
          tools: t.tools || [],
          async_execution: !!t.async_execution,
          output_file: t.output_file || ''
        });
      }

      await qc.invalidateQueries({ queryKey: queryKeys.projects() as any });
      toast({ title: 'Projeto duplicado', description: 'O projeto foi copiado com sucesso.' });
    } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.deleteProject(String(deleteTarget.id));
      setDeleteTarget(null);
      await qc.invalidateQueries({ queryKey: queryKeys.projects() as any });
      toast({ title: 'Projeto excluído', description: 'O projeto foi removido com sucesso.' });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      {/* New Project Modal */}
      <NewProjectModal
        open={showNewProjectModal}
        onOpenChange={setShowNewProjectModal}
      />
      <EditProjectModal open={showEditModal} onOpenChange={setShowEditModal} project={selectedProject} />
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível. Tem certeza que deseja excluir o projeto “{deleteTarget?.name}”? Todos os agentes e tasks dele serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 border border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Projetos
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie seus projetos de automação com IA • {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
            </p>
          </div>

          <Button
            onClick={handleCreateProject}
            className="btn-primary gap-3 px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-notion"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading projects...</div>
      )}
      {isError && (
        <div className="text-sm text-destructive">Failed to load projects. Check API URL and CORS.</div>
      )}

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project: any) => (
          <Card key={project.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 hover:from-card hover:to-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
            {/* Decorative gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

            <CardHeader className="pb-4 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
                      {project.name}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed group-hover:text-foreground/80 transition-colors">
                    {project.description}
                  </CardDescription>
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
                    <DropdownMenuItem onClick={() => handleProjectAction('view', project.id)} className="gap-2">
                      <FolderOpen className="h-4 w-4 text-blue-600" />
                      <span>Ver Agentes & Tasks</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProjectAction('editor', project.id)} className="gap-2">
                      <Layers className="h-4 w-4 text-purple-600" />
                      <span>Editor Visual</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleProjectAction('edit', project.id)} className="gap-2">
                      <Edit className="h-4 w-4 text-blue-600" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProjectAction('duplicate', project.id)} className="gap-2">
                      <Copy className="h-4 w-4 text-green-600" />
                      <span>Duplicar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProjectAction('export', project.id)} className="gap-2">
                      <Download className="h-4 w-4 text-orange-600" />
                      <span>Exportar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleProjectAction('delete', project.id)}
                      className="gap-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              {/* Project Details */}
              <div className="space-y-4">
                {/* Model Info */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                    <Badge variant="outline" className="gap-1.5 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all duration-200">
                      {project.model_provider}
                    </Badge>
                    <span className="text-sm font-medium text-primary">
                      {(() => {
                        const provider = project.model_provider || '';
                        const model = project.model_name || '';
                        return model.startsWith(provider + '/') ? model.slice(provider.length + 1) : model;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-semibold text-blue-700">{(project.agents_count ?? 0)}</div>
                      <div className="text-xs text-blue-600/80">agentes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-sm font-semibold text-green-700">{(project.tasks_count ?? 0)}</div>
                      <div className="text-xs text-green-600/80">tasks</div>
                    </div>
                  </div>
                </div>

                {/* Last Execution */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Última execução: {project.last_execution_at ? new Date(project.last_execution_at).toLocaleDateString() : 'Nunca'}
                    </span>
                  </div>
                  <Badge
                    variant={(project.executions_count ?? 0) > 0 ? 'default' : 'secondary'}
                    className="gap-1.5 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all duration-200"
                  >
                    {(project.executions_count ?? 0)} execuções
                  </Badge>
                </div>

                {/* Action Button */}
                <div className="pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <Button
                    className="w-full btn-primary gap-2 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={() => handleProjectAction('run', project.id)}
                  >
                    <Play className="h-4 w-4" />
                    Executar Projeto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-12 w-12 text-primary/60" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center animate-bounce">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {searchTerm ? 'Nenhum projeto encontrado' : 'Comece criando seu primeiro projeto'}
            </h3>

            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              {searchTerm
                ? 'Tente ajustar os termos da sua busca ou remova os filtros para ver todos os projetos disponíveis.'
                : 'Projetos são containers para seus agentes e tarefas de IA. Organize seu trabalho em projetos estruturados.'
              }
            </p>

            {!searchTerm && (
              <div className="space-y-4">
                <Button
                  onClick={handleCreateProject}
                  className="btn-primary gap-3 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-5 w-5" />
                  Criar Primeiro Projeto
                </Button>

                <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Configure modelos de IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Adicione agentes especializados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Crie workflows automatizados</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 p-6 border border-border/50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center group">
            <div className="relative">
              <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
                {projects.length}
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            </div>
            <div className="text-sm text-muted-foreground font-medium">Projetos Totais</div>
          </div>

          <div className="text-center group">
            <div className="relative">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                {projects.filter((p: any) => (p.executions_count ?? 0) > 0).length}
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-sm text-muted-foreground font-medium">Projetos Ativos</div>
          </div>

          <div className="text-center group">
            <div className="relative">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                {projects.reduce((sum: number, p: any) => sum + (p.agents_count ?? 0), 0)}
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-sm text-muted-foreground font-medium">Agentes Totais</div>
          </div>

          <div className="text-center group">
            <div className="relative">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                {projects.reduce((sum: number, p: any) => sum + (p.tasks_count ?? 0), 0)}
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-sm text-muted-foreground font-medium">Tasks Totais</div>
          </div>
        </div>
      </div>
    </div>
  );
}
