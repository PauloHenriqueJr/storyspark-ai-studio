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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedExecution(null)}>
              ← Back
            </Button>
            <div>
              <h1 className="text-title">Execution Details</h1>
              <p className="text-muted-foreground">
                Execution ID: <code className="bg-muted px-1 rounded text-xs">{selectedExecution.id}</code>
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(selectedExecution.status)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {selectedExecution.status}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Execution Info */}
          <Card className="card-notion">
            <CardHeader>
              <CardTitle>Execution Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">{selectedExecution.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p className="font-medium">
                    {selectedExecution.execution_time ? `${selectedExecution.execution_time}s` : 'Running...'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Started:</span>
                  <p className="font-medium">{new Date(selectedExecution.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Completed:</span>
                  <p className="font-medium">
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

              {/* Input Payload */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Input Parameters:</span>
                <pre className="bg-muted p-3 rounded-radius text-xs overflow-auto">
                  {JSON.stringify(selectedExecution.input_payload, null, 2)}
                </pre>
              </div>

              {/* Output Payload */}
              {selectedExecution.output_payload && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Output Results:</span>
                  <pre className="bg-muted p-3 rounded-radius text-xs overflow-auto">
                    {JSON.stringify(selectedExecution.output_payload, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execution Logs */}
          <Card className="card-notion">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Execution Logs</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleCopyLogs(selectedExecution.logs)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-auto">
                {parsedLogs.map((log, index) => (
                  <div key={index} className="flex gap-3 text-xs font-mono">
                    <span className="text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge 
                      variant={log.level === 'error' ? 'destructive' : 'outline'} 
                      className="text-xs px-1 py-0"
                    >
                      {log.level}
                    </Badge>
                    <span className="flex-1">{log.message}</span>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title flex items-center gap-3">
            <History className="h-7 w-7" />
            Executions
          </h1>
          <p className="text-muted-foreground">View execution history and detailed logs</p>
        </div>
        
        {/* Filters and Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Projeto:</span>
            <select className="border rounded p-1 bg-background" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              {(projects as any[] | undefined)?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <label className="ml-4 flex items-center gap-2">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              Auto-refresh
            </label>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>Atualizar</Button>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-accent-green">
              {list.filter(e => e.status === 'completed').length}
            </div>
            <div className="text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-accent-yellow">
              {list.filter(e => e.status === 'running').length}
            </div>
            <div className="text-muted-foreground">Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-destructive">
              {list.filter(e => e.status === 'error').length}
            </div>
            <div className="text-muted-foreground">Failed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search executions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-notion"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-radius flex items-center justify-center ${
                      execution.status === 'completed' ? 'bg-accent-green/10' :
                      execution.status === 'running' ? 'bg-accent-yellow/10' :
                      execution.status === 'error' ? 'bg-destructive/10' :
                      'bg-muted'
                    }`}>
                      <StatusIcon className={`h-5 w-5 ${getStatusColor(execution.status)}`} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">Execution {execution.id}</h3>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(execution.created_at).toLocaleString()}
                        </span>
                        {execution.execution_time && (
                          <span>Duration: {execution.execution_time}s</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewExecution(execution)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyLogs(execution.logs)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Logs
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download Results
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Quick Preview */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Input: </span>
                      <span className="font-mono text-xs">
                        {JSON.stringify(execution.input_payload, null, 0).slice(0, 50)}...
                      </span>
                    </div>
                    {execution.output_payload && (
                      <div>
                        <span className="text-muted-foreground">Output: </span>
                        <span className="font-mono text-xs">
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
          <div className="text-center py-12">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No executions found</h3>
            <p className="text-muted-foreground">
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
