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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient, queryKeys } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function Agents() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: '',
    goal: '',
    backstory: '',
    tools: [] as string[],
    verbose: false,
    memory: true,
    allow_delegation: false
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects(),
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

  const handleCreateAgent = () => {
    if (!newAgent.name || !newAgent.role || !newAgent.goal || !selectedProjectId) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Simulate API call
    toast({
      title: "Agente Criado",
      description: `${newAgent.name} foi criado com sucesso`,
    });

    setIsCreateDialogOpen(false);
    setNewAgent({
      name: '',
      role: '',
      goal: '',
      backstory: '',
      tools: [],
      verbose: false,
      memory: true,
      allow_delegation: false
    });
  };

  const handleAgentAction = (action: string, agentId: string) => {
    const agent = agents.find(a => a.id === agentId);

    switch (action) {
      case 'test':
        toast({
          title: "Testando Agente",
          description: `Executando teste para ${agent?.name}`,
        });
        break;
      case 'edit':
        toast({
          title: "Editar Agente",
          description: "Funcionalidade de edição em desenvolvimento",
        });
        break;
      case 'duplicate':
        toast({
          title: "Agente Duplicado",
          description: `${agent?.name} foi duplicado com sucesso`,
        });
        break;
      case 'delete':
        toast({
          title: "Agente Removido",
          description: `${agent?.name} foi removido permanentemente`,
          variant: "destructive",
        });
        break;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 border border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Agentes por Projeto
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie seus agentes organizados por projeto • {filteredAgents.length} agente{filteredAgents.length !== 1 ? 's' : ''} ativo{filteredAgents.length !== 1 ? 's' : ''}
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary gap-3 px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                Novo Agente
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Agente</DialogTitle>
                <DialogDescription>
                  Configure um novo agente para seu projeto
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agent-name">Nome do Agente *</Label>
                    <Input
                      id="agent-name"
                      placeholder="Ex: João Silva"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-role">Função *</Label>
                    <Input
                      id="agent-role"
                      placeholder="Ex: Escritor Criativo"
                      value={newAgent.role}
                      onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-goal">Objetivo *</Label>
                  <Textarea
                    id="agent-goal"
                    placeholder="Descreva o objetivo principal do agente..."
                    value={newAgent.goal}
                    onChange={(e) => setNewAgent({ ...newAgent, goal: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-backstory">História de Fundo</Label>
                  <Textarea
                    id="agent-backstory"
                    placeholder="Conte a história do agente..."
                    value={newAgent.backstory}
                    onChange={(e) => setNewAgent({ ...newAgent, backstory: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ferramentas Disponíveis</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {availableTools.map((tool) => (
                      <div key={tool} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={tool}
                          checked={newAgent.tools.includes(tool)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAgent({ ...newAgent, tools: [...newAgent.tools, tool] });
                            } else {
                              setNewAgent({ ...newAgent, tools: newAgent.tools.filter(t => t !== tool) });
                            }
                          }}
                        />
                        <Label htmlFor={tool} className="text-sm">{tool}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="verbose"
                      checked={newAgent.verbose}
                      onCheckedChange={(checked) => setNewAgent({ ...newAgent, verbose: checked })}
                    />
                    <Label htmlFor="verbose">Verbose</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="memory"
                      checked={newAgent.memory}
                      onCheckedChange={(checked) => setNewAgent({ ...newAgent, memory: checked })}
                    />
                    <Label htmlFor="memory">Memória</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="delegation"
                      checked={newAgent.allow_delegation}
                      onCheckedChange={(checked) => setNewAgent({ ...newAgent, allow_delegation: checked })}
                    />
                    <Label htmlFor="delegation">Delegação</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAgent}>
                  Criar Agente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project Selector and Search */}
      <div className="space-y-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar agentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
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
              <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {projects.map((project: any) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(String(project.id))}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 ${selectedProjectId === String(project.id)
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/20'
                      : 'border-border hover:border-primary/50 bg-card hover:bg-primary/5'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full transition-all duration-200 ${selectedProjectId === String(project.id)
                        ? 'bg-primary animate-pulse'
                        : 'bg-muted-foreground/50 hover:bg-primary/70'
                        }`} />
                      <div className="text-left">
                        <div className={`text-sm font-medium transition-colors duration-200 ${selectedProjectId === String(project.id)
                          ? 'text-primary'
                          : 'text-foreground hover:text-primary'
                          }`}>
                          {project.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {project.agents_count || 0} agentes
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
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">
                        {projects.find((p: any) => String(p.id) === selectedProjectId)?.name || 'Selecionar projeto'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {projects.find((p: any) => String(p.id) === selectedProjectId)?.agents_count || 0} agentes
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isProjectDropdownOpen ? 'rotate-180' : ''
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
                          <div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 hover:from-card hover:to-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
            {/* Decorative gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

            <CardHeader className="pb-4 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold text-lg group-hover:scale-110 transition-transform duration-300">
                        {getAgentInitials(agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Status indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full animate-pulse" />
                  </div>

                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
                      {agent.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                        <User className="h-3 w-3 text-primary" />
                        <span className="font-medium text-primary">{agent.role}</span>
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
                    <DropdownMenuItem onClick={() => handleAgentAction('test', agent.id)} className="gap-2">
                      <Play className="h-4 w-4 text-green-600" />
                      <span>Testar Agente</span>
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

            <CardContent className="space-y-4">
              {/* Goal Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm text-foreground/80">Objetivo</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-7 line-clamp-2 group-hover:text-foreground/80 transition-colors">
                  {agent.goal}
                </p>
              </div>

              {/* Backstory Section */}
              {agent.backstory && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-md">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-sm text-foreground/80">História</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-7 line-clamp-2 group-hover:text-foreground/80 transition-colors">
                    {agent.backstory}
                  </p>
                </div>
              )}

              {/* Tools and Status */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1.5 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all duration-200">
                    <Brain className="h-3 w-3 text-primary" />
                    <span className="font-medium">{agent.tools?.length || 0}</span>
                    <span className="text-xs">ferramentas</span>
                  </Badge>

                  {agent.memory && (
                    <Badge variant="outline" className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5 transition-all duration-200">
                      <Zap className="h-3 w-3" />
                      <span className="text-xs font-medium">Memória</span>
                    </Badge>
                  )}

                  {agent.allow_delegation && (
                    <Badge variant="outline" className="gap-1.5 border-orange-500/20 text-orange-600 hover:bg-orange-500/5 transition-all duration-200">
                      <Users className="h-3 w-3" />
                      <span className="text-xs font-medium">Delegação</span>
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-green-700">Ativo</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  onClick={() => handleAgentAction('test', agent.id)}
                >
                  <Play className="h-3 w-3" />
                  Testar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 hover:bg-blue-500 hover:text-white transition-all duration-200"
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

      {filteredAgents.length === 0 && (
        <div className="text-center py-16">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-12 w-12 text-primary/60" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center animate-bounce">
              <Plus className="h-4 w-4 text-white" />
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {searchTerm ? 'Nenhum agente encontrado' : 'Comece criando seu primeiro agente'}
          </h3>

          <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            {searchTerm
              ? 'Tente ajustar os termos da sua busca ou remova os filtros para ver todos os agentes disponíveis.'
              : 'Agentes são os membros da sua equipe de IA. Cada um tem habilidades específicas e trabalha em conjunto para completar tarefas complexas.'
            }
          </p>

          {!searchTerm && (
            <div className="space-y-4">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="btn-primary gap-3 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                Criar Primeiro Agente
              </Button>

              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
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
      )}
    </div>
  );
}
