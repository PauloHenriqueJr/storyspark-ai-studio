from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db import models
from .schemas import TaskBase, TaskRead, TaskUpdate
from .deps import get_db


router = APIRouter(tags=["tasks"]) 


@router.get("/projects/{project_id}/tasks", response_model=List[TaskRead])
def list_tasks(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Task).filter_by(project_id=project_id).all()


@router.post("/projects/{project_id}/tasks", response_model=TaskRead, status_code=201)
def create_task(project_id: int, payload: TaskBase, db: Session = Depends(get_db)):
    # Ensure agent exists and belongs to project
    agent = db.query(models.Agent).filter_by(id=payload.agent_id, project_id=project_id).first()
    if not agent:
        raise HTTPException(status_code=400, detail="Agent not found in this project")

    task = models.Task(
        project_id=project_id,
        agent_id=payload.agent_id,
        description=payload.description,
        expected_output=payload.expected_output or "",
        tools=payload.tools or [],
        async_execution=bool(payload.async_execution),
        output_file=payload.output_file or "",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter_by(id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    updates = payload.model_dump(exclude_unset=True)
    if "agent_id" in updates:
        # ensure agent belongs to same project
        agent = db.query(models.Agent).filter_by(id=updates["agent_id"], project_id=task.project_id).first()
        if not agent:
            raise HTTPException(status_code=400, detail="Agent not found in the same project")
    for field, value in updates.items():
        setattr(task, field, value)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter_by(id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None
