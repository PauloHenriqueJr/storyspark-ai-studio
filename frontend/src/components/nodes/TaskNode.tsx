import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckSquare, FileText, Clock, AlertCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface TaskNodeData {
  description: string;
  expectedOutput?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  agentName?: string;
  async?: boolean;
  outputFile?: string;
  isCreating?: boolean;
  isRunning?: boolean;
}

const TaskNode = memo(({ data, selected }: NodeProps<TaskNodeData>) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'running':
        return 'bg-blue-500 animate-pulse';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (data.status) {
      case 'running':
        return 'Executando...';
      case 'completed':
        return 'Concluída';
      case 'failed':
        return 'Falhou';
      default:
        return 'Aguardando';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Zap className="h-3 w-3 animate-spin" />;
      case 'completed':
        return <CheckSquare className="h-3 w-3" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl shadow-md border-2 transition-all duration-200",
        "min-w-[220px] max-w-[260px] relative",
        selected ? "border-primary shadow-lg scale-105" : "border-gray-200 dark:border-gray-700",
        data.status === 'running' && "animate-pulse",
        data.isCreating && "border-primary shadow-lg animate-pulse",
        data.isRunning && "border-blue-500 shadow-lg animate-pulse"
      )}
    >
      {/* AI Creation Indicator */}
      {data.isCreating && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <CheckSquare className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* Running Indicator */}
      {data.isRunning && (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>
      )}
      {/* Handle for incoming connections (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-3 !h-3 !border-2 !border-white"
      />

      {/* Header */}
      <div className="p-3 pb-2">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
            <CheckSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {data.description || 'Task description'}
            </p>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-2 py-0.5",
              data.status === 'running' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
              data.status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
              data.status === 'failed' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            )}
          >
            <div className="flex items-center gap-1.5">
              {getStatusIcon()}
              {getStatusText()}
            </div>
          </Badge>
          {data.async && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
              <Clock className="w-2.5 h-2.5 mr-1" />
              Async
            </Badge>
          )}
        </div>
      </div>

      {/* Expected Output */}
      {data.expectedOutput && (
        <div className="px-3 pb-2">
          <div className="flex items-start gap-1">
            <FileText className="w-3 h-3 text-gray-400 mt-0.5" />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">
              {data.expectedOutput}
            </p>
          </div>
        </div>
      )}

      {/* Agent Assignment */}
      {data.agentName && (
        <div className="px-3 pb-2 border-t border-gray-100 dark:border-gray-800 pt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[10px] text-gray-600 dark:text-gray-400">
              Assigned to: <span className="font-medium">{data.agentName}</span>
            </span>
          </div>
        </div>
      )}

      {/* Handle for outgoing connections (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';

export default TaskNode;