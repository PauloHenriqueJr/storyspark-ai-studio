import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { apiClient, queryKeys } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Agent } from '@/types/agent';
import { AVAILABLE_TOOLS } from '@/types/agent';
import { extractVariables } from '@/types/task';

interface EditTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any | null;
  projectId: string;
}

export function EditTaskModal({ open, onOpenChange, task, projectId }: EditTaskModalProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    agent_id: '',
    description: '',
    expected_output: '',
    tools: [] as string[],
    async_execution: false,
    output_file: '',
  });
  const [saving, setSaving] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [variables, setVariables] = useState([] as any[]);

  const { data: agents } = useQuery<Agent[]>({
    queryKey: queryKeys.agents(projectId),
    queryFn: () => apiClient.getProjectAgents(projectId) as Promise<Agent[]>,
    enabled: !!projectId && open,
  });

  // Sync form when task changes
  useEffect(() => {
    if (task && open) {
      setForm({
        agent_id: task.agent_id || '',
        description: task.description || '',
        expected_output: task.expected_output || '',
        tools: task.tools || [],
        async_execution: task.async_execution || false,
        output_file: task.output_file || '',
      });
      setSelectedTools(task.tools || []);
      setVariables(extractVariables(task.description || ''));
    }
  }, [task, open]);

  const updateField = (k: string, v: any) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (k === 'description') {
      setVariables(extractVariables(v));
    }
  };

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    updateField('description', value);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setSaving(true);
    try {
      await apiClient.updateTask(String(task.id), {
        agent_id: form.agent_id,
        description: form.description,
        expected_output: form.expected_output,
        tools: selectedTools,
        async_execution: form.async_execution,
        output_file: form.output_file,
      });
      await qc.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      onOpenChange(false);
      toast({ title: 'Tarefa atualizada', description: 'As alterações foram salvas com sucesso.' });
    } catch (e) {
      console.error('Update task failed', e);
      toast({ title: 'Erro', description: 'Falha ao atualizar tarefa.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
          <DialogDescription>Atualize os dados da tarefa selecionada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Agente Responsável</Label>
            <Select value={form.agent_id} onValueChange={(value) => updateField('agent_id', value)} required>
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
            <Label>Descrição da Tarefa</Label>
            <Textarea
              placeholder="Descreva o que esta tarefa deve fazer. Use {variavel} para inputs dinâmicos."
              value={form.description}
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
            <Label>Resultado Esperado</Label>
            <Textarea
              placeholder="Descreva o formato e conteúdo esperado da saída..."
              value={form.expected_output}
              onChange={(e) => updateField('expected_output', e.target.value)}
              className="input-notion resize-none"
              rows={3}
              required
            />
          </div>

          {/* Tools Selection */}
          <div className="space-y-2">
            <Label>Ferramentas</Label>
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
              <Label>Arquivo de Saída</Label>
              <Input
                placeholder="relatorio.md"
                value={form.output_file}
                onChange={(e) => updateField('output_file', e.target.value)}
                className="input-notion"
              />
            </div>
            <div className="space-y-2">
              <Label>Execução Assíncrona</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="async_execution"
                  checked={form.async_execution}
                  onCheckedChange={(checked) => updateField('async_execution', checked)}
                />
                <Label htmlFor="async_execution" className="text-sm">Executar em background</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" className="btn-primary" disabled={saving || !form.agent_id || !form.description.trim() || !form.expected_output.trim()}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}