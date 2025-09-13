import os
import zipfile
import yaml
from .yaml_generator import to_yaml_agents, to_yaml_tasks

TEMPLATE_CREW = """from crewai import Agent, Task, Crew, Process
from tools import available_tools

agents = []
{agents_block}

{tasks_block}

all_tasks = [{tasks_list}]
crew = Crew(agents=agents, tasks=all_tasks, process=Process.sequential)
"""

TEMPLATE_AGENT = """agents.append(Agent(
    role={role!r},
    goal={goal!r},
    backstory={backstory!r},
    tools=available_tools({tools!r}),
    verbose={verbose},
    memory={memory},
    allow_delegation={allow_delegation}
))"""

TEMPLATE_TASK = """task_{tid} = Task(
    description={desc!r},
    expected_output={exp!r},
    agent=agents[{aidx}]
)"""

def export_project_zip(project, agents, tasks, output_path: str):
    agents_by_id = {a.id: a for a in agents}
    agents_yaml = to_yaml_agents(agents)
    tasks_yaml = to_yaml_tasks(tasks, agents_by_id)

    # Create project.json with full metadata
    project_json = {
        "name": project.name,
        "description": project.description,
        "model_provider": project.model_provider,
        "model_name": project.model_name,
        "language": getattr(project, 'language', 'pt'),
        "exported_at": str(project.updated_at) if project.updated_at else None,
        "version": "1.0"
    }

    # Generate agent blocks
    ab = []
    for a in agents:
        ab.append(TEMPLATE_AGENT.format(
            role=a.role, goal=a.goal, backstory=a.backstory or "",
            tools=a.tools or [], verbose=bool(a.verbose), memory=bool(a.memory),
            allow_delegation=bool(a.allow_delegation)
        ))

    # Generate task blocks
    tb = []
    id_to_idx = {a.id: i for i, a in enumerate(agents)}
    for t in tasks:
        tb.append(TEMPLATE_TASK.format(
            tid=t.id, desc=t.description, exp=t.expected_output or "",
            aidx=id_to_idx.get(t.agent_id, 0)
        ))

    crew_py = TEMPLATE_CREW.format(
        agents_block="\n\n".join(ab),
        tasks_block="\n\n".join(tb),
        tasks_list=", ".join([f"task_{t.id}" for t in tasks])
    )

    main_py = "from crew import crew\n\nif __name__ == '__main__':\n    print(crew.kickoff())\n"
    tools_py = "from src.tools_config import available_tools\n"

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("project.json", yaml.safe_dump(project_json, allow_unicode=True, sort_keys=False))
        z.writestr("agents.yaml", agents_yaml)
        z.writestr("tasks.yaml", tasks_yaml)
        z.writestr("crew.py", crew_py)
        z.writestr("main.py", main_py)
        z.writestr("tools.py", tools_py)
        z.writestr("README.md", f"""# {project.name}

{project.description}

## Project Details
- **Model Provider**: {project.model_provider}
- **Model**: {project.model_name}
- **Language**: {getattr(project, 'language', 'pt')}
- **Agents**: {len(agents)}
- **Tasks**: {len(tasks)}

## Files
- `project.json` - Project metadata
- `agents.yaml` - Agent configurations
- `tasks.yaml` - Task configurations
- `crew.py` - Generated CrewAI code
- `main.py` - Execution script
- `tools.py` - Tools configuration

## Usage
```bash
python main.py
```

Exported from Crew AI Studio
""")

    return output_path
