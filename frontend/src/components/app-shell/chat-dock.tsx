'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChatDockStore } from '@/lib/store';
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
  'Criar um sistema de atendimento ao cliente',
  'Gerar um agente de análise de dados',
  'Criar tarefas para produção de conteúdo',
  'Desenvolver um workflow de marketing',
  'Criar agentes para análise de redes sociais',
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
    } catch { }
    try {
      // Fallback: get first project from API
      const res: any = await (await fetch(`${(window as any).VITE_API_BASE_URL || import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000'}/projects`)).json();
      if (Array.isArray(res) && res.length > 0 && res[0].id) return Number(res[0].id);
    } catch { }
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
        addMessage({
          id: `msg-${Date.now()}-creating`,
          type: 'assistant',
          content: `🔄 Analisando sua solicitação: "${messageText}"\n\n⏳ Criando workflow personalizado...`,
          timestamp: new Date().toISOString(),
        });

        const res: any = await apiClient.builder.generate(projectIdNum, messageText);

        // Add progress messages
        addMessage({
          id: `msg-${Date.now()}-progress`,
          type: 'assistant',
          content: `✅ Análise concluída!\n\n📋 Workflow identificado: ${res?.plan ? 'Plano detalhado gerado' : 'Workflow básico criado'}\n\n🤖 Criando agentes especializados...`,
          timestamp: new Date().toISOString(),
        });

        // Simulate agent creation progress
        if (res?.created_agents > 0) {
          setTimeout(() => {
            addMessage({
              id: `msg-${Date.now()}-agents`,
              type: 'assistant',
              content: `🎯 ${res.created_agents} agente${res.created_agents > 1 ? 's' : ''} criado${res.created_agents > 1 ? 's' : ''} com sucesso!\n\n📝 Agora configurando tarefas automatizadas...`,
              timestamp: new Date().toISOString(),
            });
          }, 1000);
        }

        // Simulate task creation progress
        if (res?.created_tasks > 0) {
          setTimeout(() => {
            addMessage({
              id: `msg-${Date.now()}-tasks`,
              type: 'assistant',
              content: `⚙️ ${res.created_tasks} tarefa${res.created_tasks > 1 ? 's' : ''} configurada${res.created_tasks > 1 ? 's' : ''}!\n\n🔗 Conectando agentes às tarefas...`,
              timestamp: new Date().toISOString(),
            });
          }, 2000);
        }

        // Remove markdown formatting from plan
        const cleanPlan = (res?.plan || 'Plano gerado.')
          .replace(/\*\*/g, '')
          .replace(/##/g, '')
          .replace(/###/g, '')
          .replace(/🎯|📊|🤖|📋|✅/g, '');

        // Final success message
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}-ai`,
            type: 'assistant',
            content: `🎉 Workflow criado com sucesso!\n\n📊 **Resumo da Automação:**
• ${res?.created_agents || 0} Agente${(res?.created_agents || 0) > 1 ? 's' : ''} Especializado${(res?.created_agents || 0) > 1 ? 's' : ''}
• ${res?.created_tasks || 0} Tarefa${(res?.created_tasks || 0) > 1 ? 's' : ''} Automatizada${(res?.created_tasks || 0) > 1 ? 's' : ''}

${cleanPlan ? `\n📝 **Plano de Execução:**\n${cleanPlan}` : ''}

🚀 **Pronto para executar!** Clique no botão "Run" no editor visual ou diga "executar workflow" aqui.`,
            timestamp: new Date().toISOString(),
            suggestions: [
              'Executar workflow agora',
              'Adicionar mais uma tarefa',
              'Editar agentes criados',
              'Testar validação do fluxo',
            ],
          };
          addMessage(assistantMessage);

          // Auto-execute workflow after 5 seconds if user said "executar" or similar
          const shouldAutoExecute = messageText.toLowerCase().includes('executar') ||
            messageText.toLowerCase().includes('run') ||
            messageText.toLowerCase().includes('execute') ||
            messageText.toLowerCase().includes('rodar');

          if (shouldAutoExecute) {
            setTimeout(() => {
              addMessage({
                id: `msg-${Date.now()}-auto-exec`,
                type: 'assistant',
                content: `🚀 Iniciando execução automática do workflow criado...`,
                timestamp: new Date().toISOString(),
              });

              // Trigger workflow execution via custom event (only once)
              setTimeout(() => {
                console.log('Dispatching executeWorkflow event for project:', projectIdNum);
                window.dispatchEvent(new CustomEvent('executeWorkflow', { 
                  detail: { projectId: projectIdNum } 
                }));
              }, 3000); // Increased delay to ensure workflow is fully created
            }, 3000); // Increased delay to ensure all creation messages are shown
          }
        }, 3000);

        // Refresh editor data so nodes appear
        await queryClient.invalidateQueries({ queryKey: queryKeys.agents(String(projectIdNum)) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.tasks(String(projectIdNum)) });

        // Update workflow in store to trigger visual editor update
        setTimeout(() => {
          console.log('Dispatching workflowCreated event:', {
            agents: res?.created_agents || 0,
            tasks: res?.created_tasks || 0,
            projectId: projectIdNum
          });
          
          // Trigger a custom event to notify the visual editor
          window.dispatchEvent(new CustomEvent('workflowCreated', { 
            detail: { 
              agents: res?.created_agents || 0, 
              tasks: res?.created_tasks || 0,
              projectId: projectIdNum 
            } 
          }));
        }, 1000);
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
        try { window.history.pushState({}, '', '/app/projects'); } catch { }
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

  const handleSuggestionClick = async (suggestion: string) => {
    if (suggestion === 'Executar workflow agora') {
      // Trigger workflow execution
      addMessage({
        id: `msg-${Date.now()}-exec-request`,
        type: 'user',
        content: suggestion,
        timestamp: new Date().toISOString(),
      });

      addMessage({
        id: `msg-${Date.now()}-exec-starting`,
        type: 'assistant',
        content: `🚀 Executando workflow...\n\nIniciando agentes e tarefas automatizadas.`,
        timestamp: new Date().toISOString(),
      });

      // Trigger execution via custom event
      const projectId = await getActiveProjectId();
      if (projectId) {
        console.log('Executing workflow for project:', projectId);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('executeWorkflow', { 
            detail: { projectId } 
          }));
        }, 1500); // Increased delay to prevent multiple executions
      } else {
        addMessage({
          id: `msg-${Date.now()}-exec-error`,
          type: 'assistant',
          content: `❌ Não foi possível executar o workflow automaticamente. Verifique se há um projeto selecionado.`,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      setInputValue(suggestion);
    }
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
      <div className="fixed left-4 bottom-20 md:left-6 md:bottom-24 z-50">
        <Button
          data-chat-button
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

  return (
    <div className={cn(
      "fixed z-50 bg-surface border-border flex flex-col",
      "left-0 top-16 bottom-0 w-80 border-r shadow-xl", // Always left sidebar, starts below topbar
      "lg:w-80 xl:w-96" // Desktop widths
    )}>
      {/* Header - Responsive */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-purple rounded-radius flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base">AI Builder</h3>
              <p className="text-xs text-muted-foreground">Crie workflows com linguagem natural</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Visual feedback for editor context */}
        {isInEditor && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium">Editor Visual Ativo</span>
            <span className="text-xs text-muted-foreground ml-auto">
              Digite para criar workflows
            </span>
          </div>
        )}
      </div>

      {/* Messages - Responsive */}
      <ScrollArea className="flex-1 p-3 sm:p-4">
        {messages.length === 0 ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium text-base mb-2">
                O que você gostaria de criar?
              </h4>
              <p className="text-sm text-muted-foreground mb-4 px-2">
                Descreva o workflow que você quer automatizar e eu criarei os agentes e tarefas no editor visual.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-accent-yellow" />
                <span className="text-sm font-medium">Sugestões rápidas:</span>
              </div>
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-3 rounded-radius border border-border hover:bg-muted-hover transition-colors text-sm"
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
            placeholder="Descreva o workflow que você quer criar..."
            className="input-notion flex-1 text-xs sm:text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="btn-primary p-1.5 sm:p-2"
          >
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}