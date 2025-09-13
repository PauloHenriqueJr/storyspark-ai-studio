from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from db import models
from .schemas import ProjectCreate, ProjectRead, ProjectUpdate
from .deps import get_db


router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(models.Project).order_by(models.Project.created_at.desc()).all()
    # enrich with counts and last execution time
    results = []
    for p in projects:
        agents_count = db.query(func.count(models.Agent.id)).filter_by(project_id=p.id).scalar() or 0
        tasks_count = db.query(func.count(models.Task.id)).filter_by(project_id=p.id).scalar() or 0
        executions_count = db.query(func.count(models.Execution.id)).filter_by(project_id=p.id).scalar() or 0
        last_exec = db.query(func.max(models.Execution.created_at)).filter_by(project_id=p.id).scalar()
        pr = ProjectRead.model_validate({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "model_provider": p.model_provider,
            "model_name": p.model_name,
            "language": getattr(p, 'language', 'pt'),
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "agents_count": agents_count,
            "tasks_count": tasks_count,
            "executions_count": executions_count,
            "last_execution_at": last_exec,
        })
        results.append(pr)
    return results


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    exists = db.query(models.Project).filter_by(name=payload.name).first()
    if exists:
        raise HTTPException(status_code=409, detail="Project with this name already exists")
    proj = models.Project(
        name=payload.name,
        description=payload.description,
        model_provider=payload.model_provider,
        model_name=payload.model_name,
        language=payload.language,
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter_by(id=project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter_by(id=project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(proj, field, value)
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter_by(id=project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return None
