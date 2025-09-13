# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**StorySpark AI Studio** is a modern web platform for creating and managing CrewAI agents with an elegant interface and scalable architecture. It provides a complete web interface for creating, managing, and running CrewAI projects with real-time execution and comprehensive project management capabilities.

## Development Commands

### Core Development

```bash
# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies  
cd frontend && npm install

# Start backend (FastAPI on port 8000)
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Start frontend development server (Vite on port 8080)
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build

# Build frontend for development
cd frontend && npm run build:dev

# Lint frontend code
cd frontend && npm run lint

# Preview production build
cd frontend && npm run preview
```

### Docker Development

```bash
# Start all services with Docker Compose (recommended)
docker-compose up --build

# Build production images
docker build -f Dockerfile.api -t storyspark-api .
docker build -f Dockerfile.frontend -t storyspark-frontend .

# Run production with PostgreSQL
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# OPENROUTER_API_KEY, GEMINI_API_KEY, SERPER_API_KEY, DATABASE_URL
```

## Architecture Overview

### Technology Stack

**Backend:**
- **FastAPI**: REST API framework with automatic documentation
- **SQLAlchemy**: ORM with support for SQLite/PostgreSQL
- **CrewAI 0.30.11**: Multi-agent AI framework integration
- **Pydantic**: Data validation and schemas
- **Python 3.11**: Runtime environment

**Frontend:**
- **React 18.3.1 + TypeScript**: Modern frontend with type safety
- **Vite + SWC**: Fast development server and build tool
- **Tailwind CSS**: Utility-first styling framework  
- **shadcn/ui**: Component library with Radix UI primitives
- **React Query**: Server state management and caching
- **React Router DOM v6**: Client-side routing
- **Zustand**: Lightweight state management

**Database & Infrastructure:**
- **PostgreSQL**: Production database (Docker containerized)
- **SQLite**: Development/local database fallback
- **Docker + Docker Compose**: Full containerization

### Core Architecture Patterns

#### 1. API Structure
The FastAPI backend follows a modular router pattern:
```
api/
├── main.py              # Application factory and CORS setup
├── routers_projects.py  # Project CRUD endpoints  
├── routers_agents.py    # Agent management endpoints
├── routers_tasks.py     # Task configuration endpoints
├── routers_executions.py # CrewAI execution engine
├── routers_settings.py  # API key and configuration management
├── routers_import_export.py # YAML/JSON/ZIP import/export
├── routers_auth.py      # Authentication (planned)
├── routers_billing.py   # Stripe integration (planned)
└── schemas.py           # Pydantic data models
```

#### 2. Database Architecture  
Uses SQLAlchemy models with relationship management:
- **Projects**: Container for agent teams and configurations
- **Agents**: Individual AI agents with roles, goals, and tools
- **Tasks**: Work assignments linked to specific agents  
- **Executions**: Historical runs with logs and outputs
- **Settings**: Encrypted API key storage

#### 3. Frontend Component Organization
```
frontend/src/
├── components/
│   ├── app-shell/        # Main layout components (sidebar, topbar)
│   ├── ui/               # shadcn/ui base components
│   ├── modals/           # Dialog components for CRUD operations
│   └── layout/           # Shared layout components
├── pages/                # Route components (Dashboard, Projects, etc.)
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and API clients  
└── types/                # TypeScript type definitions
```

#### 4. Multi-Provider AI Integration
- **Provider Support**: OpenRouter, Google Gemini with extensible architecture
- **Dynamic Configuration**: Provider settings stored in database
- **Tool Integration**: Serper (web search), FileReadTool, extensible for custom tools
- **Model Selection**: Per-project model configuration

## Key Development Patterns

### Backend Patterns

#### Database Sessions
```python
# Use dependency injection for database sessions
from api.deps import get_db

def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()
```

#### API Error Handling
All routers follow consistent error patterns with HTTP status codes and detailed messages.

#### Settings Management  
API keys are encrypted in database and loaded via `utils_settings.py` utilities.

### Frontend Patterns

#### API Integration
Uses React Query for server state management:
```typescript
const { data: projects, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects
});
```

#### Modal Pattern
CRUD operations use consistent modal components with form validation:
- `new-project-modal.tsx`
- `edit-project-modal.tsx` 
- `new-agent-modal.tsx`
- etc.

#### Routing Structure
- `/app/dashboard` - Main overview
- `/app/projects` - Project management
- `/app/agents` - Agent configuration  
- `/app/tasks` - Task definitions
- `/app/run` - Execution interface
- `/app/executions` - Historical runs
- `/app/import` - Data import tools
- `/app/export` - Data export tools

## CrewAI Integration

