from typing import Optional, Literal, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field


# ===== Project =====
class ProjectBase(BaseModel):
    name: str
    description: str = ""
    model_provider: Literal["openrouter", "gemini"] = "openrouter"
    model_name: str = "openrouter/gpt-4o-mini"
    language: Literal["pt", "pt-br", "en", "es", "fr"] = "pt-br"

    model_config = {
        "protected_namespaces": ()
    }


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    model_provider: Optional[Literal["openrouter", "gemini"]] = None
    model_name: Optional[str] = None
    language: Optional[Literal["pt", "pt-br", "en", "es", "fr"]] = None


class ProjectRead(ProjectBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Aggregated fields (optional)
    agents_count: Optional[int] = None
    tasks_count: Optional[int] = None
    executions_count: Optional[int] = None
    last_execution_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ===== Agent =====
class AgentBase(BaseModel):
    name: str
    role: str
    goal: str
    backstory: str = ""
    tools: List[str] = Field(default_factory=list)
    verbose: bool = True
    memory: bool = False
    allow_delegation: bool = False


class AgentCreate(AgentBase):
    project_id: int


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    backstory: Optional[str] = None
    tools: Optional[List[str]] = None
    verbose: Optional[bool] = None
    memory: Optional[bool] = None
    allow_delegation: Optional[bool] = None


class AgentRead(AgentBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True


# ===== Task =====
class TaskBase(BaseModel):
    agent_id: int
    description: str
    expected_output: str = ""
    tools: List[str] = Field(default_factory=list)
    async_execution: bool = False
    output_file: str = ""


class TaskCreate(TaskBase):
    project_id: int


class TaskUpdate(BaseModel):
    agent_id: Optional[int] = None
    description: Optional[str] = None
    expected_output: Optional[str] = None
    tools: Optional[List[str]] = None
    async_execution: Optional[bool] = None
    output_file: Optional[str] = None


class TaskRead(TaskBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True


# ===== Execution =====
class ExecutionRead(BaseModel):
    id: int
    project_id: int
    status: str
    input_payload: Dict[str, Any] | None = None
    output_payload: Dict[str, Any] | None = None
    logs: str | None = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExecuteRequest(BaseModel):
    inputs: Dict[str, Any] = Field(default_factory=dict)
    language: Optional[Literal["pt", "en", "es", "fr"]] = None


# ===== Settings =====
class SettingRead(BaseModel):
    key: str
    value: str


class SettingUpdate(BaseModel):
    value: str
