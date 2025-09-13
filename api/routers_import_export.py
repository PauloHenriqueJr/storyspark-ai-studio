import io
import os
import tempfile
import zipfile
from typing import List

import yaml
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from db import models
from .utils_settings import get_setting
from .deps import get_db
from .schemas import ProjectRead
from src.exporter import export_project_zip
from .utils_n8n import convert_n8n_to_crewai, detect_n8n_integrations
from .utils_settings import get_setting


router = APIRouter(tags=["import-export"]) 


@router.post("/import/json", response_model=ProjectRead)
async def import_json(uploaded_json: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        data = yaml.safe_load(await uploaded_json.read())  # YAML handles JSON too
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    # n8n detection and conversion
    if isinstance(data, dict) and "nodes" in data and "connections" in data:
        data = convert_n8n_to_crewai(data)

    if not isinstance(data, dict) or "name" not in data:
        raise HTTPException(status_code=400, detail="Payload must contain at least 'name'")

    # Defaults and override behavior
    default_provider = get_setting(db, 'DEFAULT_PROVIDER', 'openrouter')
    default_model = get_setting(db, 'DEFAULT_MODEL', 'openrouter/gpt-4o-mini')
    override = get_setting(db, 'IMPORT_OVERRIDE_MODEL', 'false').lower() in ('1','true','yes','on')
    override = get_setting(db, 'IMPORT_OVERRIDE_MODEL', 'false').lower() in ('1','true','yes','on')
    provider = default_provider if override else data.get("model_provider", default_provider)
    model = default_model if override else data.get("model_name", default_model)
    proj = models.Project(
        name=data.get("name", "Imported Project"),
        description=data.get("description", ""),
        model_provider=provider,
        model_name=model,
        language=data.get("language", "pt"),
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)

    # Optional: import agents + tasks
    agent_name_to_id = {}
    for agent in data.get("agents", []) or []:
        ag = models.Agent(
            project_id=proj.id,
            name=agent.get("name", "Unknown"),
            role=agent.get("role", "Unknown"),
            goal=agent.get("goal", ""),
            backstory=agent.get("backstory", ""),
            tools=agent.get("tools", []),
            verbose=agent.get("verbose", True),
            memory=agent.get("memory", False),
            allow_delegation=agent.get("allow_delegation", False),
        )
        db.add(ag)
        db.commit()
        db.refresh(ag)
        agent_name_to_id[ag.name] = ag.id

    for task in data.get("tasks", []) or []:
        agent_name = task.get("agent")
        if agent_name in agent_name_to_id:
            tk = models.Task(
                project_id=proj.id,
                agent_id=agent_name_to_id[agent_name],
                description=task.get("description", ""),
                expected_output=task.get("expected_output", ""),
                tools=task.get("tools", []),
                async_execution=task.get("async_execution", False),
                output_file=task.get("output_file", ""),
            )
            db.add(tk)
    db.commit()

    return proj


@router.post("/import/agents-yaml")
async def import_agents_yaml(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter_by(id=project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        data = yaml.safe_load(await file.read())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {e}")
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Agents YAML must be a list")
    count = 0
    for agent in data:
        ag = models.Agent(
            project_id=proj.id,
            name=agent.get("name", "Unknown"),
            role=agent.get("role", "Unknown"),
            goal=agent.get("goal", ""),
            backstory=agent.get("backstory", ""),
            tools=agent.get("tools", []),
            verbose=agent.get("verbose", True),
            memory=agent.get("memory", False),
            allow_delegation=agent.get("allow_delegation", False),
        )
        db.add(ag)
        count += 1
    db.commit()
    return {"imported": count}


@router.post("/import/tasks-yaml")
async def import_tasks_yaml(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter_by(id=project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        data = yaml.safe_load(await file.read())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {e}")
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Tasks YAML must be a list")

    agent_name_to_id = {a.name: a.id for a in db.query(models.Agent).filter_by(project_id=project_id).all()}
    count = 0
    for task in data:
        agent_name = task.get("agent")
        if agent_name in agent_name_to_id:
            tk = models.Task(
                project_id=project_id,
                agent_id=agent_name_to_id[agent_name],
                description=task.get("description", ""),
                expected_output=task.get("expected_output", ""),
                tools=task.get("tools", []),
                async_execution=task.get("async_execution", False),
                output_file=task.get("output_file", ""),
            )
            db.add(tk)
            count += 1
    db.commit()
    return {"imported": count}


@router.post("/import/zip", response_model=ProjectRead)
async def import_zip(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            names = z.namelist()
            # Find paths regardless of subfolders
            def find_path(endswith: str):
                lw = endswith.lower()
                for n in names:
                    if n.lower().endswith(lw):
                        return n
                return None

            agents_path = find_path('agents.yaml')
            tasks_path = find_path('tasks.yaml')
            project_path = find_path('project.json')
            readme_path = find_path('README.md') or find_path('readme.md')

            if not agents_path or not tasks_path:
                raise HTTPException(status_code=400, detail=f"ZIP must contain agents.yaml and tasks.yaml (found: {', '.join(names)})")

            agents_yaml = yaml.safe_load(z.read(agents_path))
            tasks_yaml = yaml.safe_load(z.read(tasks_path))
            project_json = yaml.safe_load(z.read(project_path)) if project_path else {}
            readme_text = None
            if readme_path:
                try:
                    readme_text = z.read(readme_path).decode('utf-8', errors='ignore')
                except Exception:
                    readme_text = None
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file")

    default_provider = get_setting(db, 'DEFAULT_PROVIDER', 'openrouter')
    default_model = get_setting(db, 'DEFAULT_MODEL', 'openrouter/gpt-4o-mini')
    # Derive description from README first line if not provided
    derived_desc = None
    if readme_text:
        for line in readme_text.splitlines():
            s = line.strip()
            if s and not s.startswith('#'):
                derived_desc = s
                break
        # if first non-empty is header, fallback to header text
        if not derived_desc:
            for line in readme_text.splitlines():
                s = line.strip()
                if s.startswith('#'):
                    derived_desc = s.lstrip('#').strip()
                    break
    fallback_name = os.path.splitext(file.filename)[0].replace('_', ' ').strip().title()
    provider = default_provider if override else project_json.get("model_provider", default_provider)
    model = default_model if override else project_json.get("model_name", default_model)
    proj = models.Project(
        name=project_json.get("name", fallback_name),
        description=project_json.get("description", derived_desc or f"Imported from ZIP: {file.filename}"),
        model_provider=provider,
        model_name=model,
        language=project_json.get("language", "pt"),
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)

    # Normalize YAML formats (support dict style)
    if isinstance(agents_yaml, dict):
        agents_list = []
        for name, data in (agents_yaml or {}).items():
            d = dict(data or {})
            d['name'] = name
            agents_list.append(d)
        agents_yaml = agents_list
    if isinstance(tasks_yaml, dict):
        tasks_list = []
        for name, data in (tasks_yaml or {}).items():
            d = dict(data or {})
            # try to infer agent
            if 'agent' not in d:
                for k, v in d.items():
                    if k.startswith('agent') and isinstance(v, str):
                        d['agent'] = v
                        break
            tasks_list.append(d)
        tasks_yaml = tasks_list

    agent_name_to_id = {}
    for agent in (agents_yaml or []):
        ag = models.Agent(
            project_id=proj.id,
            name=agent.get("name", "Unknown"),
            role=agent.get("role", "Unknown"),
            goal=agent.get("goal", ""),
            backstory=agent.get("backstory", ""),
            tools=agent.get("tools", []),
            verbose=agent.get("verbose", True),
            memory=agent.get("memory", False),
            allow_delegation=agent.get("allow_delegation", False),
        )
        db.add(ag)
        db.commit()
        db.refresh(ag)
        agent_name_to_id[ag.name] = ag.id

    for task in (tasks_yaml or []):
        agent_name = task.get("agent")
        if agent_name in agent_name_to_id:
            tk = models.Task(
                project_id=proj.id,
                agent_id=agent_name_to_id[agent_name],
                description=task.get("description", ""),
                expected_output=task.get("expected_output", ""),
                tools=task.get("tools", []),
                async_execution=task.get("async_execution", False),
                output_file=task.get("output_file", ""),
            )
            db.add(tk)
    db.commit()
    return proj


@router.get("/export/{project_id}/zip")
def export_zip(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    agents = db.query(models.Agent).filter_by(project_id=project.id).all()
    tasks = db.query(models.Task).filter_by(project_id=project.id).all()
    if not agents or not tasks:
        raise HTTPException(status_code=400, detail="Project must have agents and tasks to export")

    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
        out_path = tmp.name
    path = export_project_zip(project, agents, tasks, out_path)
    filename = f"{project.name.replace(' ', '_').lower()}_export.zip"
    return FileResponse(path, media_type="application/zip", filename=filename)
