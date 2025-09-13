from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db import models
from .schemas import AgentBase, AgentRead, AgentUpdate
from .deps import get_db


router = APIRouter(tags=["agents"]) 


@router.get("/projects/{project_id}/agents", response_model=List[AgentRead])
def list_agents(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Agent).filter_by(project_id=project_id).all()


@router.post("/projects/{project_id}/agents", response_model=AgentRead, status_code=201)
def create_agent(project_id: int, payload: AgentBase, db: Session = Depends(get_db)):
    # project_id from path takes precedence
    agent = models.Agent(
        project_id=project_id,
        name=payload.name,
        role=payload.role,
        goal=payload.goal,
        backstory=payload.backstory,
        tools=payload.tools or [],
        verbose=bool(payload.verbose),
        memory=bool(payload.memory),
        allow_delegation=bool(payload.allow_delegation),
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.put("/agents/{agent_id}", response_model=AgentRead)
def update_agent(agent_id: int, payload: AgentUpdate, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter_by(id=agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/agents/{agent_id}", status_code=204)
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter_by(id=agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    # Ensure no tasks depend on this agent
    tasks = db.query(models.Task).filter_by(agent_id=agent_id).count()
    if tasks:
        raise HTTPException(status_code=400, detail="Agent has tasks; delete tasks first")
    db.delete(agent)
    db.commit()
    return None
