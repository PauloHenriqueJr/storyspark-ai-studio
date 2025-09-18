# Documento de Requisitos do Produto (PRD) - StorySpark AI Studio

## 1. Introdução

### 1.1 Propósito
Este Documento de Requisitos do Produto (PRD) descreve os requisitos completos para o desenvolvimento da aplicação StorySpark AI Studio, uma plataforma web para criação, gerenciamento e execução de workflows de agentes de IA baseados no framework CrewAI. O objetivo é fornecer uma especificação detalhada e auto-contida, permitindo que qualquer equipe de desenvolvimento ou IA recree a aplicação do zero, incluindo frontend e backend, sem perda de funcionalidades essenciais.

O PRD cobre visão geral, requisitos funcionais e não funcionais, arquitetura técnica, fluxos de usuário e considerações de implementação. A aplicação é inspirada em ferramentas como app.crewai.com, mas com foco em uma interface moderna, visual editor drag-and-drop e integração com LLMs via OpenRouter e Google Gemini.

### 1.2 Escopo
- **Inclui**: CRUD de projetos, agentes e tarefas; editor visual com React Flow; execução de workflows CrewAI; histórico de execuções; import/export em YAML/JSON/ZIP; autenticação básica; integração com billing (Stripe); suporte a múltiplos idiomas (PT-BR, EN, ES, FR).
- **Exclui**: Recursos enterprise como multi-tenancy, SSO ou agendamento (ver Roadmap para extensões).
- **Versão**: Baseada na implementação atual (v1.0.0), com funcionalidades MVP completas.

### 1.3 Definições e Acrônimos
- **CrewAI**: Framework Python para orquestração de agentes de IA.
- **LLM**: Large Language Model (ex: GPT-4o-mini via OpenRouter).
- **API REST**: Interface backend com FastAPI.
- **UI/UX**: Interface de Usuário/Experiência do Usuário, baseada em shadcn/ui e Tailwind CSS.

## 2. Visão Geral do Produto

### 2.1 Descrição
StorySpark AI Studio é uma plataforma SaaS para desenvolvedores e equipes de IA criarem workflows colaborativos de agentes autônomos. Os usuários definem projetos com agentes (com roles, goals, tools) e tarefas (descrições, outputs esperados), visualizam fluxos em um editor gráfico, executam em tempo real e acompanham resultados via logs e histórico.

Diferenciais:
- Editor visual drag-and-drop com animações e validação de conexões.
- AI Builder: Chat integrado para gerar workflows via prompts naturais.
- Execução sequencial com suporte a tools (Serper para busca web, FileRead).
- Exportação para ZIP/YAML para portabilidade.
- Design responsivo e moderno, com suporte a temas claro/escuro.

### 2.2 Objetivos de Negócio
- Democratizar o uso de CrewAI com uma interface intuitiva.
- Suportar 100+ execuções simultâneas em produção.
- Monetização via Stripe (planos free/pro).
- Expansão para templates e integrações (N8N, Redis).

### 2.3 Público-Alvo
- **Primário**: Desenvolvedores de IA, PMs e analistas que precisam prototipar workflows sem código puro.
- **Secundário**: Empresas de automação, agências de conteúdo (ex: geração de histórias/relatórios).
- **Persona Exemplo**: João, dev full-stack, 30 anos, usa Python/JS; precisa criar agentes para suporte ao cliente sem configurar ambientes locais.

## 3. Requisitos Funcionais

### 3.1 Gerenciamento de Projetos (CRUD)
- **Listar Projetos**: GET /projects - Retorna lista com nome, descrição, provider (openrouter/gemini), model, linguagem, contagens (agentes/tasks/execuções), data última execução.
- **Criar Projeto**: POST /projects - Campos: name (obrigatório, único), description, model_provider, model_name (default: openrouter/gpt-4o-mini), language (pt-br default).
- **Ler Projeto**: GET /projects/{id} - Detalhes completos.
- **Atualizar Projeto**: PUT /projects/{id} - Campos opcionais para edição.
- **Deletar Projeto**: DELETE /projects/{id} - Remove projeto e dependentes (agentes/tasks/execuções).
- **Validações**: Nome único; model_provider válido; language em {pt, pt-br, en, es, fr}.

