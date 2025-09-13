'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/store';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string | number;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/app/dashboard',
  },
  {
    id: 'editor',
    label: 'Visual Editor',
    icon: Workflow,
    href: '/app/editor',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderOpen,
    href: '/app/projects',
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Users,
    href: '/app/agents',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    href: '/app/tasks',
  },
  {
    id: 'run',
    label: 'Run',
    icon: Play,
    href: '/app/run',
  },
  {
    id: 'executions',
    label: 'Executions',
    icon: History,
    href: '/app/executions',
  },
  {
    id: 'import',
    label: 'Import',
    icon: Upload,
    href: '/app/import',
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    href: '/app/export',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Plug,
    href: '/app/integrations',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/app/settings',
  },
];

export function Sidebar() {
  const { isCollapsed, toggleCollapsed } = useSidebarStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col sticky top-0',
        isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
      )}
    >
      {/* Header */}
      <div className="h-topbar border-b border-sidebar-border flex items-center justify-between px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-radius flex items-center justify-center">
              <Workflow className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">
              Crew AI Studio
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="p-2 hover:bg-sidebar-active"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 h-10 px-3 transition-colors',
                'hover:bg-sidebar-active hover:text-sidebar-active-foreground',
                isActive && 'bg-sidebar-active text-sidebar-active-foreground font-medium',
                isCollapsed && 'justify-center px-0'
              )}
              onClick={() => handleNavigation(item.href)}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-accent-purple text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Crew AI Studio</p>
            <p>Self-Hosted v1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  );
}