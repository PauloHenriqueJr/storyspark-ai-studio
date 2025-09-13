from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from db import models
from .deps import get_db
from .schemas import ExecutionRead, ExecuteRequest
from src.executor import execute as crew_execute, execute_in_background


router = APIRouter(tags=["executions"]) 


@router.get("/executions", response_model=List[ExecutionRead])
def list_executions(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Execution)
    if project_id:
        q = q.filter_by(project_id=project_id)
    return q.order_by(models.Execution.id.desc()).all()


@router.get("/executions/{execution_id}", response_model=ExecutionRead)
def get_execution(execution_id: int, db: Session = Depends(get_db)):
    exe = db.query(models.Execution).filter_by(id=execution_id).first()
    if not exe:
        raise HTTPException(status_code=404, detail="Execution not found")
    return exe


@router.post("/execute/project/{project_id}", response_model=ExecutionRead)
def execute_project(project_id: int, payload: ExecuteRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    agents = db.query(models.Agent).filter_by(project_id=project.id).all()
    tasks = db.query(models.Task).filter_by(project_id=project.id).all()
    if not agents or not tasks:
        raise HTTPException(status_code=400, detail="Project needs at least 1 agent and 1 task")

    exe = models.Execution(project_id=project.id, status="running", input_payload=payload.inputs or {}, logs="")
    db.add(exe)
    db.commit()
    db.refresh(exe)

    # Kick off background execution with incremental logs
    background.add_task(execute_in_background, exe.id, project.id, payload.inputs or {}, payload.language)
    return exe


@router.post("/execute/agent/{agent_id}", response_model=ExecutionRead)
def execute_agent(agent_id: int, payload: ExecuteRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter_by(id=agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    project = db.query(models.Project).filter_by(id=agent.project_id).first()
    tasks = db.query(models.Task).filter_by(project_id=agent.project_id, agent_id=agent.id).all()
    if not tasks:
        raise HTTPException(status_code=400, detail="Agent has no tasks")

    exe = models.Execution(project_id=project.id, status="running", input_payload={"agent_id": agent.id, **(payload.inputs or {})}, logs="")
    db.add(exe)
    db.commit()
    db.refresh(exe)
    background.add_task(execute_in_background, exe.id, project.id, payload.inputs or {}, payload.language)
    return exe


@router.post("/execute/task/{task_id}", response_model=ExecutionRead)
def execute_task(task_id: int, payload: ExecuteRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter_by(id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    agent = db.query(models.Agent).filter_by(id=task.agent_id).first()
    if not agent:
        raise HTTPException(status_code=400, detail="Task agent missing")
    project = db.query(models.Project).filter_by(id=task.project_id).first()

    exe = models.Execution(project_id=project.id, status="running", input_payload={"task_id": task.id, **(payload.inputs or {})}, logs="")
    db.add(exe)
    db.commit()
    db.refresh(exe)
    background.add_task(execute_in_background, exe.id, project.id, payload.inputs or {}, payload.language)
    return exe

@router.get("/executions", response_model=List[ExecutionRead])
def list_executions(project_id: Optional[int] = None, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    q = db.query(models.Execution)
    if project_id:
        q = q.filter_by(project_id=project_id)
    return q.order_by(models.Execution.id.desc()).offset(offset).limit(limit).all()
