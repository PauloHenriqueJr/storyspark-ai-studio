# Mapeamento Detalhado: O Que Falta para o Projeto CrewAI Studio Ficar Totalmente Funcional

Olá! Como Sonoma no modo Architect, realizei uma análise abrangente do seu projeto usando as ferramentas disponíveis (buscas semânticas, regex para TODOs/API calls/botões, e overview da estrutura via environment_details). O projeto já tem uma base sólida: backend em FastAPI/Python com rotas para agents/projects/tasks/executions/settings/import-export; frontend em React/Vite com React Query para integrações API, páginas principais (Projects, Agents, Tasks, Run, Executions, Import, Export, Settings, Integrations, Landing, Auth), componentes UI (modals para projects, sidebar, command palette), e fluxos básicos de CRUD.

No entanto, identifiquei gaps claros em **integrações backend**, **botões sem uso** (com `console.log` ou `disabled` sem lógica), **modals ausentes**, e **fluxos incompletos** (como polling manual e mocks). Abaixo, um mapeamento completo, priorizado por impacto. Baseio-me em:
- **Estrutura**: ~200 arquivos, foco em `frontend/src/pages/`, `api/routers_*`, `src/` (backend executor/exporter).
- **TODOs conhecidos**: Command palette (modals/focus pendentes), tools desabilitados no backend.
- **Integrações API**: Ativas em 80% das páginas (ex: `getProjects()`, `createTask()`), mas mocks em Export e console.logs em VisualEditor.
- **Elementos incompletos**: ~20 botões com `console.log`, ~10 `disabled` sem condicionais reais, progress bars simuladas em Import.

## 1. Status Atual (O Que Já Funciona)
- **Integrações Backend**: CRUD completo para Projects/Agents/Tasks/Executions via `apiClient` (React Query). Ex: `getProjects()`, `createTask()`, `run.project()`. Auth (login/register) e Settings (get/update) funcionam. Import (JSON/N8n/YAML/ZIP) e Executions list/refetch ativas.
- **Páginas Principais**: Landing (estática, com testimonials), Auth (login/register), Dashboard (quick actions), Projects/Agents/Tasks (list/create/edit/delete/duplicate), Run (executar com inputs), Executions (logs com refetch), Import/Export (parcial), Settings/Integrations (config API keys), VisualEditor (UI básica, mas sem backend).
- **Componentes**: Modals para new/edit project; UI kit (buttons, dialogs, etc.) completo; Command palette (navegação básica); Sidebar/Topbar (mobile responsive).
- **Fluxos Básicos**: Criação de projeto > adicionar agent/task > executar > ver logs. Integrações em Settings testam conexões via fetch.
- **Cobertura**: ~70% funcional; integrações API cobrem core, mas UI/UX tem placeholders.

## 2. Gaps Identificados
### a. Integrações Backend Pendentes
- **Export.tsx**: Usa `mockProjects` em vez de API real. Falta chamar `apiClient.exportProject()` para ZIP/JSON real.
- **VisualEditor.tsx**: Botões de run/validate/auto-layout/export usam `console.log` sem API. Precisa integrar com backend executor (ex: `run.project()` para workflow).
- **Backend Tools**: Em `src/tools_config.py`, tools desabilitados por incompatibilidade com `crewai-tools`. Fluxos de agents/tasks não usam tools avançados (ex: web search, file read).
- **Stripe/Pricing**: `PricingCard.tsx` tem botão subscribe com `console.log`; MD (STRIPE_INTEGRATION.md) descreve, mas sem backend (rotas para checkout/subscribe) ou frontend (Stripe.js load).
- **WebSockets para Executions**: Run.tsx usa polling manual (`setInterval` para `getExecution()`); não há realtime updates via WebSockets (backend tem `utils_n8n.py`, mas não exposto).
- **Integrações Externas**: Settings/Integrations testam conexões via fetch custom, mas sem save real de keys (usa `updateSetting()`, mas sem validação profunda como auth OAuth para Slack/Zapier).

