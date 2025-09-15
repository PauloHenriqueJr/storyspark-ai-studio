'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChatDockStore, useProjectStore } from '@/lib/store';
import { apiClient, queryClient, queryKeys } from '@/lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Bot,
  User,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
const quickSuggestions = [
  'Create a customer support project',
  'Add a data analysis agent',
  'Generate tasks for content creation',
  'Import n8n workflow',
  'Connect nodes in visual editor',
];

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export function ChatDock() {
  const { isOpen, setOpen, messages, addMessage, clearMessages } = useChatDockStore();
  const { currentProject } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Only show chat in editor page
  const isInEditor = location.pathname === '/app/editor';

  const getActiveProjectId = async (): Promise<number | null> => {
    try {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get('projectId');
      if (fromUrl) return Number(fromUrl);
    } catch {}
    try {
      if (currentProject?.id) return Number(currentProject.id);
    } catch {}
    try {
      // Fallback: get first project from API
      const res: any = await (await fetch(`${(window as any).VITE_API_BASE_URL || import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000'}/projects`)).json();
      if (Array.isArray(res) && res.length > 0 && res[0].id) return Number(res[0].id);
    } catch {}
    return null;
  };

  const handleSendMessage = async (overrideInput?: string) => {
    const messageText = String(overrideInput || inputValue || '');
    if (!messageText || !messageText.trim()) return;

    // If not in editor, navigate to editor with the prompt
    if (!isInEditor) {
      const projectId = await getActiveProjectId();
      if (projectId) {
        // Store prompt in session storage to process after navigation
        sessionStorage.setItem('pendingPrompt', messageText);
        navigate(`/app/editor?projectId=${projectId}`);
      } else {
        navigate('/app/projects');
      }
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    if (!overrideInput) {
      setInputValue('');
    }
    setIsLoading(true);

    // Call AI Builder
    try {
      const projectIdNum = await getActiveProjectId();

      if (projectIdNum) {
        // Check if similar flow exists
        try {
          const similarCheck: any = await apiClient.builder.findSimilar(projectIdNum, messageText);
          
          if (similarCheck?.found) {
            // Flow already exists, just notify and refresh
            const assistantMessage: ChatMessage = {
              id: `msg-${Date.now()}-ai`,
              type: 'assistant',
              content: similarCheck.message + `\n\nAgentes: ${similarCheck.agents_count}\nTarefas: ${similarCheck.tasks_count}\n\nO fluxo já está carregado no editor. Clique em Run para executar!`,
              timestamp: new Date().toISOString(),
              suggestions: [
                'Executar workflow agora',
                'Adicionar mais tarefas',
                'Modificar agentes',
              ],
            };
            addMessage(assistantMessage);
            
            // Just refresh the editor
            await queryClient.invalidateQueries({ queryKey: queryKeys.agents(String(projectIdNum)) });
            await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(String(projectIdNum)) });
            setIsLoading(false);
            return;
          }
        } catch (e) {
          // Continue to create new flow if check fails
        }
        
        // Create new flow
        const res: any = await apiClient.builder.generate(projectIdNum, messageText);

        // Remove markdown formatting from plan
        const cleanPlan = (res?.plan || 'Plano gerado.')
          .replace(/\*\*/g, '')
          .replace(/##/g, '')
          .replace(/###/g, '')
          .replace(/🎯|📊|🤖|📋|✅/g, '');
        
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          type: 'assistant',
          content: `Fluxo criado para o projeto ${projectIdNum}.\n\n${cleanPlan}\n\nAgentes criados: ${res?.created_agents || 0}\nTarefas criadas: ${res?.created_tasks || 0}`,
          timestamp: new Date().toISOString(),
          suggestions: [
            'Executar workflow agora',
            'Adicionar mais uma tarefa',
            'Editar agente criado',
          ],
        };
        addMessage(assistantMessage);

        // Refresh editor data so nodes appear
        await queryClient.invalidateQueries({ queryKey: queryKeys.agents(String(projectIdNum)) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(String(projectIdNum)) });
        
        // Force page reload if we're already in the editor to ensure nodes appear
        if (window.location.pathname === '/app/editor') {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        // Fallback: ask user to create/select a project
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          type: 'assistant',
          content: `Não encontrei nenhum projeto. Vá até Projetos e crie um projeto para continuarmos.`,
          timestamp: new Date().toISOString(),
          suggestions: [
            'Abrir Projetos',
          ],
        };
        addMessage(assistantMessage);
        try { window.history.pushState({}, '', '/app/projects'); } catch {}
      }
    } catch (e: any) {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        type: 'assistant',
        content: `Não consegui criar o fluxo automaticamente: ${e?.message || 'erro desconhecido'}`,
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Process pending prompt after navigation
  useEffect(() => {
    if (isInEditor) {
      const pendingPrompt = sessionStorage.getItem('pendingPrompt');
      if (pendingPrompt) {
        sessionStorage.removeItem('pendingPrompt');
        setOpen(true);
        setTimeout(() => {
          setInputValue(pendingPrompt);
          // Call without parameter since inputValue will be set
          handleSendMessage();
        }, 500);
      }
    }
  }, [isInEditor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show button in all pages, but navigate to editor when clicked - Responsive
  if (!isOpen) {
    return (
      <div className="fixed left-3 bottom-3 md:left-4 md:bottom-4 z-50">
        <Button
          onClick={async () => {
            if (!isInEditor) {
              const pid = await getActiveProjectId();
              if (pid) {
                navigate(`/app/editor?projectId=${pid}`);
                setTimeout(() => setOpen(true), 500);
              } else {
                navigate('/app/projects');
              }
            } else {
              setOpen(true);
            }
          }}
          className="btn-primary gap-1.5 md:gap-2 shadow-lg animate-pulse-glow text-xs md:text-sm px-3 py-2 md:px-4 md:py-2.5"
          size="lg"
        >
          <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">{isInEditor ? 'AI Builder' : 'Build with AI'}</span>
          <span className="sm:hidden">AI</span>
        </Button>
      </div>
    );
  }
  
  // Only show chat dock in editor
  if (!isInEditor) {
    return null;
  }

  return (
    <div className={cn(
      "fixed z-40 bg-surface border-border flex flex-col",
      "left-0 right-0 bottom-0 h-[70vh] border-t rounded-t-2xl", // Mobile: bottom sheet
      "sm:left-0 sm:right-auto sm:top-topbar sm:bottom-0 sm:h-auto sm:w-72 sm:border-r sm:border-t-0 sm:rounded-none", // Tablet
      "lg:w-80 xl:w-96" // Desktop
    )}>
      {/* Header - Responsive */}
      <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent-purple rounded-radius flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base">AI Builder</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Create with natural language</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          className="h-7 w-7 sm:h-8 sm:w-8"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* Messages - Responsive */}
      <ScrollArea className="flex-1 p-3 sm:p-4">
        {messages.length === 0 ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center py-6 sm:py-8">
              <Bot className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h4 className="font-medium text-sm sm:text-base mb-2">
                What would you like to build?
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 px-4">
                Describe what you want to automate and I'll help you create the perfect workflow.
              </p>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-yellow" />
                <span className="text-xs sm:text-sm font-medium">Quick suggestions:</span>
              </div>
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-2.5 sm:p-3 rounded-radius border border-border hover:bg-muted-hover transition-colors text-xs sm:text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2 sm:gap-3',
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'assistant' && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-accent-purple rounded-radius flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                )}
                
                <div
                  className={cn(
                    'max-w-[75%] sm:max-w-[70%] rounded-radius-lg p-2.5 sm:p-3 space-y-1.5 sm:space-y-2',
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.suggestions && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1.5 sm:pt-2">
                      {message.suggestions.map((suggestion, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary-hover text-[10px] sm:text-xs py-0.5 px-2"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-secondary rounded-radius flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-accent-purple rounded-radius flex items-center justify-center">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="bg-muted rounded-radius-lg p-2.5 sm:p-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input - Responsive */}
      <div className="p-3 sm:p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to build..."
            className="input-notion flex-1 text-xs sm:text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn-primary p-1.5 sm:p-2"
          >
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}