### 3.2 Gerenciamento de Agentes
- **Listar Agentes por Projeto**: GET /projects/{id}/agents - Lista com name, role, goal, backstory, tools, verbose, memory, allow_delegation.
- **Criar Agente**: POST /projects/{id}/agents - Campos: name, role, goal, backstory (opcional), tools (lista strings, ex: ['serper', 'file_read']), verbose (true default), memory (false), allow_delegation (false).
- **Atualizar Agente**: PUT /agents/{id} - Campos opcionais.
- **Deletar Agente**: DELETE /agents/{id} - Remove agente e tarefas associadas.
- **Validações**: Campos obrigatórios (name/role/goal); tools válidos de config.

### 3.3 Gerenciamento de Tarefas
- **Listar Tarefas por Projeto**: GET /projects/{id}/tasks - Lista com description, expected_output, tools, async_execution, output_file, agent_id.
- **Criar Tarefa**: POST /projects/{id}/tasks - Campos: agent_id (obrigatório), description, expected_output (opcional), tools (lista), async_execution (false default), output_file (vazio).
- **Atualizar Tarefa**: PUT /tasks/{id} - Campos opcionais, incluindo mudança de agent_id.
- **Deletar Tarefa**: DELETE /tasks/{id}.
- **Validações**: agent_id existe no projeto; description não vazia.

### 3.4 Editor Visual
- **Componente Principal**: React Flow com nós custom (AgentNode, TaskNode) e edges animados.
- **Funcionalidades**:
  - Carregar grafo de projeto (agentes como nós azuis, tarefas como verdes, edges agent->task).
  - Drag-and-drop para conectar (validação: só agent->task ou task->agent).
  - Auto-layout (TB/LR) com Dagre.
  - Seleção múltipla (Ctrl+click), zoom/fit-view.
  - Inspetor lateral: Editar propriedades do nó selecionado (salva via API).
  - Limpar editor: Deleta todos nós e persiste no backend.
  - Animações: Entrada suave, pulse em criação/execução.
- **Estados**: Idle, running (destaque vermelho), completed (verde), failed (vermelho).
- **Integração Chat**: Eventos custom (workflowCreated, executeWorkflow) para sincronizar com AI Builder.

### 3.5 Execução de Workflows
- **Executar Projeto**: POST /execute/project/{id} - Payload: {inputs: {}, language: 'pt'}. Retorna Execution {id, status, input_payload, output_payload, logs}.
- **Executar Agente/Tarefa Isolada**: POST /execute/agent/{id}, POST /execute/task/{id}.
- **Polling Execução**: GET /executions/{id} - Status: pending/running/completed/error/failed. Logs em tempo real.
- **Backend**: Usa CrewAI (Process.sequential), LLM configurado, tools (Serper, FileRead). Captura stdout para logs.
- **Inputs**: Formata description com variáveis (ex: {topic}).
- **Idioma**: Injeta instrução de linguagem em goal/expected_output.
- **Background**: Execução assíncrona com updates incrementais no DB.

### 3.6 Histórico de Execuções
- **Listar Execuções**: GET /executions - Filtradas por projeto (opcional).
- **Ler Execução**: GET /executions/{id} - Detalhes completos.
- **UI**: Tabela com status, data, inputs/outputs resumidos, logs expandidos.

### 3.7 Import/Export
- **Importar**:
  - POST /import/json - Payload: JSON de projeto completo.
  - POST /import/agents-yaml - YAML de agentes.
  - POST /import/tasks-yaml - YAML de tarefas.
  - POST /import/zip - ZIP com projeto serializado.
- **Exportar**:
  - GET /export/{id}/zip - Download ZIP (YAML agents/tasks + JSON projeto).
  - Suporte N8N: Exporta workflow.json.
- **Validações**: Schemas Pydantic; merge com projeto existente.

### 3.8 AI Builder (Chat para Geração)
- **Endpoint**: POST /builder - Payload: {project_id, prompt}. Usa LLM para gerar agents/tasks baseados em prompt (ex: "Crie workflow para suporte ao cliente").
- **UI**: Dock lateral com chat (React), integra com editor via eventos.
- **Fluxo**: Prompt -> LLM gera plano -> Cria agents/tasks -> Limpa editor -> Carrega grafo animado -> Opcional auto-execução.

### 3.9 Autenticação e Usuários
- **Login/Registro**: POST /auth/login, POST /auth/register - JWT tokens.
- **Sessões**: Armazenar user_id em DB para associações.
- **UI**: Página Auth com formulário.

