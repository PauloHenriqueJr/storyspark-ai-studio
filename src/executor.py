import os
import contextlib
import io
from typing import Dict, Any, List, Callable, Optional
from crewai import Agent, Task, Crew, Process, LLM
from .tools_config import available_tools
from db.database import SessionLocal
from db import models

# Helper to pick the LLM provider for CrewAI
def build_llm(model_provider: str, model_name: str) -> LLM:
    provider = (model_provider or "openrouter").lower()
    if provider == "gemini":
        # CrewAI LLM generic wrapper; we set provider 'google' and model name (e.g., 'gemini-1.5-flash-002')
        return LLM(model=model_name, provider="google", api_key=os.getenv("GEMINI_API_KEY"))
    else:
        # OpenRouter via OpenAI-compatible base URL
        os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY", "")
        os.environ["OPENAI_API_BASE"] = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        # Limit max_tokens to avoid credit issues - configurable via env var
        max_tokens_env = os.getenv("MAX_TOKENS")
        max_tokens = int(max_tokens_env) if max_tokens_env else 1000
        return LLM(model=model_name, max_tokens=max_tokens)  # CrewAI uses OpenAI-compatible client underneath

def get_language_instruction(language: str) -> str:
    """Retorna instruções específicas para o idioma"""
    language_map = {
        "pt": "português brasileiro",
        "pt-br": "português brasileiro",
        "en": "English",
        "es": "español",
        "fr": "français"
    }

    lang_name = language_map.get(language, "português brasileiro")
    return f"IMPORTANTE: Responda sempre em {lang_name}. Todas as suas respostas, explicações, títulos, descrições e conteúdo devem estar exclusivamente neste idioma. Não use outros idiomas em nenhuma parte da resposta."

class _CallbackIO(io.StringIO):
    def __init__(self, on_log: Optional[Callable[[str], None]] = None):
        super().__init__()
        self._on_log = on_log

    def write(self, s: str) -> int:
        n = super().write(s)
        if self._on_log and s:
            try:
                self._on_log(s)
            except Exception:
                pass
        return n


def execute(project, agents, tasks, inputs: Dict[str, Any], execution_language: str = None, on_log: Optional[Callable[[str], None]] = None) -> Dict[str, Any]:
    # Single shared LLM for all agents in this project
    llm = build_llm(project.model_provider, project.model_name)

    # Get language instruction - use execution language if provided, otherwise use project language
    language = execution_language or getattr(project, 'language', 'pt-br')
    language_instruction = get_language_instruction(language)

    crew_agents: List[Agent] = []
    for a in agents:
        # Add language instruction to the goal
        enhanced_goal = f"{a.goal}\n\n{language_instruction}"

        crew_agents.append(Agent(
            role=a.role,
            goal=enhanced_goal,
            backstory=a.backstory or "",
            tools=available_tools(a.tools or []),
            verbose=bool(a.verbose),
            memory=bool(a.memory),
            allow_delegation=bool(a.allow_delegation),
            llm=llm
        ))

    crew_tasks: List[Task] = []
    id_to_index = {a.id: i for i, a in enumerate(agents)}
    for t in tasks:
        idx = id_to_index.get(t.agent_id, 0)
        # Simple template formatting with inputs
        desc = t.description
        try:
            if inputs:
                desc = desc.format(**inputs)
        except Exception:
            pass

        # Add language instruction to expected output
        enhanced_expected_output = f"{t.expected_output or ''}\n\n{language_instruction}"

        crew_tasks.append(Task(
            description=desc,
            expected_output=enhanced_expected_output,
            agent=crew_agents[idx],
        ))

    crew = Crew(agents=crew_agents, tasks=crew_tasks, process=Process.sequential)

    # capture logs
    buf = _CallbackIO(on_log)
    with contextlib.redirect_stdout(buf):
        try:
            result = crew.kickoff(inputs or {})
            logs = buf.getvalue()
            return {"status": "completed", "result": str(result), "logs": logs}
        except Exception as e:
            logs = buf.getvalue() + f"\n[ERROR] {e}"
            return {"status": "error", "result": "", "logs": logs}


def execute_in_background(execution_id: int, project_id: int, inputs: Dict[str, Any], execution_language: Optional[str] = None):
    """Background entry to execute a project and update DB incrementally."""
    db = SessionLocal()
    try:
        project = db.query(models.Project).filter_by(id=project_id).first()
        agents = db.query(models.Agent).filter_by(project_id=project_id).all()
        tasks = db.query(models.Task).filter_by(project_id=project_id).all()

        def on_log(chunk: str):
            try:
                exe = db.query(models.Execution).filter_by(id=execution_id).first()
                if not exe:
                    return
                exe.logs = (exe.logs or "") + chunk
                db.add(exe)
                db.commit()
            except Exception:
                # Ignore logging errors to prevent execution failure
                pass

        try:
            result = execute(project, agents, tasks, inputs, execution_language, on_log=on_log)
            exe = db.query(models.Execution).filter_by(id=execution_id).first()
            if exe:
                exe.status = result.get("status", "completed")
                if result.get("status") == "error":
                    logs_blob = result.get("logs") or ""
                    log_tail = logs_blob.splitlines()
                    error_message = log_tail[-1].strip() if log_tail else ""
                    exe.output_payload = {"error": error_message or result.get("result", "")}
                else:
                    exe.output_payload = {"result": result.get("result", "")}
                exe.logs = result.get("logs", exe.logs or "")
                db.add(exe)
                db.commit()
        except Exception as e:
            # Handle execution errors and update status
            exe = db.query(models.Execution).filter_by(id=execution_id).first()
            if exe:
                exe.status = "error"
                exe.output_payload = {"error": str(e)}
                exe.logs = (exe.logs or "") + f"\n[ERROR] Execution failed: {str(e)}"
                db.add(exe)
                db.commit()
    except Exception as e:
        # Handle database connection errors
        print(f"Database error in execute_in_background: {e}")
    finally:
        db.close()
