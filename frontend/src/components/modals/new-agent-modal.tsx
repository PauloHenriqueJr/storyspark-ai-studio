import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Bot, Target, Brain, Zap } from 'lucide-react';
import { apiClient, queryKeys } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { AVAILABLE_TOOLS } from '@/types/agent';

interface NewAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const agentTemplates = [
  {
    id: 'researcher',
    name: 'Pesquisador',
    description: 'Especialista em pesquisa e coleta de informações',
    icon: Bot,
    badge: 'Padrão',
  },
  {
    id: 'analyst',
    name: 'Analista',
    description: 'Analisa dados e gera insights profundos',
    icon: Brain,
    badge: 'IA',
  },
  {
    id: 'writer',
    name: 'Escritor',
    description: 'Cria conteúdo persuasivo e bem estruturado',
    icon: Target,
    badge: 'Novo',
  },
  {
    id: 'manager',
    name: 'Gerente',
    description: 'Coordena equipes e delega tarefas',
    icon: Zap,
    badge: 'Popular',
  },
];

export function NewAgentModal({ open, onOpenChange, projectId }: NewAgentModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    goal: '',
    backstory: '',
    tools: [] as string[],
    verbose: false,
    memory: true,
    allow_delegation: true,
    template: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const { data: projectAgents } = useQuery({
    queryKey: queryKeys.agents(projectId),
    queryFn: () => apiClient.getProjectAgents(projectId),
    enabled: !!projectId && open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim() || !formData.goal.trim()) return;

    setIsLoading(true);
    try {
      await apiClient.createAgent(projectId, {
        name: formData.name,
        role: formData.role,
        goal: formData.goal,
        backstory: formData.backstory,
        tools: selectedTools,
        verbose: formData.verbose,
        memory: formData.memory,
        allow_delegation: formData.allow_delegation,
      });
      // Refresh agents list
      await queryClient.invalidateQueries({ queryKey: queryKeys.agents(projectId) });
      onOpenChange(false);
      // Reset form
      setFormData({
        name: '',
        role: '',
        goal: '',
        backstory: '',
        tools: [],
        verbose: false,
        memory: true,
        allow_delegation: true,
        template: '',
      });
      setSelectedTools([]);
    } catch (e) {
      console.error('Create agent failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const selectedTemplate = agentTemplates.find(t => t.id === formData.template);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Novo Agente
          </DialogTitle>
          <DialogDescription>
            Configure um novo agente para seu projeto. Escolha um template ou crie do zero.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Agente</Label>
                <Input
                  id="name"
                  placeholder="Pesquisador de Mercado"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-notion"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Input
                  id="role"
                  placeholder="O que este agente faz no time?"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="input-notion"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Objetivo</Label>
              <Input
                id="goal"
                placeholder="Qual é o objetivo principal deste agente?"
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                className="input-notion"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backstory">História/Background</Label>
              <Textarea
                id="backstory"
                placeholder="Conte mais sobre o background e personalidade deste agente..."
                value={formData.backstory}
                onChange={(e) => handleInputChange('backstory', e.target.value)}
                className="input-notion resize-none"
                rows={3}
              />
            </div>

            {/* Tools Selection */}
            <div className="space-y-2">
              <Label>Ferramentas Disponíveis</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-muted rounded-md">
                {AVAILABLE_TOOLS.map(tool => (
                  <div key={tool} className="flex items-center gap-2 p-1 rounded">
                    <Checkbox
                      id={`tool-${tool}`}
                      checked={selectedTools.includes(tool)}
                      onCheckedChange={() => toggleTool(tool)}
                    />
                    <Label htmlFor={`tool-${tool}`} className="text-sm cursor-pointer">
                      {tool}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedTools.length} ferramentas selecionadas
              </p>
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="verbose"
                  checked={formData.verbose}
                  onCheckedChange={(checked) => handleInputChange('verbose', checked)}
                />
                <Label htmlFor="verbose" className="text-sm">Modo Verbose</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="memory"
                  checked={formData.memory}
                  onCheckedChange={(checked) => handleInputChange('memory', checked)}
                />
                <Label htmlFor="memory" className="text-sm">Habilitar Memória</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allow_delegation"
                  checked={formData.allow_delegation}
                  onCheckedChange={(checked) => handleInputChange('allow_delegation', checked)}
                />
                <Label htmlFor="allow_delegation" className="text-sm">Permitir Delegação</Label>
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="space-y-4">
            <Label>Template do Agente</Label>
            <div className="grid grid-cols-2 gap-3">
              {agentTemplates.map((template) => {
                const Icon = template.icon;
                const isSelected = formData.template === template.id;
                
                return (
                  <div
                    key={template.id}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => {
                      handleInputChange('template', template.id);
                      // Auto-fill based on template (optional)
                      if (template.id === 'researcher') {
                        setFormData(prev => ({
                          ...prev,
                          role: 'Pesquisador Senior',
                          goal: 'Coletar e sintetizar informações relevantes',
                          backstory: 'Especialista com anos de experiência em pesquisa acadêmica e de mercado.',
                        }));
                        setSelectedTools(['WebSearchTool', 'SerperDevTool']);
                      }
                      // Add more templates...
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium text-sm ${
                            isSelected ? 'text-primary' : 'text-heading'
                          }`}>
                            {template.name}
                          </h4>
                          {template.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {template.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {selectedTemplate && selectedTemplate.id !== 'researcher' && (
              <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                <p className="text-sm text-muted-foreground">
                  <strong>Template selecionado:</strong> Este template preencherá automaticamente 
                  os campos com configurações otimizadas para {selectedTemplate.name.toLowerCase()}.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-primary gap-2"
              disabled={!formData.name.trim() || !formData.role.trim() || !formData.goal.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Criar Agente
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}