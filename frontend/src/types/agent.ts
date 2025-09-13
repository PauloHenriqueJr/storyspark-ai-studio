export interface Agent {
  id: string;
  project_id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  verbose: boolean;
  memory: boolean;
  allow_delegation: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentRequest {
  project_id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  verbose: boolean;
  memory: boolean;
  allow_delegation: boolean;
}

export interface UpdateAgentRequest extends Partial<Omit<CreateAgentRequest, 'project_id'>> {}

export interface AgentWithTasks extends Agent {
  tasks_count: number;
}

// Available tools for agents
export const AVAILABLE_TOOLS = [
  'WebSearchTool',
  'FileReaderTool',
  'DirectoryReaderTool',
  'CodeInterpreterTool',
  'JSONSearchTool',
  'XMLSearchTool',
  'CSVSearchTool',
  'TXTSearchTool',
  'PDFSearchTool',
  'DOCXSearchTool',
  'MDXSearchTool',
  'YoutubeChannelSearchTool',
  'YoutubeVideoSearchTool',
  'SerperDevTool',
  'BrowserBaseLoadTool',
  'EXASearchTool',
  'GitHubSearchTool',
  'ScrapeWebsiteTool',
  'ScrapflyTool',
  'SlackChannelTool',
  'SlackMessageTool',
  'TelegramTool',
  'DiscordTool',
  'EmailTool',
  'HTTPRequestTool',
  'APITool',
  'DatabaseTool',
  'SQLQueryTool',
  'PostgreSQLTool',
  'MySQLTool',
  'SQLiteTool',
  'CustomTool',
] as const;

export type ToolName = typeof AVAILABLE_TOOLS[number];