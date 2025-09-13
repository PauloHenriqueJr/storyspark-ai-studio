from sqlalchemy import (
    Column, Integer, String, Text, Boolean, ForeignKey, JSON, DateTime, func
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False, unique=True)
    description = Column(Text, default="")
    model_provider = Column(String(50), default="openrouter")  # openrouter|gemini
    model_name = Column(String(100), default="openrouter/gpt-4o-mini")
    language = Column(String(10), default="pt")  # pt|en|es|fr
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    agents = relationship("Agent", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    executions = relationship("Execution", back_populates="project", cascade="all, delete-orphan")

class Agent(Base):
    __tablename__ = "agents"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(120), nullable=False)
    role = Column(String(200), nullable=False)
    goal = Column(Text, nullable=False)
    backstory = Column(Text, default="")
    tools = Column(JSON, default=list)  # ["serper", "file_read"]
    verbose = Column(Boolean, default=True)
    memory = Column(Boolean, default=False)
    allow_delegation = Column(Boolean, default=False)

    project = relationship("Project", back_populates="agents")
    tasks = relationship("Task", back_populates="agent")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    description = Column(Text, nullable=False)
    expected_output = Column(Text, default="")
    tools = Column(JSON, default=list)
    async_execution = Column(Boolean, default=False)
    output_file = Column(String(255), default="")

    project = relationship("Project", back_populates="tasks")
    agent = relationship("Agent", back_populates="tasks")

class Execution(Base):
    __tablename__ = "executions"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    status = Column(String(30), default="created")  # created|running|done|error
    input_payload = Column(JSON, default=dict)
    output_payload = Column(JSON, default=dict)
    logs = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="executions")

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
