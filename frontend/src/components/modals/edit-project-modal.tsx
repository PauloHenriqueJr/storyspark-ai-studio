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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient, queryKeys } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any | null;
}

export function EditProjectModal({ open, onOpenChange, project }: EditProjectModalProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(() => ({
    name: project?.name || '',
    description: project?.description || '',
    model_provider: project?.model_provider || 'openrouter',
    model_name: project?.model_name || 'openrouter/gpt-4o-mini',
    language: project?.language || 'pt',
  }));
  const [saving, setSaving] = useState(false);

  // keep form in sync when project changes
   
  if (project && form.name === '' && open) {
    setForm({
      name: project.name,
      description: project.description || '',
      model_provider: project.model_provider || 'openrouter',
      model_name: project.model_name || 'openrouter/gpt-4o-mini',
      language: project.language || 'pt',
    });
  }

  const updateField = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setSaving(true);
    try {
      await apiClient.updateProject(String(project.id), form);
      await qc.invalidateQueries({ queryKey: queryKeys.projects() as any });
      onOpenChange(false);
      toast({ title: 'Projeto atualizado', description: 'As alterações foram salvas com sucesso.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
          <DialogDescription>Atualize os dados do projeto selecionado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={form.model_provider} onValueChange={(v) => updateField('model_provider', v)}>
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
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value={form.model_name} onChange={(e) => updateField('model_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select value={form.language} onValueChange={(v) => updateField('language', v)}>
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" className="btn-primary" disabled={saving}>Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
