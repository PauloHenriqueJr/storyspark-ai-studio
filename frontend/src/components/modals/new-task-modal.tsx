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
import { Target, Play, FileText, Clock, Zap } from 'lucide-react';
import { apiClient, queryKeys } from '@/lib/api';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { AVAILABLE_TOOLS } from '@/types/agent';
import { Agent } from '@/types/agent';
import { extractVariables } from '@/types/task';

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const taskTemplates = [
  {
    id: 'research',
    name: 'Pesquisa de Mercado',
    description: 'Coletar e analisar dados de mercado',
    icon: Target,
    badge: 'Padrão',
  },
  {
    id: 'content',
    name: 'Geração de Conteúdo',
    description: 'Criar posts e artigos baseados em pesquisa',
    icon: FileText,
    badge: 'Novo',
  },
  {
    id: 'execution',
    name: 'Execução Rápida',
    description: 'Tarefas de execução simples e diretas',
    icon: Play,
    badge: 'Popular',
  },
  {
    id: 'analysis',
    name: 'Análise de Dados',
    description: 'Processar e interpretar resultados',
    icon: Zap,
    badge: 'IA',
  },
];

export function NewTaskModal({ open, onOpenChange, projectId }: NewTaskModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    agent_id: '',
    description: '',
    expected_output: '',
    tools: [] as string[],
    async_execution: false,
    output_file: '',
    template: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [variables, setVariables] = useState([] as any[]);

  const { toast } = useToast();

  const { data: agents = [] } = useQuery<Agent[], Error>({
    queryKey: queryKeys.agents(projectId),
    queryFn: () => apiClient.getProjectAgents(projectId) as Promise<Agent[]>,
    enabled: !!projectId && open,
  });

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));
    // Extract variables from description
    setVariables(extractVariables(value));
  };

  const createTaskMutation = useMutation({
    mutationFn: () => apiClient.createTask(projectId, {
      agent_id: formData.agent_id,
      description: formData.description,
      expected_output: formData.expected_output,
      tools: selectedTools,
      async_execution: formData.async_execution,
      output_file: formData.output_file,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      onOpenChange(false);
      // Reset form
      setFormData({
        agent_id: '',
        description: '',
        expected_output: '',
        tools: [],
        async_execution: false,
        output_file: '',
        template: '',
      });
      setSelectedTools([]);
      toast({ title: "Tarefa criada com sucesso" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message || "Falha na criação",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agent_id || !formData.description.trim() || !formData.expected_output.trim()) {
      toast({
        title: "Validação falhou",
        description: "Preencha agente, descrição e resultado esperado",
        variant: "destructive",
      });
      return;
    }
    createTaskMutation.mutate();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const selectedTemplate = taskTemplates.find(t => t.id === formData.template);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Nova Tarefa
          </DialogTitle>
          <DialogDescription>
            Configure uma nova tarefa para seus agentes. Escolha um template ou crie do zero.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent_id">Agente Responsável *</Label>
              <Select value={formData.agent_id} onValueChange={(value) => handleInputChange('agent_id', value)} required>
                <SelectTrigger className="input-notion">
                  <SelectValue placeholder="Selecione um agente" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map((agent: Agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} - {agent.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Tarefa *</Label>
              <Textarea
                id="description"
                placeholder="Descreva o que esta tarefa deve fazer. Use {variavel} para inputs dinâmicos."
                value={formData.description}
                onChange={handleDescriptionChange}
                className="input-notion resize-none"
                rows={4}
                required
              />
              {variables.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Variáveis detectadas: {variables.map(v => `{${v.name}}`).join(', ')}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_output">Resultado Esperado *</Label>
              <Textarea
                id="expected_output"
                placeholder="Descreva o formato e conteúdo esperado da saída..."
                value={formData.expected_output}
                onChange={(e) => handleInputChange('expected_output', e.target.value)}
                className="input-notion resize-none"
                rows={3}
                required
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="output_file">Arquivo de Saída</Label>
                <Input
                  id="output_file"
                  placeholder="relatorio.md"
                  value={formData.output_file}
                  onChange={(e) => handleInputChange('output_file', e.target.value)}
                  className="input-notion"
                />
              </div>
              <div className="space-y-2">
                <Label>Execução Assíncrona</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="async_execution"
                    checked={formData.async_execution}
                    onCheckedChange={(checked) => handleInputChange('async_execution', checked)}
                  />
                  <Label htmlFor="async_execution" className="text-sm">Executar em background</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="space-y-4">
            <Label>Template da Tarefa</Label>
            <div className="grid grid-cols-2 gap-3">
              {taskTemplates.map((template) => {
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
                      // Auto-fill based on template
                      if (template.id === 'research') {
                        setFormData(prev => ({
                          ...prev,
                          description: 'Pesquisar informações sobre {tema} no mercado atual.',
                          expected_output: 'Relatório com 5 pontos principais e fontes confiáveis.',
                        }));
                        setSelectedTools(['WebSearchTool', 'SerperDevTool']);
                      }
                      // Add more...
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
            
            {selectedTemplate && (
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
              disabled={createTaskMutation.isPending || !formData.agent_id || !formData.description.trim() || !formData.expected_output.trim()}
            >
              {createTaskMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  Criar Tarefa
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}