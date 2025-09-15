import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  History,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Eye,
  MoreVertical,
  Download,
  Copy,
  Share,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient, queryKeys } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parseExecutionLogs } from '@/types/execution';

export default function Executions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Function to render results in a user-friendly format
  const renderResult = (result: any): JSX.Element => {
    if (typeof result === 'string') {
      // Check if it's a long text that might be formatted
      if (result.length > 200) {
        return (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {result}
            </div>
          </div>
        );
      }
      return <div className="text-sm whitespace-pre-wrap">{result}</div>;
    }

    if (Array.isArray(result)) {
      return (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground mb-2">
            Lista com {result.length} itens:
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {result.map((item, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-background rounded border">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  {index + 1}
                </span>
                <div className="text-sm flex-1">
                  {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (typeof result === 'object' && result !== null) {
      // Check for common AI response formats
      if (result.content || result.response || result.answer) {
        const content = result.content || result.response || result.answer;
        return (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Resposta gerada:</div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed bg-background p-3 rounded border">
              {content}
            </div>
            {Object.keys(result).length > 1 && (
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Ver metadados completos
                </summary>
                <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            )}
          </div>
        );
      }

      // Generic object display
      return (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Dados estruturados:</div>
          <div className="grid gap-2">
            {Object.entries(result).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1 p-2 bg-background rounded border">
                <span className="text-xs font-medium text-primary capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="text-sm">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Fallback for other types
    return (
      <div className="text-sm">
        <span className="text-muted-foreground">Tipo: </span>
        <code className="bg-muted px-1 py-0.5 rounded text-xs">
          {typeof result}
        </code>
        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  const { data: projects } = useQuery({ queryKey: queryKeys.projects(), queryFn: () => apiClient.getProjects() });
  const { data: executions, refetch, isFetching } = useQuery({
    queryKey: projectFilter ? queryKeys.executions(projectFilter) : queryKeys.executions(),
    queryFn: () => apiClient.executions.list(projectFilter ? Number(projectFilter) : undefined),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // initialize projectFilter with first project when available
  useEffect(() => {
    if (!projectFilter && Array.isArray(projects) && projects.length) {
      setProjectFilter(String(projects[0].id));
    }
  }, [projects, projectFilter]);

  const list = useMemo(() => (executions as any[] | undefined) || [], [executions]);
  const filteredExecutions = list.filter(execution => {
    const matchesSearch = execution.logs.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewExecution = (execution: any) => {
    setSelectedExecution(execution);
  };

  const handleCopyLogs = (logs: string) => {
    navigator.clipboard.writeText(logs);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-accent-green';
      case 'running': return 'text-accent-yellow';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Play;
      case 'error': return XCircle;
      default: return Clock;
    }
  };

  if (selectedExecution) {
    const parsedLogs = parseExecutionLogs(selectedExecution.logs);
    const StatusIcon = getStatusIcon(selectedExecution.status);

    return (
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedExecution(null)} className="flex items-center gap-2">
              ← <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-title text-xl sm:text-2xl">Execution Details</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Execution ID: <code className="bg-muted px-1 py-0.5 rounded text-xs">{selectedExecution.id}</code>
              </p>
            </div>
          </div>
          <Badge className={`${getStatusColor(selectedExecution.status)} text-sm px-3 py-1`}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {selectedExecution.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Execution Info */}
          <Card className="card-notion">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Execution Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Status:</span>
                  <p className="font-medium">{selectedExecution.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Duration:</span>
                  <p className="font-medium">
                    {selectedExecution.execution_time ? `${selectedExecution.execution_time}s` : 'Running...'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block mb-1">Started:</span>
                  <p className="font-medium break-all">{new Date(selectedExecution.created_at).toLocaleString()}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block mb-1">Completed:</span>
                  <p className="font-medium break-all">
                    {selectedExecution.completed_at
                      ? new Date(selectedExecution.completed_at).toLocaleString()
                      : 'Still running'
                    }
                  </p>
                </div>
              </div>

              {selectedExecution.error_message && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-radius">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Error</p>
                      <p className="text-sm text-destructive/80">{selectedExecution.error_message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Output Payload */}
              {selectedExecution.output_payload && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resultados da Execução:</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const result = selectedExecution.output_payload.result;
                          const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
                          const blob = new Blob([content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `execucao-${selectedExecution.id}-resultado.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const result = selectedExecution.output_payload.result;
                          const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
                          navigator.clipboard.writeText(content);
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                  </div>

                  {/* Result Section - Collapsible */}
                  {selectedExecution.output_payload.result && (
                    <div className="space-y-2">
                      <details className="group">
                        <summary className="text-sm font-medium cursor-pointer text-primary hover:text-primary/80 flex items-center gap-2">
                          <span>Resultado Principal</span>
                          <span className="text-xs group-open:rotate-90 transition-transform">▶</span>
                        </summary>
                        <div className="mt-3 bg-muted/50 p-4 rounded-radius border">
                          {renderResult(selectedExecution.output_payload.result)}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Simulate sharing - could integrate with actual sharing APIs
                        const result = selectedExecution.output_payload.result;
                        const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
                        const shareData = {
                          title: `Resultado da Execução #${selectedExecution.id}`,
                          text: content.length > 200 ? content.substring(0, 200) + '...' : content,
                          url: window.location.href
                        };

                        if (navigator.share) {
                          navigator.share(shareData);
                        } else {
                          navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
                          // Could show a toast notification here
                        }
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Could open a modal with export options (PDF, Word, etc.)
                        const result = selectedExecution.output_payload.result;
                        const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
                        // For now, just copy formatted version
                        const formatted = `EXECUÇÃO #${selectedExecution.id}\n${'='.repeat(50)}\n\nRESULTADO:\n${content}\n\n${'='.repeat(50)}\nGerado em: ${new Date(selectedExecution.created_at).toLocaleString('pt-BR')}`;
                        navigator.clipboard.writeText(formatted);
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      Exportar Relatório
                    </Button>
                  </div>

                  {/* Raw JSON for developers - Collapsed by default */}
                  <details className="group">
                    <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2">
                      <span>Dados Técnicos (JSON)</span>
                      <span className="text-xs group-open:rotate-90 transition-transform">▶</span>
                    </summary>
                    <pre className="bg-muted p-3 rounded-radius text-xs overflow-auto mt-2">
                      {JSON.stringify(selectedExecution.output_payload, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execution Logs */}
          <Card className="card-notion">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-lg">Execution Logs</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleCopyLogs(selectedExecution.logs)} className="self-start sm:self-center">
                  <Copy className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Copy Logs</span>
                  <span className="sm:hidden">Copy</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                {parsedLogs.map((log, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 text-xs font-mono p-2 rounded bg-muted/30">
                    <span className="text-muted-foreground whitespace-nowrap text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge
                      variant={log.level === 'error' ? 'destructive' : 'outline'}
                      className="text-xs px-1 py-0 self-start"
                    >
                      {log.level}
                    </Badge>
                    <span className="flex-1 text-xs break-all">{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-title flex items-center gap-3 text-xl sm:text-2xl">
            <History className="h-6 w-6 sm:h-7 sm:w-7" />
            Executions
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">View execution history and detailed logs</p>
        </div>

        {/* Filters and Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs sm:text-sm">Projeto:</span>
              <select className="border rounded p-2 bg-background text-sm min-w-0" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                {(projects as any[] | undefined)?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs sm:text-sm">
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded" />
                Auto-refresh
              </label>
              <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching} className="text-xs sm:text-sm px-3 py-1 h-8">
                Atualizar
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-semibold text-accent-green">
                {list.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-semibold text-accent-yellow">
                {list.filter(e => e.status === 'running').length}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">Running</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-semibold text-destructive">
                {list.filter(e => e.status === 'error').length}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm">Failed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search executions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-notion h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="error">Failed</SelectItem>
            <SelectItem value="created">Created</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Executions List */}
      <div className="space-y-4">
        {filteredExecutions.map((execution) => {
          const StatusIcon = getStatusIcon(execution.status);
          return (
            <Card key={execution.id} className="card-notion hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 rounded-radius flex items-center justify-center flex-shrink-0 ${execution.status === 'completed' ? 'bg-accent-green/10' :
                      execution.status === 'running' ? 'bg-accent-yellow/10' :
                        execution.status === 'error' ? 'bg-destructive/10' :
                          'bg-muted'
                      }`}>
                      <StatusIcon className={`h-5 w-5 ${getStatusColor(execution.status)}`} />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h3 className="font-semibold text-base sm:text-lg">Execution {execution.id}</h3>
                        <Badge className={`${getStatusColor(execution.status)} text-xs`}>
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{new Date(execution.created_at).toLocaleString()}</span>
                        </span>
                        {execution.execution_time && (
                          <span className="text-xs sm:text-sm">Duration: {execution.execution_time}s</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewExecution(execution)}
                      className="text-xs sm:text-sm px-3 py-1 h-8"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyLogs(execution.logs)} className="text-xs sm:text-sm">
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Logs
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs sm:text-sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download Results
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Quick Preview */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-xs sm:text-sm">Input: </span>
                      <span className="font-mono text-xs break-all">
                        {JSON.stringify(execution.input_payload, null, 0).slice(0, 50)}...
                      </span>
                    </div>
                    {execution.output_payload && (
                      <div className="min-w-0">
                        <span className="text-muted-foreground text-xs sm:text-sm">Output: </span>
                        <span className="font-mono text-xs break-all">
                          {JSON.stringify(execution.output_payload, null, 0).slice(0, 50)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredExecutions.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2 text-lg sm:text-xl">No executions found</h3>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Run your first project to see execution history here'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
