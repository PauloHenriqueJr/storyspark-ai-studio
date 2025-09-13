import { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Package, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  FileJson,
  Github,
  Archive,
  Code,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient, queryKeys } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ImportResult {
  success: boolean;
  project_id?: string;
  imported_agents?: number;
  imported_tasks?: number;
  detected_integrations?: string[];
  message: string;
  warnings?: string[];
}

export default function Import() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('json');
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['json', 'n8n', 'yaml', 'zip'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [jsonContent, setJsonContent] = useState('');
  const [yamlContent, setYamlContent] = useState('');
  const [n8nContent, setN8nContent] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const n8nInputRef = useRef<HTMLInputElement>(null);
  const yamlInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // Load available projects to target YAML import
  const { data: projects } = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => apiClient.getProjects(),
  });

  const handleImportJson = async () => {
    if (!jsonContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide JSON content to import.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setImportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      let resp: any;
      if (jsonFile) {
        resp = await apiClient.importJson(jsonFile);
      } else {
        let payload: any;
        try { payload = JSON.parse(jsonContent); } catch { payload = jsonContent; }
        resp = await apiClient.importJson(payload);
      }
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult({ success: true, project_id: String(resp.id ?? resp.name ?? ''), message: 'Project imported successfully from JSON' });
      toast({ title: 'Import Successful', description: 'Project imported successfully from JSON' });
      await qc.invalidateQueries({ queryKey: queryKeys.projects() as any });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import JSON. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportN8n = async () => {
    if (!n8nContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide n8n workflow JSON to import.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setImportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 15, 90));
      }, 300);
      let payload: any; try { payload = JSON.parse(n8nContent); } catch { payload = n8nContent; }
      const resp = await apiClient.importN8nWorkflow(payload);
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult({ success: true, project_id: String(resp.id ?? resp.name ?? ''), message: 'n8n workflow converted and imported' });
      toast({ title: 'n8n Import Successful', description: 'n8n workflow converted and imported' });
      await qc.invalidateQueries({ queryKey: queryKeys.projects() as any });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import n8n workflow. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.zip')) {
        handleZipImport(file);
      } else if (file.name.endsWith('.json')) {
        if (activeTab === 'n8n') {
          setN8nContent(content);
        } else {
          setJsonContent(content);
          setJsonFile(file);
        }
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        setYamlContent(content);
      }
    };
    
    if (file.name.endsWith('.zip')) {
      handleZipImport(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleZipImport = async (file: File) => {
    setIsLoading(true);
    setImportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 8, 90));
      }, 400);
      const resp = await apiClient.importZip(file);
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult({ success: true, project_id: String(resp.id ?? resp.name ?? ''), message: 'Complete project imported from ZIP file' });
      toast({ title: 'ZIP Import Successful', description: 'Complete project imported from ZIP file' });
      await qc.invalidateQueries({ queryKey: queryKeys.projects() as any });
    } catch (error) {
      toast({ title: 'Import Failed', description: 'Failed to import ZIP file. Please check the content.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportYamlAsAgents = async () => {
    if (!yamlContent.trim() || !selectedProjectId) return;
    setIsLoading(true);
    setImportProgress(0);
    try {
      const progressInterval = setInterval(() => setImportProgress((p) => Math.min(p + 10, 90)), 200);
      await apiClient.importAgentsYaml(selectedProjectId, yamlContent);
      clearInterval(progressInterval);
      setImportProgress(100);
      toast({ title: 'Agents imported', description: 'Agents YAML imported into selected project' });
    } catch (e) {
      toast({ title: 'Import Failed', description: 'Failed to import Agents YAML', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const handleImportYamlAsTasks = async () => {
    if (!yamlContent.trim() || !selectedProjectId) return;
    setIsLoading(true);
    setImportProgress(0);
    try {
      const progressInterval = setInterval(() => setImportProgress((p) => Math.min(p + 10, 90)), 200);
      await apiClient.importTasksYaml(selectedProjectId, yamlContent);
      clearInterval(progressInterval);
      setImportProgress(100);
      toast({ title: 'Tasks imported', description: 'Tasks YAML imported into selected project' });
    } catch (e) {
      toast({ title: 'Import Failed', description: 'Failed to import Tasks YAML', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = { getRootProps: () => ({}), getInputProps: () => ({}), isDragActive: false };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-title flex items-center gap-3">
          <Upload className="h-7 w-7" />
          Import
        </h1>
        <p className="text-muted-foreground">Import workflows, agents, and tasks from various sources</p>
      </div>

      {/* Import Progress */}
      {isLoading && (
        <Card className="card-notion">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importing...</span>
                <span className="text-sm text-muted-foreground">{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Alert className={importResult.success ? "border-accent-green" : "border-destructive"}>
          {importResult.success ? (
            <CheckCircle className="h-4 w-4 text-accent-green" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{importResult.message}</p>
              {importResult.success && (
                <div className="text-sm space-y-1">
                  <p>Project ID: <code className="bg-muted px-1 rounded text-xs">{importResult.project_id}</code></p>
                  {importResult.imported_agents && <p>Imported Agents: {importResult.imported_agents}</p>}
                  {importResult.imported_tasks && <p>Imported Tasks: {importResult.imported_tasks}</p>}
                  {importResult.detected_integrations && (
                    <div>
                      <p className="font-medium">Detected Integrations:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {importResult.detected_integrations.map((integration, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {integration}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {importResult.warnings && (
                    <div className="mt-2">
                      <p className="font-medium text-accent-yellow">Warnings:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {importResult.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setJsonFile(null); }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="json" className="gap-2">
            <FileJson className="h-4 w-4" />
            JSON/Project
          </TabsTrigger>
          <TabsTrigger value="n8n" className="gap-2">
            <Zap className="h-4 w-4" />
            n8n Workflow
          </TabsTrigger>
          <TabsTrigger value="yaml" className="gap-2">
            <Code className="h-4 w-4" />
            YAML
          </TabsTrigger>
          <TabsTrigger value="zip" className="gap-2">
            <Archive className="h-4 w-4" />
            ZIP Archive
          </TabsTrigger>
        </TabsList>

        {/* JSON/Project Import */}
        <TabsContent value="json" className="space-y-4">
          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Import Project JSON
              </CardTitle>
              <CardDescription>
                Import a complete project from exported JSON format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-radius-lg p-8 text-center transition-colors border-border">
                <input ref={jsonInputRef} type="file" accept=".json,.yaml,.yml" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Upload JSON file</p>
                <p className="text-sm text-muted-foreground mb-4">or paste content below</p>
                <Button type="button" variant="outline" onClick={() => jsonInputRef.current?.click()}>Browse Files</Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Or paste JSON content:</label>
                <Textarea
                  placeholder="Paste your project JSON here..."
                  value={jsonContent}
                  onChange={(e) => setJsonContent(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              
              <Button 
                onClick={handleImportJson}
                disabled={isLoading || !jsonContent.trim()}
                className="btn-primary w-full"
              >
                Import Project JSON
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* n8n Workflow Import */}
        <TabsContent value="n8n" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>n8n Workflow Conversion:</strong> This will analyze your n8n workflow and convert compatible nodes into CrewAI agents and tasks. Some manual configuration may be required.
            </AlertDescription>
          </Alert>

          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Import n8n Workflow
              </CardTitle>
              <CardDescription>
                Convert n8n workflow JSON into CrewAI project structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">n8n Workflow JSON:</label>
                <Textarea
                  placeholder="Paste your n8n workflow JSON here..."
                  value={n8nContent}
                  onChange={(e) => setN8nContent(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div>
                  <input ref={n8nInputRef} type="file" accept=".json" onChange={(e)=>handleFileSelect(e.target.files)} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => n8nInputRef.current?.click()}>Browse File</Button>
                </div>
              </div>
              
              <Button 
                onClick={handleImportN8n}
                disabled={isLoading || !n8nContent.trim()}
                className="btn-primary w-full"
              >
                Convert n8n Workflow
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* YAML Import */}
        <TabsContent value="yaml" className="space-y-4">
          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Import YAML
              </CardTitle>
              <CardDescription>
                Import agents or tasks from YAML configuration files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target project selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Project</label>
                <select
                  className="w-full border rounded-md bg-background p-2"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">Select a project...</option>
                  {(projects as any[] | undefined)?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">YAML Content:</label>
                <Textarea
                  placeholder="Paste your YAML configuration here..."
                  value={yamlContent}
                  onChange={(e) => setYamlContent(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div>
                  <input ref={yamlInputRef} type="file" accept=".yaml,.yml" onChange={(e)=>handleFileSelect(e.target.files)} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => yamlInputRef.current?.click()}>Browse YAML</Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleImportYamlAsAgents}
                  disabled={isLoading || !yamlContent.trim() || !selectedProjectId}
                  className="btn-primary flex-1"
                >
                  Import as Agents
                </Button>
                <Button 
                  onClick={handleImportYamlAsTasks}
                  disabled={isLoading || !yamlContent.trim() || !selectedProjectId}
                  variant="outline"
                  className="flex-1"
                >
                  Import as Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ZIP Import */}
        <TabsContent value="zip" className="space-y-4">
          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Import ZIP Archive
              </CardTitle>
              <CardDescription>
                Import a complete project from a ZIP archive containing all files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-radius-lg p-12 text-center transition-colors border-border">
                <input ref={zipInputRef} type="file" accept=".zip" onChange={(e)=>handleFileSelect(e.target.files)} className="hidden" />
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <p className="text-xl font-medium mb-2">Upload ZIP archive</p>
                <p className="text-muted-foreground mb-6">ZIP should contain project.json, agents.yaml, tasks.yaml</p>
                <Button type="button" variant="outline" size="lg" onClick={() => zipInputRef.current?.click()}>Select ZIP File</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
