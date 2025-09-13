export type ExecutionStatus = 'created' | 'running' | 'completed' | 'error';

export interface Execution {
  id: string;
  project_id: string;
  agent_id?: string;
  task_id?: string;
  status: ExecutionStatus;
  input_payload: Record<string, any>;
  output_payload?: Record<string, any>;
  logs: string;
  error_message?: string;
  execution_time?: number; // in seconds
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateExecutionRequest {
  project_id: string;
  inputs: Record<string, any>;
  language: 'pt' | 'en' | 'es' | 'fr';
  agent_id?: string;
  task_id?: string;
}

export interface ExecutionLogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  agent?: string;
  task?: string;
}

export interface ExecutionStats {
  total: number;
  completed: number;
  running: number;
  failed: number;
  avg_execution_time: number;
}

export interface ExecutionWithDetails extends Execution {
  project_name: string;
  agent_name?: string;
  task_description?: string;
}

// Real-time execution events for streaming
export interface ExecutionEvent {
  execution_id: string;
  type: 'log' | 'status_change' | 'progress' | 'output';
  data: any;
  timestamp: string;
}

// Parse logs into structured entries
export function parseExecutionLogs(logs: string): ExecutionLogEntry[] {
  if (!logs) return [];
  
  return logs.split('\n').map(line => {
    const timestamp = new Date().toISOString();
    
    // Try to parse structured logs
    try {
      const parsed = JSON.parse(line);
      return {
        timestamp: parsed.timestamp || timestamp,
        level: parsed.level || 'info',
        message: parsed.message || line,
        agent: parsed.agent,
        task: parsed.task,
      };
    } catch {
      // Fallback to plain text
      return {
        timestamp,
        level: 'info' as const,
        message: line,
      };
    }
  }).filter(entry => entry.message.trim());
}