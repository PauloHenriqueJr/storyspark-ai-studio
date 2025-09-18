import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Copy,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultPanelProps {
  execution: {
    id: string;
    status: string;
    output_payload?: Record<string, unknown>;
    logs?: string;
    error_message?: string;
    created_at?: string;
    updated_at?: string;
  };
  onNavigateToExecutions?: () => void;
  className?: string;
}

export function ResultPanel({ execution, onNavigateToExecutions, className }: ResultPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullLogs, setShowFullLogs] = useState(false);
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'failed':
      case 'error':
        return 'Falhou';
      case 'running':
        return 'Executando';
      default:
        return 'Desconhecido';
    }
  };

  const resultText = typeof execution.output_payload?.result === 'string'
    ? String(execution.output_payload.result)
    : execution.logs || execution.error_message || 'Nenhum resultado disponível';

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      toast({
        title: "Copiado!",
        description: "Resultado copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o resultado",
        variant: "destructive",
      });
    }
  };

  const handleDownloadResult = () => {
    const blob = new Blob([resultText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execucao_${execution.id}_resultado.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download iniciado",
      description: "Arquivo de resultado baixado com sucesso",
    });
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString('pt-BR');
    } catch {
      return timestamp;
    }
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(execution.status)}
            <div>
              <CardTitle className="text-lg">Resultado da Execução</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(execution.status)} variant="secondary">
                  {getStatusText(execution.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ID: {execution.id}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:flex"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isExpanded ? 'Minimizar' : 'Expandir'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="sm:hidden"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações básicas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Criado:</span>
            <span>{formatTimestamp(execution.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Atualizado:</span>
            <span>{formatTimestamp(execution.updated_at)}</span>
          </div>
        </div>

        <Separator />

        {/* Resultado */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resultado
            </h4>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullLogs(!showFullLogs)}
                className="hidden sm:flex"
              >
                {showFullLogs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showFullLogs ? 'Ocultar' : 'Mostrar'} completo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullLogs(!showFullLogs)}
                className="sm:hidden"
              >
                {showFullLogs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border">
            <pre className="whitespace-pre-wrap text-sm font-mono break-words">
              {isExpanded || showFullLogs ? resultText : truncateText(resultText)}
            </pre>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyResult}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar Resultado
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadResult}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>

          {onNavigateToExecutions && (
            <Button
              variant="default"
              size="sm"
              onClick={onNavigateToExecutions}
              className="flex items-center gap-2 ml-auto"
            >
              <ExternalLink className="h-4 w-4" />
              Ver Detalhes Completos
            </Button>
          )}
        </div>

        {/* Badge de navegação para mobile */}
        {onNavigateToExecutions && (
          <div className="sm:hidden pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={onNavigateToExecutions}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ver Detalhes Completos na Página de Execuções
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}