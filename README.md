# Crew AI Studio (Self-Hosted MVP)

Uma interface estilo **app.crewai.com** para criar agentes, tarefas, executar projetos e exportar código
do CrewAI — rodando na **sua VPS**, com **PostgreSQL** e integrações com **OpenRouter**, **Gemini Flash 2.0**
e **Serper**.

## 🚀 Funcionalidades
- CRUD de **Projetos**, **Agentes** e **Tarefas** (SQLite/PostgreSQL via SQLAlchemy).
- **Execução** `crew.kickoff()` diretamente do app (processo sequencial).
- **Seleção de modelo** (OpenRouter / Gemini) por projeto.
- **Logs de Execução** e histórico.
- **Exportação**: gera `crew.py`, `main.py`, `agents.yaml`, `tasks.yaml` e zipa para download.
- **Importação**: upload de projetos via JSON, agentes/tasks via YAML, ou projetos completos via ZIP.
- **Configurações Persistentes**: API keys salvas no banco de dados.
- **Botões de Refresh**: atualizam dados em tempo real nas abas.
- **Tools**: Serper (web search) e FileReadTool (básico) prontos para uso.

## 🧰 Pré-requisitos
- Python 3.10+
- PostgreSQL 14+
- `pip install -r requirements.txt`
- Copie `.env.example` para `.env` e preencha suas chaves

## ▶️ Rodando local/VPS
```bash
streamlit run app.py --server.port=8501 --server.address=0.0.0.0
```

## 🔧 Notas sobre LLMs
- **OpenRouter**: Defina `OPENROUTER_API_KEY` e `OPENROUTER_BASE_URL`. O executor seta `OPENAI_API_BASE` e usa
o nome do modelo (ex.: `openrouter/gpt-4o-mini`) no CrewAI.
- **Gemini**: Defina `GEMINI_API_KEY` e escolha um modelo da família (ex.: `gemini-1.5-flash-002`).

## 🧪 Execução
- Use a aba **Run** para escolher inputs e executar.
- A execução é **sequencial** por padrão (simples e previsível).

## 🧷 Observações
- Este é um **MVP funcional**. Sinta-se livre para evoluir para **FastAPI + React** e filas (Redis) se quiser escalar.
- Para Serper, cadastre sua `SERPER_API_KEY` e habilite a tool no agente/tarefa.