### 3.10 Billing (Stripe)
- **Criar Sessão Checkout**: POST /billing/checkout - Payload: {price_id}. Retorna URL Stripe.
- **UI**: Cards de pricing (free/pro), botão subscribe.

### 3.11 Configurações
- **Ler/Atualizar**: GET /settings, PUT /settings/{key} - Chaves: api_keys (criptografadas), preferences.

### 3.12 Páginas e Navegação
- **Landing**: Hero com features, pricing, CTA login.
- **Dashboard**: Overview projetos, métricas execuções.
- **Projetos/Agentes/Tasks**: Listas paginadas com CRUD modais.
- **Run**: Execução minimalista (sem visual).
- **Execuções/Import/Export/Library/Integrations/Settings**: Páginas dedicadas.
- **Shell**: Sidebar (navegação), topbar (user/perfil), chat dock, command palette.

## 4. Requisitos Não-Funcionais

### 4.1 Performance
- Latência API: <200ms para CRUD; <5s para execuções curtas.
- Escalabilidade: Suporte 100 users simultâneos; filas Redis para execuções (futuro).
- Cache: React Query para frontend; DB indexes em id/project_id.

### 4.2 Segurança
- Autenticação: JWT com expiração; API keys criptografadas (bcrypt).
- CORS: Configurável via env.
- Validações: Pydantic schemas; SQLAlchemy para injeções.
- Rate Limiting: 100 req/min por user (futuro).

### 4.3 Usabilidade
- Responsivo: Mobile-first (Tailwind breakpoints).
- Acessibilidade: ARIA labels, keyboard nav (React Flow).
- Internacionalização: Suporte idiomas via i18n; default PT-BR.
- Temas: Claro/escuro toggle.

### 4.4 Confiabilidade
- DB: Transações ACID; backups automáticos.
- Erros: Logs estruturados; graceful degradation (ex: fallback LLM).
- Testes: Unitários (Pytest/Jest); e2e (Cypress).

### 4.5 Manutenibilidade
- Código: TypeScript/Python tipado; linters (ESLint/Black).
- Docs: Swagger (/docs); README com setup.

## 5. Stack Técnico

### 5.1 Backend
- **Framework**: FastAPI (ASGI), Python 3.10+.
- **DB/ORM**: SQLAlchemy, PostgreSQL (prod), SQLite (dev).
- **IA**: CrewAI para agents/tasks; LLM via OpenAI-compatible (OpenRouter/Gemini).
- **Tools**: Serper (busca web), FileRead (arquivos).
- **Autenticação**: JWT (PyJWT).
- **Billing**: Stripe SDK.
- **Serialização**: Pydantic v2.
- **Deploy**: Docker (API/Frontend/DB), Docker Compose.

### 5.2 Frontend
- **Framework**: React 18, TypeScript 5+.
- **Build**: Vite (dev/prod).
- **Estado**: React Query (API), Zustand (chat store).
- **UI**: shadcn/ui, Tailwind CSS, Lucide icons.
- **Editor**: React Flow (v11+), Dagre (layout).
- **Roteamento**: React Router v6.
- **Outros**: Sonner (toasts), clsx (classes).

### 5.3 Infraestrutura
- **Containerização**: Dockerfiles para API/Frontend; Compose para dev/prod.
- **Env Vars**: .env para API keys (OPENROUTER_API_KEY, GEMINI_API_KEY, DATABASE_URL, STRIPE_SECRET).
- **Migrations**: Alembic (futuro); seed.py para init DB.

### 5.4 Banco de Dados (Schema)
- **Project**: id (PK), name (unique), description, model_provider, model_name, language, created_at, updated_at.
- **Agent**: id (PK), project_id (FK), name, role, goal, backstory, tools (JSON), verbose, memory, allow_delegation.
- **Task**: id (PK), project_id (FK), agent_id (FK), description, expected_output, tools (JSON), async_execution, output_file.
- **Execution**: id (PK), project_id (FK), status, input_payload (JSON), output_payload (JSON), logs (TEXT), created_at.
- **Setting**: key (PK), value (TEXT).
- **User**: id (PK), email, password_hash (futuro completo).

## 6. Fluxos de Usuário

