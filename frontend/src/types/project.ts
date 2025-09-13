export interface Project {
  id: string;
  name: string;
  description: string;
  model_provider: 'openrouter' | 'gemini' | 'openai' | 'anthropic';
  model_name: string;
  language: 'pt' | 'en' | 'es' | 'fr';
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  model_provider: Project['model_provider'];
  model_name: string;
  language: Project['language'];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

export interface ProjectWithStats extends Project {
  agents_count: number;
  tasks_count: number;
  executions_count: number;
  last_execution_at?: string;
}