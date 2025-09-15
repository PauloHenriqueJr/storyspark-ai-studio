import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient, queryKeys } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { AVAILABLE_TOOLS } from '@/types/agent';

interface EditAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: any | null;
  projectId: string;
}

export function EditAgentModal({ open, onOpenChange, agent, projectId }: EditAgentModalProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    role: '',
    goal: '',
    backstory: '',
    verbose: false,
    memory: true,
    allow_delegation: true,
  });
  const [saving, setSaving] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Sync form when agent changes
  useEffect(() => {
    if (agent && open) {
      setForm({
        name: agent.name || '',
        role: agent.role || '',
        goal: agent.goal || '',
        backstory: agent.backstory || '',
        verbose: agent.verbose || false,
        memory: agent.memory || true,
        allow_delegation: agent.allow_delegation || true,
      });
      setSelectedTools(agent.tools || []);
    }
  }, [agent, open]);

  const updateField = (k: keyof typeof form, v: any) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;
    setSaving(true);
    try {
      await apiClient.updateAgent(String(agent.id), {
        name: form.name,
        role: form.role,
        goal: form.goal,
        backstory: form.backstory,
        tools: selectedTools,
        verbose: form.verbose,
        memory: form.memory,
        allow_delegation: form.allow_delegation,
      });
      await qc.invalidateQueries({ queryKey: queryKeys.agents(projectId) });
      onOpenChange(false);
      toast({ title: 'Agente atualizado', description: 'As alterações foram salvas com sucesso.' });
    } catch (e) {
      console.error('Update agent failed', e);
      toast({ title: 'Erro', description: 'Falha ao atualizar agente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agente</DialogTitle>
          <DialogDescription>Atualize os dados do agente selecionado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Input value={form.role} onChange={(e) => updateField('role', e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Input value={form.goal} onChange={(e) => updateField('goal', e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <Textarea value={form.backstory} onChange={(e) => updateField('backstory', e.target.value)} rows={3} />
          </div>

          {/* Tools Selection */}
          <div className="space-y-2">
            <Label>Ferramentas</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 sm:max-h-40 overflow-y-auto p-2 bg-muted rounded-md">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="verbose"
                checked={form.verbose}
                onCheckedChange={(checked) => updateField('verbose', checked)}
              />
              <Label htmlFor="verbose" className="text-sm">Modo Verbose</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="memory"
                checked={form.memory}
                onCheckedChange={(checked) => updateField('memory', checked)}
              />
              <Label htmlFor="memory" className="text-sm">Habilitar Memória</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="allow_delegation"
                checked={form.allow_delegation}
                onCheckedChange={(checked) => updateField('allow_delegation', checked)}
              />
              <Label htmlFor="allow_delegation" className="text-sm">Permitir Delegação</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" className="btn-primary" disabled={saving || !form.name.trim() || !form.role.trim() || !form.goal.trim()}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}