### Execution Flow
1. **Project Setup**: Define model provider and configuration
2. **Agent Creation**: Configure roles, goals, backstories, and tools
3. **Task Definition**: Link tasks to agents with expected outputs  
4. **Execution**: Sequential processing via CrewAI framework
5. **Results**: Structured outputs with comprehensive logging

## AI Builder Integration

### Natural Language to Workflow
The AI Builder allows users to create complex workflows using natural language:

#### How it works:
1. **Chat Interface**: Available globally via "Build with AI" button
2. **Smart Navigation**: Automatically navigates to Visual Editor when needed
3. **Pattern Recognition**: Detects workflow types from prompts:
   - Sentiment analysis workflows
   - Customer support flows
   - Data processing pipelines
4. **Automatic Creation**: Generates multiple agents and tasks based on context
5. **Flow Reuse**: Detects existing similar flows to avoid duplication

#### Example Prompt:
```
"Crie um fluxo para analisar comentários de clientes e separar por sentimento"
```
This creates:
- 3 specialized agents (Collector, Analyst, Reporter)
- 3 sequential tasks with proper connections
- Appropriate tools for each agent

### Visual Editor Features

#### Real-time Updates
- **Auto-refresh**: Polls for changes every 3 seconds
- **Live Execution**: Shows logs in chat during execution
- **Node Decoration**: Visual indicators for agents/tasks
- **Connection Persistence**: Saves relationships to database

#### Toolbox Actions
- **Add Agent**: Quick creation with defaults
- **Add Task**: Instant task creation
- **Auto-layout**: Reorganizes nodes automatically
- **Export**: Full project ZIP with code

### Tool Configuration
- **Serper**: Web search integration for market research
- **FileReadTool**: File processing capabilities
- **Extensible**: Add custom tools via the tools array in agent/task definitions

### Model Providers
- **OpenRouter**: Access to GPT-4, Claude, Mistral, and other models
- **Gemini**: Google's Gemini models (Flash 2.0, Pro)
- **Configuration**: Per-project model selection with fallback defaults

## Import/Export System

### Supported Formats
- **JSON**: Complete project configuration
- **YAML**: Agent and task definitions  
- **ZIP**: Full project export with generated code
- **Individual**: Single agent or task import

### Example Files
The project includes comprehensive examples:
- `example_project.json` - Project template
- `example_agents.yaml` - Agent configurations
- `example_tasks.yaml` - Task definitions

## Development Guidelines

### Database Changes
- Model changes require updating both `db/models.py` and `api/schemas.py`
- Use SQLAlchemy migrations for schema changes in production
- Test with both SQLite (dev) and PostgreSQL (prod)

### Adding New API Endpoints
1. Create router function in appropriate `routers_*.py` file
2. Add Pydantic schemas in `schemas.py`
3. Update database models if needed
4. Include in `main.py` router registration

### Frontend Component Development
- Follow shadcn/ui patterns for consistency
- Use TypeScript interfaces from `types/` directory
- Implement responsive design with Tailwind breakpoints
- Add loading states and error handling for all API calls

### Environment Variables
Required for full functionality:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crew_ai_studio
OPENROUTER_API_KEY=your_openrouter_key
GEMINI_API_KEY=your_gemini_key  
SERPER_API_KEY=your_serper_key
CORS_ORIGINS=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8000
```

## Common Development Tasks

### Testing AI Builder
```bash
# Test sentiment analysis detection
curl -X POST http://localhost:8000/builder/generate \
  -H "Content-Type: application/json" \
  -d '{"project_id": 1, "prompt": "analisar comentários e separar por sentimento"}'

# Check for similar flows
curl http://localhost:8000/builder/find-similar?project_id=1&prompt=sentimento
```

### Adding New Workflow Templates
1. Edit `api/routers_builder.py`
2. Add new pattern detection in `parse_sentiment_analysis_prompt`
3. Define agents and tasks structure
4. Update plan generation logic

### Adding New AI Providers
1. Update `model_provider` enum in `schemas.py`
2. Add provider logic in execution routers
3. Update frontend model selection UI
4. Add provider-specific environment variables

### Extending Tools
1. Add tool name to agent/task tool arrays
2. Implement tool logic in CrewAI execution code
3. Update frontend tool selection interface
4. Document tool usage in examples

### Database Schema Updates
1. Modify SQLAlchemy models in `db/models.py`
2. Update corresponding Pydantic schemas
3. Create migration scripts for production
4. Update seed data if applicable

## Security Considerations
- API keys are encrypted in database storage
- CORS configuration restricts frontend origins
- Input validation via Pydantic schemas
- SQL injection protection via SQLAlchemy ORM

## Performance Notes
- Frontend uses lazy loading for optimal bundle size
- React Query provides intelligent caching and background updates
- Database queries use proper indexing and relationships
- Docker multi-stage builds optimize image sizes
