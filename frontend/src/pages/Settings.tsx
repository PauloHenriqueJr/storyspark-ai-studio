import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon, 
  User, 
  Globe, 
  Bell, 
  Monitor, 
  Save,
  RefreshCw,
  Shield,
  Database,
  Zap
} from 'lucide-react';
import { useThemeStore, useSettingsStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { theme, setTheme } = useThemeStore();
  const { 
    language, 
    setLanguage, 
    executionTimeout, 
    setExecutionTimeout,
    autoSaveInterval,
    setAutoSaveInterval,
    notificationsEnabled,
    setNotificationsEnabled 
  } = useSettingsStore();
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    setLanguage('pt');
    setExecutionTimeout(30);
    setAutoSaveInterval(30);
    setNotificationsEnabled(true);
    
    toast({
      title: "Settings reset",
      description: "All settings have been reset to default values.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title flex items-center gap-3">
            <SettingsIcon className="h-7 w-7" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your application preferences and configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading} className="btn-primary">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="gap-2">
            <User className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Monitor className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="execution" className="gap-2">
            <Zap className="h-4 w-4" />
            Execution
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Shield className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Configure your language preferences and regional settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Interface Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português (PT)</SelectItem>
                      <SelectItem value="en">English (EN)</SelectItem>
                      <SelectItem value="es">Español (ES)</SelectItem>
                      <SelectItem value="fr">Français (FR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="america/sao_paulo">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america/sao_paulo">America/São Paulo (UTC-3)</SelectItem>
                      <SelectItem value="america/new_york">America/New York (UTC-5)</SelectItem>
                      <SelectItem value="europe/london">Europe/London (UTC+0)</SelectItem>
                      <SelectItem value="asia/tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications for executions and system events</p>
                </div>
                <Switch 
                  id="notifications"
                  checked={notificationsEnabled} 
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Execution Completed</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Execution Failed</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>System Updates</Label>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Theme & Display
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="justify-start gap-2"
                  >
                    <div className="w-4 h-4 bg-white border border-border rounded-sm" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="justify-start gap-2"
                  >
                    <div className="w-4 h-4 bg-slate-900 rounded-sm" />
                    Dark
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    disabled
                  >
                    <div className="w-4 h-4 bg-gradient-to-br from-white to-slate-900 rounded-sm" />
                    Auto
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Sidebar Behavior</Label>
                <Select defaultValue="collapsible">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always-open">Always Open</SelectItem>
                    <SelectItem value="collapsible">Collapsible</SelectItem>
                    <SelectItem value="auto-hide">Auto Hide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Settings */}
        <TabsContent value="execution" className="space-y-6">
          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Execution Preferences
              </CardTitle>
              <CardDescription>
                Configure how your AI agents and tasks execute
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Execution Timeout (minutes)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={executionTimeout}
                    onChange={(e) => setExecutionTimeout(Number(e.target.value))}
                    className="input-notion"
                    min={1}
                    max={120}
                  />
                  <p className="text-xs text-muted-foreground">Maximum time before executions are automatically stopped</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="autosave">Auto-save Interval (seconds)</Label>
                  <Input
                    id="autosave"
                    type="number"
                    value={autoSaveInterval}
                    onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                    className="input-notion"
                    min={10}
                    max={300}
                  />
                  <p className="text-xs text-muted-foreground">How often to automatically save changes in the editor</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Verbose Logging</Label>
                    <p className="text-sm text-muted-foreground">Include detailed logs during execution</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Parallel Execution</Label>
                    <p className="text-sm text-muted-foreground">Allow multiple agents to run simultaneously</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-retry Failed Tasks</Label>
                    <p className="text-sm text-muted-foreground">Automatically retry tasks that fail due to temporary errors</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure connection to your CrewAI backend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">API Base URL</Label>
                <Input
                  id="api-url"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="input-notion"
                  placeholder="http://localhost:8000"
                />
                <p className="text-xs text-muted-foreground">Base URL for your CrewAI API server</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={apiBaseUrl ? 'default' : 'destructive'}>
                  {apiBaseUrl ? 'Connected' : 'Disconnected'}
                </Badge>
                <Button variant="outline" size="sm">
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-notion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Manage security settings and data privacy options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Store API Keys Locally</Label>
                    <p className="text-sm text-muted-foreground">Keep integration API keys in browser storage</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics Collection</Label>
                    <p className="text-sm text-muted-foreground">Help improve the app by sharing usage data</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Error Reporting</Label>
                    <p className="text-sm text-muted-foreground">Automatically report errors to help fix issues</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Data Export</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Export Settings
                  </Button>
                  <Button variant="outline" size="sm">
                    Export All Data
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Download your settings and project data</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
