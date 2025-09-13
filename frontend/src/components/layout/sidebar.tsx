import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, LayoutDashboard, FolderOpen, Bot, CheckSquare, 
  Play, BarChart3, Import, Download, Library, Settings, 
  PanelLeftOpen, PanelLeftClose, Palette, ChevronRight,
  Users, Zap, FileText
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  badgeVariant?: 'default' | 'secondary' | 'outline';
  description: string;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/app/dashboard',
    icon: LayoutDashboard,
    badge: null,
    description: 'Visão geral dos projetos'
  },
  {
    title: 'Projetos',
    href: '/app/projects',
    icon: FolderOpen,
    badge: null,
    description: 'Gerencie seus projetos'
  },
  {
    title: 'Agentes',
    href: '/app/agents',
    icon: Bot,
    badge: 'IA',
    badgeVariant: 'secondary',
    description: 'Configure agentes inteligentes'
  },
  {
    title: 'Tarefas',
    href: '/app/tasks',
    icon: CheckSquare,
    badge: null,
    description: 'Gerencie tarefas dos agentes'
  }
];

const toolsItems: NavItem[] = [
  {
    title: 'Executar',
    href: '/app/run',
    icon: Play,
    badge: null,
    description: 'Execute automações'
  },
  {
    title: 'Editor Visual',
    href: '/app/editor',
    icon: Palette,
    badge: 'Beta',
    badgeVariant: 'outline',
    description: 'Editor drag & drop'
  },
  {
    title: 'Execuções',
    href: '/app/executions',
    icon: BarChart3,
    badge: null,
    description: 'Histórico de execuções'
  }
];

const libraryItems: NavItem[] = [
  {
    title: 'Biblioteca',
    href: '/app/library',
    icon: Library,
    badge: null,
    description: 'Templates e recursos'
  },
  {
    title: 'Importar',
    href: '/app/import',
    icon: Import,
    badge: null,
    description: 'Importar projetos'
  },
  {
    title: 'Exportar',
    href: '/app/export',
    icon: Download,
    badge: null,
    description: 'Exportar projetos'
  },
  {
    title: 'Integrações',
    href: '/app/integrations',
    icon: Zap,
    badge: 'Novo',
    badgeVariant: 'default',
    description: 'Conecte ferramentas externas'
  }
];

const SidebarNavGroup = ({ 
  title, 
  items, 
  isCollapsed, 
  currentPath 
}: { 
  title: string; 
  items: NavItem[]; 
  isCollapsed: boolean; 
  currentPath: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(
    items.some(item => currentPath.startsWith(item.href))
  );

  return (
    <div className="space-y-1">
      {!isCollapsed && (
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {title}
          <ChevronRight className={cn(
            "w-3 h-3 transition-transform",
            isExpanded && "rotate-90"
          )} />
        </Button>
      )}
      
      <div className={cn(
        "space-y-1",
        !isCollapsed && !isExpanded && "hidden"
      )}>
        {items.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                "hover:bg-sidebar-active hover:text-sidebar-active-foreground",
                isActive 
                  ? "bg-sidebar-active text-sidebar-active-foreground font-medium" 
                  : "text-sidebar-foreground"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-sm">{item.title}</span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'default'} className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export const Sidebar = ({ isCollapsed, onToggleCollapse, className }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const currentPath = location.pathname;

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border",
      isCollapsed ? "w-14" : "w-60",
      "transition-all duration-200",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">StorySpark</span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg mx-auto">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        
        {!isCollapsed && !isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="flex-shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SidebarNavGroup
          title="Criação"
          items={navItems}
          isCollapsed={isCollapsed}
          currentPath={currentPath}
        />

        <SidebarNavGroup
          title="Ferramentas"
          items={toolsItems}
          isCollapsed={isCollapsed}
          currentPath={currentPath}
        />

        <SidebarNavGroup
          title="Recursos"
          items={libraryItems}
          isCollapsed={isCollapsed}
          currentPath={currentPath}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <NavLink
          to="/app/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full",
            "hover:bg-sidebar-active hover:text-sidebar-active-foreground",
            isActive 
              ? "bg-sidebar-active text-sidebar-active-foreground font-medium" 
              : "text-sidebar-foreground"
          )}
          title={isCollapsed ? "Configurações" : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm">Configurações</span>}
        </NavLink>
      </div>
    </div>
  );
};