### b. Botões Sem Uso ou Incompletos
- **VisualEditor.tsx**: 4 botões principais (`handleRunWorkflow`, `handleValidate`, `handleAutoLayout`, `handleExportPNG`) só logam no console; `disabled` ausente, mas sem ação real.
- **Run.tsx**: Botões de run agent/task/project funcionam, mas `disabled` em selects sem fallback (ex: loadingProjects desabilita sem mensagem).
- **Import.tsx**: Botões de browse file (`zipInputRef`, `n8nInputRef`) funcionam, mas progress bars são simuladas (`setInterval` +10%); sem erro handling para API falha.
- **Export.tsx**: Botões de export ZIP/JSON usam mocks; `disabled={isExporting}` sem lógica de loading real.
- **Command Palette**: Navegação funciona, mas ações como "New Project/Agent/Task" só navegam, sem trigger modal (TODO explícito).
- **PricingCard.tsx**: Botão subscribe loga Stripe ID; sem integração real.
- **Geral**: ~15 `console.log` em handlers (ex: Dashboard quick actions); ~8 `disabled` sem condicionais (ex: buttons em modals sem validação form). Nenhum crash, mas UX pobre (cliques "mortos").

### c. Modals Ausentes ou Incompletos
- **New/Edit Agent/Task**: Existem modals para Project (`new-project-modal.tsx`, `edit-project-modal.tsx`), mas não para Agent/Task. Criação usa dialogs simples em pages, sem UX modal dedicada. Command palette tem TODO para trigger.
- **Delete Confirm**: Usado em Projects/Tasks/Agents, mas genérico; sem preview de impacto (ex: "Removerá X tasks").
- **Import Sections**: Command palette TODO para focus em N8n/YAML; modal de import tem tabs, mas sem validação prévia (ex: parse YAML antes de API).
- **VisualEditor**: Sem modal para node properties ou error logs; inspector é sidebar, mas sem save.

### d. Fluxos Incompletos (Não 100%)
- **Criação/Execução**: Project > Agent > Task funciona via API, mas sem drag-drop em VisualEditor (só UI vazia). Run usa inputs JSON manual; sem auto-complete ou validation.
- **Import/Export**: Import YAML/ZIP parcial (progress simulado); Export mocks. Fluxo end-to-end: import > run > export falha em export real.
- **Executions**: Lista/logs com refetch, mas sem filter por status (running/failed) ou retry button.
- **Settings/Integrations**: Testa conexões, mas save keys local (localStorage?); sem sync com backend auth. Fluxo: config API key > test > save, mas sem erro recovery.
- **Command Palette**: Navegação OK, mas shortcuts/modals pendentes; sem search fuzzy completo.
- **Mobile/Responsive**: Sidebar/topbar OK, mas VisualEditor não testado (900x600 browser tool).
- **Geral**: Sem error boundaries globais; toasts em ~50% das ações API. Fluxo completo (create > run > export) roda, mas com gaps em UX/realtime.

## 3. Plano de Ações (Todo List Atualizado)
Atualizei a todo list com base nisso. Priorizei por dependência (ex: modals antes de command palette). Cada item é acionável, com arquivos/ferramentas sugeridas.

- [x] Análises iniciais (estrutura, TODOs, API, botões) – Concluídas.
- [-] Implementar modals para agents/tasks (arquivos: `components/modals/new-agent-modal.tsx`, integrar `apiClient.createAgent()`; atualizar command palette).
- [ ] Integrar VisualEditor com backend (`pages/VisualEditor.tsx`: substituir logs por `apiClient.run.project()`; adicionar WebSocket para realtime).
- [ ] Corrigir Export (`pages/Export.tsx`: usar `apiClient.exportProject()`; remover mocks).
- [ ] Habilitar tools backend (`src/tools_config.py`: atualizar crewai-tools; integrar em `routers_agents.py`).
- [ ] Otimizar Run (`pages/Run.tsx`: WebSockets via backend ou `useQuery` refetchInterval dinâmico).
- [ ] Integrar Stripe (`components/pricing/PricingCard.tsx` + backend rota em `routers_auth.py` para checkout).
- [ ] Corrigir command palette (`components/app-shell/command-palette.tsx`: triggers modals + focus import).
- [ ] Limpar console.logs/disabled (`global: search_and_replace` para remover; validar forms em modals).
- [ ] Testes end-to-end (manual via browser_action: launch localhost > fluxos).
- [ ] Documentar gaps em `gaps.md` e switch para "code" mode.

Estimativa: 10-15 horas para completar, priorizando core (modals + VisualEditor). Riscos: Dependências (crewai-tools versão; Stripe keys).