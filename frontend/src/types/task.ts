export interface Task {
  id: string;
  project_id: string;
  agent_id: string;
  description: string;
  expected_output: string;
  tools: string[];
  async_execution: boolean;
  output_file: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  project_id: string;
  agent_id: string;
  description: string;
  expected_output: string;
  tools: string[];
  async_execution: boolean;
  output_file: string;
}

export interface UpdateTaskRequest extends Partial<Omit<CreateTaskRequest, 'project_id'>> {}

export interface TaskWithAgent extends Task {
  agent?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface TaskExecution {
  task_id: string;
  inputs: Record<string, any>;
  language: 'pt' | 'en' | 'es' | 'fr';
}

// Task template variables detection
export interface TaskVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description?: string;
}

export function extractVariables(text: string): TaskVariable[] {
  const regex = /\{([^}]+)\}/g;
  const variables: TaskVariable[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const varName = match[1];
    if (!variables.find(v => v.name === varName)) {
      variables.push({
        name: varName,
        type: 'string',
        required: true,
        description: `Variable: ${varName}`,
      });
    }
  }
  
  return variables;
}