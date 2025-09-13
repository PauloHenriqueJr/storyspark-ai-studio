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
import { Badge } from '@/components/ui/badge';
import { Sparkles, FolderOpen, Zap, Brain, Target } from 'lucide-react';
import { apiClient, queryKeys } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const projectTemplates = [
  {
    id: 'blank',
    name: 'Projeto em Branco',
    description: 'Comece do zero com um projeto vazio',
    icon: FolderOpen,
    badge: null,
  },
  {
    id: 'customer_support',
    name: 'Suporte ao Cliente',
    description: 'Automação de atendimento e suporte',
    icon: Zap,
    badge: 'Popular',
  },
  {
    id: 'data_analysis',
    name: 'Análise de Dados',
    description: 'Processamento e análise automatizada',
    icon: Brain,
    badge: 'IA',
  },
  {
    id: 'content_creation',
    name: 'Criação de Conteúdo',
    description: 'Geração automática de conteúdo',
    icon: Target,
    badge: 'Novo',
  },
];

export function NewProjectModal({ open, onOpenChange }: NewProjectModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: '',
    model_provider: 'openrouter',
    model_name: 'openrouter/gpt-4o-mini',
    language: 'pt',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      await apiClient.createProject({
        name: formData.name,
        description: formData.description,
        model_provider: formData.model_provider as any,
        model_name: formData.model_name,
        language: formData.language as any,
      });
      // Refresh project list
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects() as any });
      onOpenChange(false);
      // If template selected, switch to editor (optional)
      if (formData.template && formData.template !== 'blank') {
        window.location.href = '/app/editor';
      }
      // Reset
      setFormData({ name: '', description: '', template: '', model_provider: 'openrouter', model_name: 'openrouter/gpt-4o-mini', language: 'pt' });
    } catch (e) {
      console.error('Create project failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedTemplate = projectTemplates.find(t => t.id === formData.template);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Novo Projeto
          </DialogTitle>
          <DialogDescription>
            Configure seu novo projeto de automação AI. Escolha um template ou comece do zero.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Projeto</Label>
                <Input
                  id="name"
                  placeholder="Meu Projeto de Automação"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-notion"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model_provider">Modelo de IA</Label>
                <Select 
                  value={formData.model_provider} 
                  onValueChange={(value) => handleInputChange('model_provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo e funcionalidade do seu projeto..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="input-notion resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Idioma de saída</Label>
                <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  placeholder="openrouter/gpt-4o-mini"
                  value={formData.model_name}
                  onChange={(e) => handleInputChange('model_name', e.target.value)}
                  className="input-notion"
                />
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="space-y-4">
            <Label>Template do Projeto</Label>
            <div className="grid grid-cols-2 gap-3">
              {projectTemplates.map((template) => {
                const Icon = template.icon;
                const isSelected = formData.template === template.id;
                
                return (
                  <div
                    key={template.id}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => handleInputChange('template', template.id)}
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
            
            {selectedTemplate && selectedTemplate.id !== 'blank' && (
              <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                <p className="text-sm text-muted-foreground">
                  <strong>Template selecionado:</strong> Este template irá configurar automaticamente 
                  agentes e tarefas no editor visual para {selectedTemplate.name.toLowerCase()}.
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
              disabled={!formData.name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Criar Projeto
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
