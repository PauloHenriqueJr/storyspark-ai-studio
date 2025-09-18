import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, ExternalLink, Eye } from 'lucide-react';

interface ResultBadgeProps {
  execution: {
    id: string;
    status: string;
  };
  onShowResult: () => void;
  onNavigateToExecutions: () => void;
  className?: string;
}

export function ResultBadge({ execution, onShowResult, onNavigateToExecutions, className }: ResultBadgeProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Execução Concluída';
      case 'failed':
      case 'error':
        return 'Execução Falhou';
      default:
        return 'Execução Finalizada';
    }
  };

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm",
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon(execution.status)}
        <div className="flex-1">
          <div className="font-medium text-sm">{getStatusText(execution.status)}</div>
          <div className="text-xs text-muted-foreground">ID: {execution.id}</div>
        </div>
        <Badge className={getStatusColor(execution.status)} variant="secondary">
          {execution.status}
        </Badge>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onShowResult}
          className="flex-1 text-xs"
        >
          <Eye className="h-3 w-3 mr-1" />
          Ver Resultado
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onNavigateToExecutions}
          className="flex-1 text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Detalhes
        </Button>
      </div>
    </div>
  );
}