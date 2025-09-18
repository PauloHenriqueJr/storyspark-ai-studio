import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Filter,
  Star,
  Download,
  Eye,
  Heart,
  Share,
  Bookmark,
  TrendingUp,
  Clock,
  Users,
  Zap,
  Sparkles,
  BookOpen,
  Palette,
  Film,
  Mic,
  Globe,
  Crown,
  Gift
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient, queryKeys } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const categories = [
  { id: 'all', name: 'Todos', icon: Globe },
  { id: 'storytelling', name: 'Narrativa', icon: BookOpen },
  { id: 'content', name: 'Conteúdo', icon: Palette },
  { id: 'video', name: 'Vídeo', icon: Film },
  { id: 'audio', name: 'Áudio', icon: Mic },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp },
];

const templates = [
  {
    id: 'story-generator',
    name: 'Gerador de Histórias Interativas',
    description: 'Cria narrativas personalizadas baseadas no perfil do usuário, com múltiplos finais e elementos interativos',
    category: 'storytelling',
    author: 'Luna Creative',
    rating: 4.9,
    downloads: 1247,
    likes: 892,
    tags: ['Interactive', 'Personalization', 'Narrative'],
    featured: true,
    premium: false,
    preview_image: 'story-generator.jpg',
    agents_count: 4,
    tasks_count: 8,
    created_at: '2024-01-15',
    complexity: 'Intermediate'
  },
  {
    id: 'social-content-creator',
    name: 'Criador de Conteúdo Social',
    description: 'Automatiza criação de posts para múltiplas redes sociais com otimização de engajamento',
    category: 'content',
    author: 'SocialSpark Studio',
    rating: 4.7,
    downloads: 2156,
    likes: 1543,
    tags: ['Social Media', 'Multi-platform', 'Engagement'],
    featured: true,
    premium: true,
    preview_image: 'social-creator.jpg',
    agents_count: 3,
    tasks_count: 6,
    created_at: '2024-01-12',
    complexity: 'Beginner'
  },
  {
    id: 'podcast-producer',
    name: 'Produtor de Podcast Automatizado',
    description: 'Pipeline completo para criação de episódios de podcast, desde pesquisa até script e distribuição',
    category: 'audio',
    author: 'AudioCraft AI',
    rating: 4.8,
    downloads: 687,
    likes: 456,
    tags: ['Podcast', 'Audio Production', 'Automation'],
    featured: false,
    premium: true,
    preview_image: 'podcast-producer.jpg',
    agents_count: 5,
    tasks_count: 12,
    created_at: '2024-01-10',
    complexity: 'Advanced'
  },
  {
    id: 'video-script-writer',
    name: 'Roteirista de Vídeos Criativos',
    description: 'Desenvolve roteiros envolventes para YouTube, TikTok e outras plataformas de vídeo',
    category: 'video',
    author: 'VideoScript Pro',
    rating: 4.6,
    downloads: 1834,
    likes: 1205,
    tags: ['Video Script', 'YouTube', 'Creative Writing'],
    featured: false,
    premium: false,
    preview_image: 'video-script.jpg',
    agents_count: 2,
    tasks_count: 5,
    created_at: '2024-01-08',
    complexity: 'Intermediate'
  },
  {
    id: 'brand-storyteller',
    name: 'Contador de Histórias de Marca',
    description: 'Cria narrativas autênticas que conectam marcas com audiências através de storytelling emocional',
    category: 'marketing',
    author: 'BrandNarrative Co.',
    rating: 4.9,
    downloads: 923,
    likes: 678,
    tags: ['Brand Story', 'Emotional Marketing', 'Authenticity'],
    featured: true,
    premium: false,
    preview_image: 'brand-story.jpg',
    agents_count: 3,
    tasks_count: 7,
    created_at: '2024-01-05',
    complexity: 'Intermediate'
  },
  {
    id: 'content-repurposer',
    name: 'Reutilizador de Conteúdo Inteligente',
    description: 'Transforma um conteúdo base em múltiplos formatos otimizados para diferentes plataformas',
    category: 'content',
    author: 'ContentMax AI',
    rating: 4.5,
    downloads: 1567,
    likes: 934,
    tags: ['Content Repurposing', 'Multi-format', 'Efficiency'],
    featured: false,
    premium: false,
    preview_image: 'content-repurpose.jpg',
    agents_count: 3,
    tasks_count: 6,
    created_at: '2024-01-03',
    complexity: 'Beginner'
  },
];

