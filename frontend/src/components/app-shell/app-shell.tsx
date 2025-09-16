import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "./topbar";
import { ChatDock } from "./chat-dock";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isInEditor = location.pathname === '/app/editor';

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth';
      }
    } catch {}
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isMobile ? false : isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={cn(
          isMobile && "hidden" // Hide on mobile, will use drawer later
        )}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <main className={cn(
          "flex-1 overflow-auto",
          isInEditor ? "p-0" : "p-6" // Remove padding in editor to allow full canvas
        )}>
          {children}
        </main>
        <ChatDock />
      </div>
    </div>
  );
};
