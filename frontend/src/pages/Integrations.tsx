import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plug,
  Eye,
  EyeOff,
  Check,
  X,
  ExternalLink,
  Key,
  Zap,
  MessageSquare,
  Database,
  Code,
  CreditCard,
  Search,
  RefreshCw,
  Unplug,
  Settings
} from 'lucide-react';
import { INTEGRATIONS, type Integration } from '@/types/settings';
import { toast } from '@/components/ui/sonner';
import { apiClient, queryKeys } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

// API Configuration - same as in api.ts
const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" &&
    (process as any).env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:8000";

// Available models for each provider
const AVAILABLE_MODELS = {
  openrouter: [
    { id: 'openrouter/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
    { id: 'openrouter/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
    { id: 'openrouter/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'openrouter/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
    { id: 'openrouter/claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
    { id: 'openrouter/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  ],
  gemini: [
    { id: 'gemini/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
    { id: 'gemini/gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google' },
    { id: 'gemini/gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
    { id: 'gemini/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google' },
  ],
  openai: [
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  ],
  anthropic: [
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
    { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  ]
};

const SEQUENTIAL_SETTING_KEYS: Record<string, string> = {
  openrouter: 'OPENROUTER_FORCE_SEQUENTIAL',
  gemini: 'GEMINI_FORCE_SEQUENTIAL',
  openai: 'OPENAI_FORCE_SEQUENTIAL',
  anthropic: 'ANTHROPIC_FORCE_SEQUENTIAL',
};

export default function Integrations() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing' | null>>({});
  const [savingIntegrations, setSavingIntegrations] = useState<Set<string>>(new Set());
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});
  const [customModels, setCustomModels] = useState<Record<string, string>>({});
  const [sequentialFlags, setSequentialFlags] = useState<Record<string, boolean>>({});

  // Load configured settings from backend and flag configured integrations
  const { data: settings } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => apiClient.getSettings(),
  });

  const configuredMap: Record<string, string> = (settings as any[] || []).reduce((acc: Record<string, string>, s: any) => { acc[s.key] = s.value; return acc; }, {});

  // Update is_configured based on settings
  if (settings && integrations.some(i => !i.is_configured)) {
    const updated = integrations.map(i => ({
      ...i,
      is_configured: i.required_fields.every(f => (configuredMap[f.key] || '').length > 0)
    }));
    if (JSON.stringify(updated) !== JSON.stringify(integrations)) setIntegrations(updated);
  }

  // Initialize selected models from settings
  useState(() => {
    const initialModels: Record<string, string> = {};
    const initialCustomModels: Record<string, string> = {};
    if (settings) {
      const settingsArray = settings as any[];
      settingsArray.forEach(setting => {
        if (setting.key.startsWith('DEFAULT_MODEL_')) {
          const provider = setting.key.replace('DEFAULT_MODEL_', '').toLowerCase();
          const modelValue = setting.value;

          // Check if it's a predefined model or custom
          const availableModelsForProvider = AVAILABLE_MODELS[provider as keyof typeof AVAILABLE_MODELS] || [];
          const isPredefined = availableModelsForProvider.some(model => model.id === modelValue);

          if (isPredefined) {
            initialModels[provider] = modelValue;
          } else {
            // It's a custom model
            initialModels[provider] = 'custom';
            initialCustomModels[provider] = modelValue;
          }
        }
      });
    }
    setSelectedModels(initialModels);
    setCustomModels(initialCustomModels);
  });

  useEffect(() => {
    if (!settings) {
      setSequentialFlags({});
      return;
    }
    const settingsArray = settings as any[];
    const flags: Record<string, boolean> = {};
    Object.entries(SEQUENTIAL_SETTING_KEYS).forEach(([provider, key]) => {
      const entry = settingsArray.find((setting: any) => setting.key === key);
      if (entry && typeof entry.value === 'string') {
        const normalized = entry.value.toLowerCase();
        flags[provider] = ['true', '1', 'yes', 'on'].includes(normalized);
      }
    });
    setSequentialFlags(flags);
  }, [settings]);

  const toggleKeyVisibility = (key: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(key)) {
      newVisible.delete(key);
    } else {
      newVisible.add(key);
    }
    setVisibleKeys(newVisible);
  };

  const handleSaveIntegration = async (integrationKey: string, values: Record<string, string>) => {
    setSavingIntegrations(prev => new Set(prev).add(integrationKey));

    try {
      const integ = integrations.find(i => i.key === integrationKey);
      if (!integ) {
        throw new Error("Integration not found");
      }

      // First, test the connection to validate the API key
      toast.info("Validando credenciais da API...");

      // Prepare values for testing
      const testValues: Record<string, string> = {};
      for (const field of integ.required_fields) {
        const val = values[field.key];
        if (typeof val === 'string' && val.trim().length > 0) {
          testValues[field.key] = val.trim();
        } else if (configuredMap[field.key]) {
          testValues[field.key] = configuredMap[field.key];
        }
      }

      const testResponse = await fetch(`${API_BASE_URL}/settings/integrations/test-connection-with-values?integration=${integrationKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testValues),
      });

      if (!testResponse.ok) {
        const error = await testResponse.json();
        throw new Error(`Validação da API falhou: ${error.detail || 'Conexão falhou'}`);
      }

      const testResult = await testResponse.json();
      if (testResult.status !== 'success') {
        throw new Error("As credenciais da API são inválidas ou a conexão falhou");
      }

      // If test passed, save the settings
      toast.info("Salvando configurações...");

      for (const field of integ.required_fields) {
        const val = values[field.key];
        if (typeof val === 'string' && val.trim().length > 0) {
          await apiClient.updateSetting(field.key, val.trim());
        }
      }

      const sequentialSettingKey = SEQUENTIAL_SETTING_KEYS[integrationKey];
      if (sequentialSettingKey) {
        const flagValue = (sequentialFlags[integrationKey] ?? false) ? 'true' : 'false';
        await apiClient.updateSetting(sequentialSettingKey, flagValue);
      }

      // Save default model if selected
      const selectedModel = selectedModels[integrationKey];
      if (selectedModel) {
        // If it's a custom model, save the custom value, otherwise save the selected model
        const modelToSave = selectedModel === 'custom' ? customModels[integrationKey] : selectedModel;
        if (modelToSave) {
          await apiClient.updateSetting(`DEFAULT_MODEL_${integrationKey.toUpperCase()}`, modelToSave);

          // Update all existing projects to use this model provider and model
          try {
            const projects = await apiClient.getProjects();
            if (Array.isArray(projects)) {
              for (const project of projects) {
                const updateData: any = {
                  model_provider: integrationKey,
                  model_name: modelToSave
                };
                await apiClient.updateProject((project as any).id, updateData);
              }
              console.log(`Updated ${projects.length} projects to use ${integrationKey} with model ${modelToSave}`);
            }
          } catch (error) {
            console.warn('Failed to update existing projects:', error);
            // Don't fail the whole operation if project updates fail
          }
        }
      }

      // Update integration status
      setIntegrations(prev => prev.map(integration =>
        integration.key === integrationKey
          ? { ...integration, is_configured: true }
          : integration
      ));

      // Set test result as success since we just validated it
      setTestResults(prev => ({ ...prev, [integrationKey]: 'success' }));

      toast.success(`${integ.name} foi configurado e validado com sucesso. Todos os projetos foram atualizados para usar este provedor.`);

      // Clear success status after 3 seconds
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [integrationKey]: null }));
      }, 3000);

    } catch (error: any) {
      toast.error(error.message || "Falha ao configurar integração. Verifique suas credenciais da API.");

      // Set test result as error
      setTestResults(prev => ({ ...prev, [integrationKey]: 'error' }));

      // Clear error status after 5 seconds
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [integrationKey]: null }));
      }, 5000);
    } finally {
      setSavingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(integrationKey);
        return newSet;
      });
    }
  };

  const handleDisconnectIntegration = async (integrationKey: string) => {
    try {
      const integ = integrations.find(i => i.key === integrationKey);
      if (!integ) {
        throw new Error("Integration not found");
      }

      // Remove all settings for this integration
      for (const field of integ.required_fields) {
        try {
          await apiClient.settings.delete(field.key);
        } catch (error) {
          // Continue even if some settings fail to delete
          console.warn(`Failed to delete setting ${field.key}:`, error);
        }
      }

      const sequentialSettingKey = SEQUENTIAL_SETTING_KEYS[integrationKey];
      if (sequentialSettingKey) {
        try {
          await apiClient.settings.delete(sequentialSettingKey);
        } catch (error) {
          console.warn(`Failed to delete setting ${sequentialSettingKey}:`, error);
        }
        setSequentialFlags(prev => {
          const next = { ...prev };
          delete next[integrationKey];
          return next;
        });
      }

      // Update integration status
      setIntegrations(prev => prev.map(integration =>
        integration.key === integrationKey
          ? { ...integration, is_configured: false }
          : integration
      ));

      // Clear form values
      // Note: This would need to be handled per card, but for simplicity we'll just update the status

      toast.success(`${integ.name} foi desconectado com sucesso.`);

    } catch (error: any) {
      toast.error(error.message || "Falha ao desconectar integração.");
    }
  };

  const handleTestConnection = async (integrationKey: string, currentFormValues?: Record<string, string>) => {
    setTestResults(prev => ({ ...prev, [integrationKey]: 'testing' }));

    try {
      // Get current form values for this integration
      const integ = integrations.find(i => i.key === integrationKey);
      if (!integ) {
        throw new Error("Integration not found");
      }

      // Check if we have values to test
      const hasFormValues = currentFormValues && integ.required_fields.some(field =>
        currentFormValues[field.key] && currentFormValues[field.key].trim() !== ''
      );

      if (hasFormValues && currentFormValues) {
        // Test with form values (not yet saved)
        const testValues: Record<string, string> = {};
        for (const field of integ.required_fields) {
          const val = currentFormValues[field.key];
          if (typeof val === 'string' && val.trim().length > 0) {
            testValues[field.key] = val.trim();
          }
        }

        const response = await fetch(`${API_BASE_URL}/settings/integrations/test-connection-with-values?integration=${integrationKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testValues),
        });

        if (response.ok) {
          const result = await response.json();
          setTestResults(prev => ({ ...prev, [integrationKey]: 'success' }));
          toast.success(result.message || "As credenciais da API são válidas e funcionam corretamente.");
        } else {
          const error = await response.json();
          setTestResults(prev => ({ ...prev, [integrationKey]: 'error' }));
          throw new Error(error.detail || 'Teste de conexão falhou');
        }
      } else {
        // Test with saved values
        const response = await fetch(`${API_BASE_URL}/settings/integrations/test-connection?integration=${integrationKey}`, {
          method: 'GET',
        });

        if (response.ok) {
          const result = await response.json();
          setTestResults(prev => ({ ...prev, [integrationKey]: 'success' }));
          toast.success(result.message || "As credenciais da API são válidas e funcionam corretamente.");
        } else {
          const error = await response.json();
          setTestResults(prev => ({ ...prev, [integrationKey]: 'error' }));
          throw new Error(error.detail || 'Teste de conexão falhou');
        }
      }

      // Clear success status after 3 seconds
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [integrationKey]: null }));
      }, 3000);

    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [integrationKey]: 'error' }));
      toast.error(error.message || "Falha ao verificar credenciais da API.");

      // Clear error status after 5 seconds
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [integrationKey]: null }));
      }, 5000);
    }
  };

  const getIntegrationsByCategory = (category: string) => {
    return integrations.filter(integration => integration.category === category);
  };

  const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    llm_providers: Zap,
    search_engines: Search,
    communication: MessageSquare,
    databases: Database,
    development: Code,
    productivity: Key,
    payment: CreditCard,
    cloud_services: Database,
  };

  const categoryLabels: Record<string, string> = {
    llm_providers: 'LLM Providers',
    search_engines: 'Search Engines',
    communication: 'Communication',
    databases: 'Databases',
    development: 'Development',
    productivity: 'Productivity',
    payment: 'Payment',
    cloud_services: 'Cloud Services',
  };

  const IntegrationCard = ({ integration }: { integration: Integration }) => {
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const IconComponent = categoryIcons[integration.category] || Plug;

    // Check if this is an LLM provider that supports model selection
    const isLLMProvider = integration.category === 'llm_providers';
    const availableModels = isLLMProvider ? AVAILABLE_MODELS[integration.key as keyof typeof AVAILABLE_MODELS] || [] : [];
    const sequentialSettingKey = SEQUENTIAL_SETTING_KEYS[integration.key];
    const sequentialEnabled = sequentialSettingKey ? Boolean(sequentialFlags[integration.key]) : false;

    return (
      <Card className="card-notion">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-radius flex items-center justify-center">
                <IconComponent className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">{integration.name}</CardTitle>
                <CardDescription className="text-sm">
                  {integration.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={integration.is_configured ? 'default' : 'secondary'}
                className={
                  integration.is_configured
                    ? testResults[integration.key] === 'success'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : testResults[integration.key] === 'error'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }
              >
                {integration.is_configured ? (
                  testResults[integration.key] === 'success' ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Tested ✓
                    </>
                  ) : testResults[integration.key] === 'error' ? (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Test Failed
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Configured
                    </>
                  )
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Not Configured
                  </>
                )}
              </Badge>
              {integration.documentation_url && (
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={integration.documentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {integration.required_fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.name}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={field.key}
                    type={field.type === 'password' && !visibleKeys.has(field.key) ? 'password' : 'text'}
                    placeholder={(configuredMap[field.key] ? '•••••••• (configured)' : (field.placeholder || `Enter ${field.name.toLowerCase()}`))}
                    value={formValues[field.key] || ''}
                    onChange={(e) => setFormValues(prev => ({
                      ...prev,
                      [field.key]: e.target.value
                    }))}
                    className="input-notion pr-10"
                  />
                  {field.type === 'password' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                      onClick={() => toggleKeyVisibility(field.key)}
                    >
                      {visibleKeys.has(field.key) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}

          {sequentialSettingKey && (
            <div className="flex items-start justify-between rounded-md border border-muted bg-muted/40 px-3 py-3">
              <div className="space-y-1 pr-4">
                <p className="text-sm font-medium">Executar agentes em fila</p>
                <p className="text-xs text-muted-foreground">Evite chamadas simult�neas para reduzir erros de limite em planos gratuitos.</p>
              </div>
              <Switch
                checked={sequentialEnabled}
                onCheckedChange={(checked) => setSequentialFlags(prev => ({ ...prev, [integration.key]: checked }))}
                aria-label="Alternar execu��o sequencial"
              />
            </div>
          )}

          {/* Model Selection for LLM Providers */}
          {isLLMProvider && availableModels.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor={`model-${integration.key}`}>Default Model</Label>
              <Select
                value={selectedModels[integration.key] || ''}
                onValueChange={(value) => {
                  setSelectedModels(prev => ({ ...prev, [integration.key]: value }));
                  // Clear custom model if selecting a predefined one
                  if (value !== 'custom') {
                    setCustomModels(prev => ({ ...prev, [integration.key]: '' }));
                  }
                }}
              >
                <SelectTrigger className="input-notion">
                  <SelectValue placeholder="Select a model..." />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {model.provider}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Custom Model</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Model Input */}
              {selectedModels[integration.key] === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor={`custom-model-${integration.key}`}>Custom Model Name</Label>
                  <Input
                    id={`custom-model-${integration.key}`}
                    type="text"
                    placeholder="Enter model name (e.g., openrouter/gpt-4o, claude-3-opus-20240229)"
                    value={customModels[integration.key] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomModels(prev => ({ ...prev, [integration.key]: value }));
                      // Update selected model with custom value
                      setSelectedModels(prev => ({ ...prev, [integration.key]: value }));
                    }}
                    className="input-notion"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the full model identifier as provided by the API provider
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                This model will be used as default when creating new projects
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleSaveIntegration(integration.key, formValues);
              }}
              disabled={savingIntegrations.has(integration.key)}
              className="btn-primary"
            >
              {savingIntegrations.has(integration.key) ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                handleTestConnection(integration.key, formValues);
              }}
              disabled={testResults[integration.key] === 'testing'}
              className={`${testResults[integration.key] === 'success'
                ? 'border-green-500 text-green-600 hover:bg-green-500/10 dark:hover:bg-green-500/20'
                : testResults[integration.key] === 'error'
                  ? 'border-red-500 text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/20'
                  : ''
                }`}
            >
              {testResults[integration.key] === 'testing' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : testResults[integration.key] === 'success' ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Sucesso
                </>
              ) : testResults[integration.key] === 'error' ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Falhou
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Testar Conexão
                </>
              )}
            </Button>
            {integration.is_configured && (
              <Button
                variant="outline"
                onClick={() => handleDisconnectIntegration(integration.key)}
                className="border-red-500 text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/20"
              >
                <Unplug className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const configuredCount = integrations.filter(i => i.is_configured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title flex items-center gap-3">
            <Plug className="h-7 w-7" />
            Integrations
          </h1>
          <p className="text-muted-foreground">Configure API keys and external service connections</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${(configuredCount / integrations.length) * 100}, 100`}
                  className="text-accent-green"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="100, 100"
                  className="text-muted-foreground/20"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-accent-green">
                  {Math.round((configuredCount / integrations.length) * 100)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Setup Progress</div>
              <div className="text-xs text-muted-foreground">
                {configuredCount} of {integrations.length} configured
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-semibold text-accent-green">{configuredCount}</div>
              <div className="text-muted-foreground">Configured</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-heading">{integrations.length}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-accent-yellow">{integrations.length - configuredCount}</div>
              <div className="text-muted-foreground">Pending</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="llm_providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="llm_providers" className="gap-2">
            <Zap className="h-4 w-4" />
            LLM Providers
          </TabsTrigger>
          <TabsTrigger value="search_engines" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="communication" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Communication
          </TabsTrigger>
          <TabsTrigger value="other" className="gap-2">
            <Database className="h-4 w-4" />
            Other
          </TabsTrigger>
        </TabsList>

        {/* LLM Providers */}
        <TabsContent value="llm_providers" className="space-y-4">
          {getIntegrationsByCategory('llm_providers').map((integration) => (
            <IntegrationCard key={integration.key} integration={integration} />
          ))}
        </TabsContent>

        {/* Search Engines */}
        <TabsContent value="search_engines" className="space-y-4">
          {getIntegrationsByCategory('search_engines').map((integration) => (
            <IntegrationCard key={integration.key} integration={integration} />
          ))}
        </TabsContent>

        {/* Communication */}
        <TabsContent value="communication" className="space-y-4">
          {getIntegrationsByCategory('communication').map((integration) => (
            <IntegrationCard key={integration.key} integration={integration} />
          ))}
        </TabsContent>

        {/* Other Services */}
        <TabsContent value="other" className="space-y-4">
          {[...getIntegrationsByCategory('development'),
          ...getIntegrationsByCategory('productivity'),
          ...getIntegrationsByCategory('payment'),
          ...getIntegrationsByCategory('databases'),
          ...getIntegrationsByCategory('cloud_services')
          ].map((integration) => (
            <IntegrationCard key={integration.key} integration={integration} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
