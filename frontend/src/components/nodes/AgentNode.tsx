import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Users, Bot, Brain, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AgentNodeData {
  name: string;
  role: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  tools?: string[];
  memory?: boolean;
  delegation?: boolean;
  isCreating?: boolean;
  isRunning?: boolean;
}

const AgentNode = memo(({ data, selected }: NodeProps<AgentNodeData>) => {
  // Debug: Log status changes
  console.log('AgentNode render:', { id: data.name, status: data.status });
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
        return 'Concluído';
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
        return <Bot className="h-3 w-3" />;
      case 'failed':
        return <Bot className="h-3 w-3" />;
      default:
        return <Bot className="h-3 w-3" />;
    }
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl shadow-md border-2 transition-all duration-200",
        "min-w-[240px] max-w-[280px] relative",
        selected ? "border-primary shadow-lg scale-105" : "border-gray-200 dark:border-gray-700",
        data.status === 'running' && "border-blue-500 shadow-blue-200 dark:shadow-blue-900/20",
        data.status === 'completed' && "border-green-500 shadow-green-200 dark:shadow-green-900/20",
        data.status === 'failed' && "border-red-500 shadow-red-200 dark:shadow-red-900/20",
        data.status === 'running' && "animate-pulse",
        data.isCreating && "border-primary shadow-lg animate-pulse",
        data.isRunning && "border-blue-500 shadow-lg animate-pulse"
      )}
    >
      {/* AI Creation Indicator */}
      {data.isCreating && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Zap className="w-3 h-3 text-white" />
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
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {data.name || 'Agent'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {data.role || 'Role not defined'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Running Overlay */}
      {data.status === 'running' && (
        <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none">
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="px-3 pb-2">
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
      </div>

      {/* Capabilities */}
      {(data.tools && data.tools.length > 0) && (
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1">
            {data.tools.slice(0, 3).map((tool, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400"
              >
                {tool}
              </span>
            ))}
            {data.tools.length > 3 && (
              <span className="text-[10px] text-gray-500">
                +{data.tools.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="px-3 pb-2 flex items-center gap-3">
        {data.memory && (
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-500">Memory</span>
          </div>
        )}
        {data.delegation && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-500">Delegate</span>
          </div>
        )}
      </div>

      {/* Handle for outgoing connections (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
});

AgentNode.displayName = 'AgentNode';

export default AgentNode;