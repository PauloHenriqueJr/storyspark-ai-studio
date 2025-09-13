import { Search, Bell, User, Menu, PanelLeftOpen, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useCommandPaletteStore } from "@/lib/store";

interface TopbarProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const Topbar = ({ onToggleSidebar, isSidebarCollapsed }: TopbarProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toggleOpen: toggleCommandPalette } = useCommandPaletteStore();

  const handleLogout = () => {
    // Simple logout - redirect to auth page
    navigate('/auth');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
      <div className="flex items-center space-x-4">
        {/* Mobile menu button or sidebar toggle */}
        {isMobile ? (
          <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
            <Menu className="h-4 w-4" />
          </Button>
        ) : (
          isSidebarCollapsed && (
            <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )
        )}

        {/* Search */}
        <div className="flex items-center flex-1 max-w-md">
          <Button
            variant="outline"
            className="justify-start gap-2 w-full max-w-md bg-muted border-0 text-muted-foreground"
            onClick={toggleCommandPalette}
          >
            <Search className="h-4 w-4" />
            <span>Pesquisar projetos, agentes, tasks...</span>
            <div className="ml-auto flex gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            3
          </Badge>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback>SS</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">StorySpark User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  usuario@storyspark.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem>
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              Ajuda
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};