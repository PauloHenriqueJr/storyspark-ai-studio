import os
import contextlib
import io
import threading
import time
from typing import Dict, Any, List, Callable, Optional
from crewai import Agent, Task, Crew, Process, LLM
from .tools_config import available_tools
from db.database import SessionLocal
from db import models

_TRUE_VALUES = {"1", "true", "yes", "on"}
try:
    _MIN_INTERVAL_SECONDS = float(os.getenv("FREE_API_MIN_INTERVAL_SECONDS", "5"))
except ValueError:
    _MIN_INTERVAL_SECONDS = 5.0
_PROVIDER_LOCKS: Dict[str, threading.Lock] = {}
_PROVIDER_LAST_RUN: Dict[str, float] = {}
_PROVIDER_LOCK_GUARD = threading.Lock()


def _str_to_bool(value: Optional[str]) -> bool:
    if value is None:
        return False
    return value.strip().lower() in _TRUE_VALUES


def _get_provider_lock(provider: str) -> threading.Lock:
    provider_key = provider.lower()
    with _PROVIDER_LOCK_GUARD:
        lock = _PROVIDER_LOCKS.get(provider_key)
        if lock is None:
            lock = threading.Lock()
            _PROVIDER_LOCKS[provider_key] = lock
        return lock


def _should_force_sequential(db, provider: str) -> bool:
    if not provider:
        return False
    key = f"{provider.upper()}_FORCE_SEQUENTIAL"
    try:
        setting = db.query(models.Settings).filter_by(key=key).first()
        if setting and setting.value:
            return _str_to_bool(setting.value)
    except Exception:
        pass
    return _str_to_bool(os.getenv(key))


def _respect_rate_limit(provider: str) -> None:
    if _MIN_INTERVAL_SECONDS <= 0:
        return
    wait_time = 0.0
    now = time.time()
    with _PROVIDER_LOCK_GUARD:
        last_run = _PROVIDER_LAST_RUN.get(provider.lower())
        if last_run is not None:
            wait_time = (last_run + _MIN_INTERVAL_SECONDS) - now
            if wait_time < 0:
                wait_time = 0.0
    if wait_time > 0:
        time.sleep(wait_time)


def _mark_provider_run(provider: str) -> None:
    if _MIN_INTERVAL_SECONDS <= 0:
        return
    with _PROVIDER_LOCK_GUARD:
        _PROVIDER_LAST_RUN[provider.lower()] = time.time()


# Helper to pick the LLM provider for CrewAI

def build_llm(model_provider: str, model_name: str) -> LLM:
    provider = (model_provider or "openrouter").lower()
    if provider == "gemini":
        # Keep the gemini prefix so LiteLLM routes to the Google Generative AI API instead of Vertex
        model_id = model_name or "gemini/gemini-1.5-flash"
        if not model_id.startswith("gemini/"):
            model_id = f"gemini/{model_id}"
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured. Set it on the Integrations page.")
        # LiteLLM still checks these environment variables in some paths
        os.environ.setdefault("GEMINI_API_KEY", api_key)
        os.environ.setdefault("GOOGLE_API_KEY", api_key)
        return LLM(
            model=model_id,
            custom_llm_provider="gemini",
            api_key=api_key
        )
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
        provider_key = (getattr(project, "model_provider", "") or "").lower()
        force_sequential = _should_force_sequential(db, provider_key) if provider_key else False

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
        result: Dict[str, Any] | None = None
        try:
            if force_sequential:
                lock = _get_provider_lock(provider_key)
                with lock:
                    _respect_rate_limit(provider_key)
                    try:
                        result = execute(project, agents, tasks, inputs, execution_language, on_log=on_log)
                    finally:
                        _mark_provider_run(provider_key)
            else:
                result = execute(project, agents, tasks, inputs, execution_language, on_log=on_log)
            exe = db.query(models.Execution).filter_by(id=execution_id).first()
            if exe and result is not None:
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
