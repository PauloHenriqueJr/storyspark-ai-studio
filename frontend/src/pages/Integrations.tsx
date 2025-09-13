import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  RefreshCw
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

export default function Integrations() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing' | null>>({});
  const [savingIntegrations, setSavingIntegrations] = useState<Set<string>>(new Set());

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

      // Update integration status
      setIntegrations(prev => prev.map(integration =>
        integration.key === integrationKey
          ? { ...integration, is_configured: true }
          : integration
      ));

      // Set test result as success since we just validated it
      setTestResults(prev => ({ ...prev, [integrationKey]: 'success' }));

      toast.success(`${integ.name} foi configurado e validado com sucesso.`);

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

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => handleSaveIntegration(integration.key, formValues)}
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
              onClick={() => handleTestConnection(integration.key, formValues)}
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
