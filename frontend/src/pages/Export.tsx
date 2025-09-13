import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Download,
  FileText,
  Package,
  Code,
  CheckCircle,
  AlertCircle,
  Archive,
  FileJson,
  Settings,
  Folder
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient, queryKeys } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectWithStats } from '@/types/project';

export default function Export() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'zip' | 'json'>('zip');

  const queryClient = useQueryClient();

  const exportMutation = useMutation({
    mutationFn: async ({ projectId, format }: { projectId: string; format: 'zip' | 'json' }) => {
      if (format === 'zip') {
        return apiClient.exportProject(projectId);
      } else {
        const projectData = await apiClient.getProject(projectId);
        const exportData = {
          project: projectData,
          exported_at: new Date().toISOString(),
          version: '1.0'
        };
        return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      }
    },
    onMutate: () => {
      setIsExporting(true);
      setExportProgress(50);
      setExportResult(null);
    },
    onSuccess: (blob, variables) => {
      const project = projects.find((p: ProjectWithStats) => p.id === variables.projectId);
      const extension = variables.format === 'zip' ? 'zip' : 'json';
      const fileName = `${project?.name?.replace(/\s+/g, '_')}_export.${extension}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const filesList = variables.format === 'zip'
        ? ['project.json', 'agents.yaml', 'tasks.yaml', 'crew.py', 'main.py', 'tools.py', 'requirements.txt']
        : ['project_export.json'];

      setExportResult({
        success: true,
        project_name: project?.name,
        format: variables.format,
        size: `${(blob.size / 1024).toFixed(1)} KB`,
        files: filesList,
      });

      toast({
        title: "Export Successful",
        description: `${project?.name} exported successfully as ${variables.format.toUpperCase()}. Download initiated.`,
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      setExportProgress(100);
    },
    onError: (error) => {
      setExportResult({
        success: false,
        error: error.message || 'Failed to export project. Please try again.',
      });

      toast({
        title: "Export Failed",
        description: "An error occurred during export. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsExporting(false);
      setExportProgress(0);
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => apiClient.getProjects(),
  });

  const projects: ProjectWithStats[] = Array.isArray(projectsData) ? projectsData : [];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-title flex items-center gap-3">
          <Download className="h-7 w-7" />
          Export
        </h1>
        <p className="text-muted-foreground">Export your projects as ZIP archives or JSON files</p>
      </div>

      {/* Selection Controls */}
      <Card className="card-notion">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as 'zip' | 'json')}>
              <SelectTrigger>
                <SelectValue placeholder="Formato de export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zip">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    ZIP Package
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON Only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => selectedProject && exportMutation.mutate({ projectId: selectedProject, format: selectedFormat })}
              disabled={!selectedProject || exportMutation.isPending}
              className="gap-2"
            >
              {exportMutation.isPending ? (
                <>
                  <Package className="h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Progress */}
      {isExporting && (
        <Card className="card-notion">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting project...</span>
                <span className="text-sm text-muted-foreground">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {selectedFormat === 'zip' ? 'Generating ZIP archive with project files...' : 'Preparing JSON export data...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Result */}
      {exportResult && (
        <Alert className={exportResult.success ? "border-accent-green" : "border-destructive"}>
          {exportResult.success ? (
            <CheckCircle className="h-4 w-4 text-accent-green" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription>
            {exportResult.success ? (
              <div className="space-y-2">
                <p className="font-medium">Export completed successfully!</p>
                <div className="text-sm space-y-1">
                  <p>Project: <strong>{exportResult.project_name}</strong></p>
                  <p>Format: <strong>{exportResult.format.toUpperCase()}</strong></p>
                  <p>Package size: <strong>{exportResult.size}</strong></p>
                  <div>
                    <p className="font-medium mb-1">Included files:</p>
                    <div className="flex flex-wrap gap-1">
                      {exportResult.files.map((file: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {file}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="font-medium text-destructive">{exportResult.error}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Project Preview */}
      {selectedProject && projects.length > 0 && (
        <Card className="card-notion">
          <CardHeader>
            <CardTitle className="text-lg">Preview: {projects.find(p => p.id === selectedProject)?.name}</CardTitle>
            <CardDescription>Informações do projeto selecionado para export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-semibold text-heading">{projects.find(p => p.id === selectedProject)?.agents_count}</div>
                <div className="text-xs text-muted-foreground">Agents</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-heading">{projects.find(p => p.id === selectedProject)?.tasks_count}</div>
                <div className="text-xs text-muted-foreground">Tasks</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-heading">{projects.find(p => p.id === selectedProject)?.executions_count}</div>
                <div className="text-xs text-muted-foreground">Runs</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Model:</span>
                <Badge variant="outline">{projects.find(p => p.id === selectedProject)?.model_provider}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Language:</span>
                <span className="font-medium">{projects.find(p => p.id === selectedProject)?.language.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{new Date(projects.find(p => p.id === selectedProject)?.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Export Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="card-notion">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-radius flex items-center justify-center">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {project.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-semibold text-heading">{project.agents_count}</div>
                  <div className="text-xs text-muted-foreground">Agents</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-heading">{project.tasks_count}</div>
                  <div className="text-xs text-muted-foreground">Tasks</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-heading">{project.executions_count}</div>
                  <div className="text-xs text-muted-foreground">Runs</div>
                </div>
              </div>

              <Separator />

              {/* Model Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Model:</span>
                  <Badge variant="outline">{project.model_provider}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Language:</span>
                  <span className="font-medium">{project.language.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <Separator />

            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Information */}
      <Card className="card-notion">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Export Information
          </CardTitle>
          <CardDescription>
            What's included in each export format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* ZIP Package */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-accent-purple" />
                <h4 className="font-semibold">ZIP Package</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete project export with all files needed to run independently
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileJson className="h-4 w-4 text-muted-foreground" />
                  <span>project.json - Project configuration</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>agents.yaml - Agent definitions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>tasks.yaml - Task configurations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span>crew.py - Main crew implementation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span>main.py - Execution entry point</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span>tools.py - Custom tools</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>requirements.txt - Dependencies</span>
                </div>
              </div>
            </div>

            {/* JSON Export */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-accent-green" />
                <h4 className="font-semibold">JSON Export</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Project configuration only, suitable for importing into other CrewAI Studio instances
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Project metadata and settings</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Agent configurations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Task definitions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Workflow connections</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}