export default function Library() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [executingTemplate, setExecutingTemplate] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Get projects for template execution
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects()
  });

  // Mutation for executing templates
  const executeTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template não encontrado');
      
      // Get first available project
      const project = Array.isArray(projects) && projects.length > 0 ? projects[0] : null;
      if (!project) throw new Error('Nenhum projeto disponível para execução');
      
      // First, create the workflow from template
      await createWorkflowFromTemplate(templateId, project.id);
      
      // Wait a bit for the workflow to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the created tasks
      const projectTasks = await apiClient.getProjectTasks(project.id);
      if (!Array.isArray(projectTasks) || projectTasks.length === 0) {
        throw new Error('Nenhuma task foi criada do template');
      }
      
      // Execute the first task
      const firstTask = projectTasks[0];
      const execution = await apiClient.run.project(Number(project.id), { 
        inputs: { task: { id: firstTask.id } },
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
      setExecutingTemplate(null);
      toast({
        title: "Template Executado",
        description: "Execução concluída com sucesso!",
      });
    },
    onError: (error: Error) => {
      setExecutingTemplate(null);
      toast({
        title: "Erro na Execução",
        description: error.message || "Falha ao executar o template",
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

  // Function to create workflow from template
  const createWorkflowFromTemplate = async (templateId: string, projectId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    try {
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
        
        const createdAgent = await apiClient.createAgent(projectId, agentData);
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
        
        const createdTask = await apiClient.createTask(projectId, taskData);
        createdTasks.push(createdTask);
      }

      return { agents: createdAgents, tasks: createdTasks };
    } catch (error) {
      console.error('Error creating workflow from template:', error);
      throw error;
    }
  };

  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'featured':
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });

  const featuredTemplates = templates.filter(t => t.featured);

  const handleUseTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    
    // Get first available project for navigation
    const project = Array.isArray(projects) && projects.length > 0 ? projects[0] : null;
    if (!project) {
      toast({
        title: "Erro",
        description: "Nenhum projeto disponível para usar o template",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to visual editor with the template
    navigate(`/app/editor?projectId=${project.id}&templateId=${templateId}`);
    
    toast({
      title: "Template Carregado",
      description: `"${template?.name}" foi carregado no editor visual`,
    });
  };

  const handleExecuteTemplate = (templateId: string) => {
    if (!Array.isArray(projects) || projects.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum projeto disponível para execução",
        variant: "destructive",
      });
      return;
    }
    setExecutingTemplate(templateId);
    executeTemplateMutation.mutate(templateId);
  };

  const handleLikeTemplate = (templateId: string) => {
    toast({
      title: "Template Curtido",
      description: "Adicionado aos seus favoritos",
    });
  };

  const handleBookmarkTemplate = (templateId: string) => {
    toast({
      title: "Template Salvo",
      description: "Adicionado à sua biblioteca pessoal",
    });
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner':
        return 'bg-accent-green text-white';
      case 'Intermediate':
        return 'bg-warning text-white';
      case 'Advanced':
        return 'bg-destructive text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-title flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-primary" />
          Biblioteca de Templates
        </h1>
        <p className="text-muted-foreground">Descubra e use templates criativos compartilhados pela comunidade</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-notion"
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            className="px-3 py-2 border border-border rounded-radius bg-input text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="featured">Em Destaque</option>
            <option value="popular">Mais Baixados</option>
            <option value="rating">Melhor Avaliados</option>
            <option value="recent">Mais Recentes</option>
          </select>
          
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Categories Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="gap-2">
                <IconComponent className="h-4 w-4" />
                {category.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-6">
          {/* Featured Templates */}
          {selectedCategory === 'all' && featuredTemplates.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Templates em Destaque
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredTemplates.map((template) => (
                  <Card key={template.id} className="card-notion hover:shadow-lg transition-all duration-300 border-2 border-warning/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Crown className="h-5 w-5 text-warning" />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {template.name}
                              {template.premium && <Gift className="h-4 w-4 text-primary" />}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {template.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Author and Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {template.author.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">{template.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-warning fill-warning" />
                          <span>{template.rating}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <div className="font-semibold">{template.agents_count}</div>
                          <div className="text-muted-foreground">Agentes</div>
                        </div>
                        <div>
                          <div className="font-semibold">{template.tasks_count}</div>
                          <div className="text-muted-foreground">Tasks</div>
                        </div>
                        <div>
                          <div className="font-semibold">{template.downloads}</div>
                          <div className="text-muted-foreground">Downloads</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Button 
                            className="flex-1 btn-primary gap-2"
                            onClick={() => handleUseTemplate(template.id)}
                          >
                            <Download className="h-4 w-4" />
                            Usar Template
                          </Button>
                          <Button 
                            className="flex-1 gap-2"
                            variant="outline"
                            onClick={() => handleExecuteTemplate(template.id)}
                            disabled={executingTemplate === template.id || executeTemplateMutation.isPending}
                          >
                            <Zap className="h-4 w-4" />
                            {executingTemplate === template.id ? 'Executando...' : 'Executar'}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleLikeTemplate(template.id)}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleBookmarkTemplate(template.id)}
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Templates */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {selectedCategory === 'all' ? 'Todos os Templates' : 
               categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="card-notion hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          {template.name}
                          {template.premium && <Gift className="h-4 w-4 text-primary flex-shrink-0" />}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Author and Rating */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {template.author.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground truncate">{template.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-warning fill-warning" />
                        <span className="text-xs">{template.rating}</span>
                      </div>
                    </div>

                    {/* Complexity and Stats */}
                    <div className="flex items-center justify-between">
                      <Badge className={`text-xs ${getComplexityColor(template.complexity)}`}>
                        {template.complexity}
                      </Badge>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {template.downloads}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {template.likes}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.tags.length - 2}
                        </Badge>
                      )}
                    </div>

                    {/* Component Count */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {template.agents_count} agentes
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.tasks_count} tasks
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Button 
                          className="flex-1 btn-primary gap-2"
                          onClick={() => handleUseTemplate(template.id)}
                        >
                          <Download className="h-4 w-4" />
                          Usar
                        </Button>
                        <Button 
                          className="flex-1 gap-2"
                          variant="outline"
                          onClick={() => handleExecuteTemplate(template.id)}
                          disabled={executingTemplate === template.id || executeTemplateMutation.isPending}
                        >
                          <Zap className="h-4 w-4" />
                          {executingTemplate === template.id ? 'Executando...' : 'Executar'}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhum template encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente ajustar os termos de busca' : 'Nenhum template disponível nesta categoria'}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Community Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
        <div className="text-center">
          <div className="text-2xl font-semibold text-heading">{templates.length}</div>
          <div className="text-sm text-muted-foreground">Templates Disponíveis</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-accent-green">
            {templates.reduce((sum, t) => sum + t.downloads, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Downloads Totais</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-accent-coral">
            {templates.filter(t => t.featured).length}
          </div>
          <div className="text-sm text-muted-foreground">Em Destaque</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-accent-orange">
            {Math.round(templates.reduce((sum, t) => sum + t.rating, 0) / templates.length * 10) / 10}
          </div>
          <div className="text-sm text-muted-foreground">Avaliação Média</div>
        </div>
      </div>

      {/* Execution Result Modal */}
      <Dialog open={!!executionResult} onOpenChange={() => setExecutionResult(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Resultado da Execução do Template
            </DialogTitle>
            <DialogDescription>
              Resultado da execução do template
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
    </div>
  );
}