### 6.1 Fluxo Principal: Criar e Executar Workflow
1. Usuário loga (Auth page).
2. Dashboard: Clica "Novo Projeto" -> Modal cria projeto.
3. Editor Visual: Abre /app/editor?projectId=1.
4. AI Builder: Abre chat dock, prompt "Crie agents para marketing" -> Gera agents/tasks -> Carrega grafo animado.
5. Edita: Conecta task a agent via drag; ajusta no inspetor.
6. Valida: Botão "Validar" checa conexões.
7. Executa: Botão "Executar" -> Anima nós (running), polling logs no chat.
8. Visualiza: Execução completa -> Nós verdes, logs no histórico.
9. Exporta: Download ZIP.

### 6.2 Fluxo Autenticação/Billing
1. Landing: Visitor clica "Subscribe" -> Pricing cards -> Checkout Stripe.
2. Free user: Limites (ex: 10 execuções/mês).
3. Pro: Acesso ilimitado.

### 6.3 Fluxo Import/Export
1. Import: Upload ZIP/YAML -> Merge em projeto existente.
2. Export: Botão download -> ZIP com serializados.

## 7. Arquitetura do Sistema

### 7.1 High-Level
- **Frontend**: SPA React -> API calls via Axios (apiClient.ts).
- **Backend**: FastAPI app -> Rotas (routers_*.py) -> Services (executor.py) -> DB (models.py).
- **Fluxo Execução**: Frontend POST /execute -> Background task (executor.py) -> CrewAI kickoff -> Updates DB -> Polling frontend.
- **Eventos**: CustomEvents para sync chat/editor (ex: workflowCreated).
- **Diagrama**: [Descrever: Frontend <-> API <-> DB/PostgreSQL; LLM external via OpenRouter].

### 7.2 Endpoints API (OpenAPI /docs)
- Base: /api/v1 (prefix).
- Autenticação: Bearer JWT.
- Rate: Não implementado (adicionar middleware).

## 8. Diretrizes UI/UX

- **Design System**: shadcn/ui components (Button, Card, Modal, Table, etc.); Tailwind classes (bg-surface, text-muted-foreground).
- **Cores**: Primary (hsl(var(--primary))), destructive (vermelho), success (verde).
- **Animações**: Framer Motion para transições; React Flow built-in para edges.
- **Responsivo**: Mobile: Stack vertical, hidden sidebar; Desktop: Split view (editor + inspetor).
- **Acessibilidade**: Focus states, screen reader support em nós.

## 9. Considerações de Implementação

### 9.1 Roadmap (Próximas Features)
- Interface drag-and-drop completa (atual: básico).
- Suporte hierarchical process CrewAI.
- Upload arquivos para FileReadTool.
- Templates pré-configurados.
- Integração Redis/Celery para filas.
- Métricas dashboard (execuções/sucesso).
- Webhooks para integrações externas.

### 9.2 Integrações
- **LLM**: OpenRouter (multi-model), Gemini (google provider).
- **Tools**: Extensível via tools_config.py; adicionar PDF/CSV.
- **Billing**: Stripe checkout sessions.
- **Export**: YAML via crewai tools; N8N JSON.

### 9.3 Riscos e Dependências
- Dependência LLMs: Fallback para models gratuitos.
- Custos: Monitorar tokens (env MAX_TOKENS).
- DB: Migrações manuais; seed para demo.
- Testes: Cobertura 80% backend; E2E para fluxos críticos.

### 9.4 Métricas de Sucesso
- **Adoção**: 1000 users/mês; 80% retenção.
- **Performance**: Tempo execução <10s para workflows simples.
- **Qualidade**: <5% execuções falhas; NPS >8.
- **Técnico**: Uptime 99%; latência <500ms.

## 10. Apêndices

### 10.1 Schemas Pydantic (Exemplo)
Ver [api/schemas.py](api/schemas.py) para models completos (ProjectBase, AgentBase, etc.).

### 10.2 Setup de Desenvolvimento
- Backend: `pip install -r requirements.txt; uvicorn api.main:app --reload`.
- Frontend: `cd frontend; npm i; npm run dev`.
- Docker: `docker-compose up --build`.
- Env: Copiar .env.example; adicionar API keys.

### 10.3 Licença
MIT License. Contribuições via GitHub PRs.

---

*Versão 1.0 - Gerado em 2025-09-17. Atualize conforme evoluções.*