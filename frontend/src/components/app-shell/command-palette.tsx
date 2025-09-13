'use client';

import { useEffect, useState } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useCommandPaletteStore } from '@/lib/store';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Workflow,
  FolderOpen,
  Users,
  CheckSquare,
  Play,
  History,
  Upload,
  Download,
  Settings,
  Plug,
  Search,
  Plus,
  FileText,
  Zap
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const { isOpen, setOpen } = useCommandPaletteStore();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setOpen, mounted]);

  const navigateToRoute = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Go to dashboard',
      icon: LayoutDashboard,
      action: () => navigateToRoute('/app/dashboard'),
      keywords: ['home', 'overview'],
    },
    {
      id: 'nav-editor',
      title: 'Visual Editor',
      subtitle: 'Open the visual workflow editor',
      icon: Workflow,
      action: () => navigateToRoute('/app/editor'),
      keywords: ['canvas', 'graph', 'flow'],
    },
    {
      id: 'nav-projects',
      title: 'Projects',
      subtitle: 'Manage your AI projects',
      icon: FolderOpen,
      action: () => navigateToRoute('/app/projects'),
    },
    {
      id: 'nav-agents',
      title: 'Agents',
      subtitle: 'Configure AI agents',
      icon: Users,
      action: () => navigateToRoute('/app/agents'),
    },
    {
      id: 'nav-tasks',
      title: 'Tasks',
      subtitle: 'Manage agent tasks',
      icon: CheckSquare,
      action: () => navigateToRoute('/app/tasks'),
    },
    {
      id: 'nav-run',
      title: 'Run',
      subtitle: 'Execute projects and agents',
      icon: Play,
      action: () => navigateToRoute('/app/run'),
      keywords: ['execute', 'start'],
    },
    {
      id: 'nav-executions',
      title: 'Executions',
      subtitle: 'View execution history and logs',
      icon: History,
      action: () => navigateToRoute('/app/executions'),
      keywords: ['logs', 'history', 'results'],
    },
    {
      id: 'nav-import',
      title: 'Import',
      subtitle: 'Import workflows and data',
      icon: Upload,
      action: () => navigateToRoute('/app/import'),
      keywords: ['upload', 'n8n', 'yaml', 'json'],
    },
    {
      id: 'nav-export',
      title: 'Export',
      subtitle: 'Export projects and workflows',
      icon: Download,
      action: () => navigateToRoute('/app/export'),
      keywords: ['download', 'backup'],
    },
    {
      id: 'nav-integrations',
      title: 'Integrations',
      subtitle: 'Configure API keys and services',
      icon: Plug,
      action: () => navigateToRoute('/app/integrations'),
      keywords: ['api', 'keys', 'services', 'connections'],
    },
    {
      id: 'nav-settings',
      title: 'Settings',
      subtitle: 'Application preferences',
      icon: Settings,
      action: () => navigateToRoute('/app/settings'),
      keywords: ['preferences', 'config'],
    },

    // Quick actions
    {
      id: 'action-new-project',
      title: 'New Project',
      subtitle: 'Create a new AI project',
      icon: Plus,
      action: () => {
        navigateToRoute('/app/projects?create=true');
        // Trigger new project modal via query param
      },
      keywords: ['create', 'add'],
    },
    {
      id: 'action-new-agent',
      title: 'New Agent',
      subtitle: 'Create a new AI agent',
      icon: Users,
      action: () => {
        navigateToRoute('/app/agents?create=true');
        // Trigger new agent modal via query param
      },
      keywords: ['create', 'add'],
    },
    {
      id: 'action-new-task',
      title: 'New Task',
      subtitle: 'Create a new task',
      icon: CheckSquare,
      action: () => {
        navigateToRoute('/app/tasks?create=true');
        // Trigger new task modal via query param
      },
      keywords: ['create', 'add'],
    },

    // Import actions
    {
      id: 'action-import-n8n',
      title: 'Import n8n Workflow',
      subtitle: 'Convert n8n workflow to CrewAI',
      icon: Zap,
      action: () => {
        navigateToRoute('/app/import?tab=n8n');
      },
      keywords: ['n8n', 'workflow', 'convert'],
    },
    {
      id: 'action-import-yaml',
      title: 'Import YAML',
      subtitle: 'Import agents or tasks from YAML',
      icon: FileText,
      action: () => {
        navigateToRoute('/app/import?tab=yaml');
      },
      keywords: ['yaml', 'agents', 'tasks'],
    },
  ];

  if (!mounted) return null;

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands, navigate, or create..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {commands.filter(cmd => cmd.id.startsWith('nav-')).map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                onSelect={command.action}
                className="flex items-center gap-3 px-3 py-3"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{command.title}</span>
                  {command.subtitle && (
                    <span className="text-xs text-muted-foreground">{command.subtitle}</span>
                  )}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="Quick Actions">
          {commands.filter(cmd => cmd.id.startsWith('action-')).map((command) => {
            const Icon = command.icon;
            return (
              <CommandItem
                key={command.id}
                onSelect={command.action}
                className="flex items-center gap-3 px-3 py-3"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{command.title}</span>
                  {command.subtitle && (
                    <span className="text-xs text-muted-foreground">{command.subtitle}</span>
                  )}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}