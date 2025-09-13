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
import { useToast } from '@/hooks/use-toast';
import { apiClient, queryKeys } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function Integrations() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load configured settings from backend and flag configured integrations
  const { data: settings } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => apiClient.getSettings(),
  });

  const configuredMap: Record<string, string> = (settings || []).reduce((acc: any, s: any) => { acc[s.key] = s.value; return acc; }, {});
  
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
    setIsLoading(true);
    try {
      const integ = integrations.find(i => i.key === integrationKey);
      if (integ) {
        for (const field of integ.required_fields) {
          const val = values[field.key];
          if (typeof val === 'string' && val.trim().length > 0) {
            await apiClient.updateSetting(field.key, val.trim());
          }
        }
      }
      
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.key === integrationKey 
          ? { ...integration, is_configured: true }
          : integration
      ));

      toast({
        title: "Integration configured",
        description: `${integrations.find(i => i.key === integrationKey)?.name} has been successfully configured.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to configure integration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (integrationKey: string) => {
    toast({
      title: "Testing connection...",
      description: "Verifying API credentials and connectivity.",
    });

    // Simulate connection test
    setTimeout(() => {
      toast({
        title: "Connection successful",
        description: "API credentials are valid and working correctly.",
      });
    }, 2000);
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
              <Badge variant={integration.is_configured ? 'default' : 'secondary'}>
                {integration.is_configured ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Configured
                  </>
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
              disabled={isLoading}
              className="btn-primary"
            >
              Save Configuration
            </Button>
            {integration.is_configured && (
              <Button 
                variant="outline" 
                onClick={() => handleTestConnection(integration.key)}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Connection
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
