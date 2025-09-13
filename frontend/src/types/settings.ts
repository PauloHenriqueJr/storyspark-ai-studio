export interface Setting {
  key: string;
  value: string;
  category: string;
  description?: string;
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingRequest {
  key: string;
  value: string;
}

// Integration categories and their settings
export interface Integration {
  key: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  required_fields: IntegrationField[];
  documentation_url?: string;
  is_configured: boolean;
}

export type IntegrationCategory =
  | "llm_providers"
  | "search_engines"
  | "communication"
  | "databases"
  | "cloud_services"
  | "development"
  | "productivity"
  | "payment";

export interface IntegrationField {
  key: string;
  name: string;
  type: "text" | "password" | "url" | "json";
  required: boolean;
  description?: string;
  placeholder?: string;
}

// Pre-defined integrations based on the backend
export const INTEGRATIONS: Integration[] = [
  // LLM Providers
  {
    key: "openrouter",
    name: "OpenRouter",
    description: "Access to multiple LLM models via OpenRouter",
    category: "llm_providers",
    required_fields: [
      {
        key: "OPENROUTER_API_KEY",
        name: "API Key",
        type: "password",
        required: true,
        placeholder: "sk-or-...",
      },
    ],
    documentation_url: "https://openrouter.ai/docs",
    is_configured: false,
  },
  {
    key: "openai",
    name: "OpenAI",
    description: "GPT models and API access",
    category: "llm_providers",
    required_fields: [
      {
        key: "OPENAI_API_KEY",
        name: "API Key",
        type: "password",
        required: true,
        placeholder: "sk-...",
      },
    ],
    documentation_url: "https://platform.openai.com/docs",
    is_configured: false,
  },
  {
    key: "anthropic",
    name: "Anthropic",
    description: "Claude models and API access",
    category: "llm_providers",
    required_fields: [
      {
        key: "ANTHROPIC_API_KEY",
        name: "API Key",
        type: "password",
        required: true,
        placeholder: "sk-ant-...",
      },
    ],
    documentation_url: "https://docs.anthropic.com",
    is_configured: false,
  },
  {
    key: "gemini",
    name: "Google Gemini",
    description: "Gemini models from Google AI",
    category: "llm_providers",
    required_fields: [
      {
        key: "GEMINI_API_KEY",
        name: "API Key",
        type: "password",
        required: true,
        placeholder: "AI...",
      },
    ],
    documentation_url: "https://ai.google.dev/docs",
    is_configured: false,
  },

  // Search Engines
  {
    key: "serper",
    name: "Serper",
    description: "Google search API for web searches",
    category: "search_engines",
    required_fields: [
      {
        key: "SERPER_API_KEY",
        name: "API Key",
        type: "password",
        required: true,
      },
    ],
    documentation_url: "https://serper.dev/docs",
    is_configured: false,
  },

  // Communication
  {
    key: "SLACK_BOT_TOKEN",
    name: "Slack",
    description: "Send messages and interact with Slack",
    category: "communication",
    required_fields: [
      {
        key: "SLACK_BOT_TOKEN",
        name: "Bot Token",
        type: "password",
        required: true,
        placeholder: "xoxb-...",
      },
    ],
    documentation_url: "https://api.slack.com",
    is_configured: false,
  },
  {
    key: "DISCORD_BOT_TOKEN",
    name: "Discord",
    description: "Discord bot integration",
    category: "communication",
    required_fields: [
      {
        key: "DISCORD_BOT_TOKEN",
        name: "Bot Token",
        type: "password",
        required: true,
      },
    ],
    documentation_url: "https://discord.com/developers/docs",
    is_configured: false,
  },
  {
    key: "TELEGRAM_BOT_TOKEN",
    name: "Telegram",
    description: "Telegram bot integration",
    category: "communication",
    required_fields: [
      {
        key: "TELEGRAM_BOT_TOKEN",
        name: "Bot Token",
        type: "password",
        required: true,
      },
    ],
    documentation_url: "https://core.telegram.org/bots/api",
    is_configured: false,
  },

  // Development
  {
    key: "GITHUB_TOKEN",
    name: "GitHub",
    description: "Access GitHub repositories and APIs",
    category: "development",
    required_fields: [
      {
        key: "GITHUB_TOKEN",
        name: "Personal Access Token",
        type: "password",
        required: true,
        placeholder: "ghp_...",
      },
    ],
    documentation_url: "https://docs.github.com/en/rest",
    is_configured: false,
  },

  // Productivity
  {
    key: "GOOGLE_SHEETS_CREDENTIALS",
    name: "Google Sheets",
    description: "Read and write Google Sheets",
    category: "productivity",
    required_fields: [
      {
        key: "GOOGLE_SHEETS_CREDENTIALS",
        name: "Service Account JSON",
        type: "json",
        required: true,
      },
    ],
    documentation_url: "https://developers.google.com/sheets/api",
    is_configured: false,
  },
  {
    key: "NOTION_TOKEN",
    name: "Notion",
    description: "Access Notion databases and pages",
    category: "productivity",
    required_fields: [
      {
        key: "NOTION_TOKEN",
        name: "Integration Token",
        type: "password",
        required: true,
        placeholder: "secret_...",
      },
    ],
    documentation_url: "https://developers.notion.com",
    is_configured: false,
  },

  // Payment
  {
    key: "STRIPE_SECRET_KEY",
    name: "Stripe",
    description: "Payment processing with Stripe",
    category: "payment",
    required_fields: [
      {
        key: "STRIPE_SECRET_KEY",
        name: "Secret Key",
        type: "password",
        required: true,
        placeholder: "sk_...",
      },
    ],
    documentation_url: "https://stripe.com/docs/api",
    is_configured: false,
  },
];

// App settings
export interface AppSettings {
  theme: "light" | "dark" | "auto";
  language: "pt" | "en" | "es" | "fr";
  auto_save: boolean;
  notifications: boolean;
  execution_timeout: number; // in minutes
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "light",
  language: "pt",
  auto_save: true,
  notifications: true,
  execution_timeout: 30,
};
