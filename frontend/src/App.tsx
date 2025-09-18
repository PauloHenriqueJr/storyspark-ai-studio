import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/app-shell/app-shell";

// Import pages
import Dashboard from "./pages/Dashboard";
import VisualEditor from "./pages/VisualEditor";
import Projects from "./pages/Projects";
import Agents from "./pages/Agents";
import Tasks from "./pages/Tasks";
import Run from "./pages/Run";
import Executions from "./pages/Executions";
import Import from "./pages/Import";
import Export from "./pages/Export";
import Library from "./pages/Library";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/app/*" element={
            <AppShell>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="editor" element={<VisualEditor />} />
                <Route path="projects" element={<Projects />} />
                <Route path="agents" element={<Agents />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="run" element={<Run />} />
                <Route path="executions" element={<Executions />} />
                <Route path="import" element={<Import />} />
                <Route path="export" element={<Export />} />
                <Route path="library" element={<Library />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppShell>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
