import yaml

def to_yaml_agents(agents):
    data = []
    for a in agents:
        data.append({
            "name": a.name,
            "role": a.role,
            "goal": a.goal,
            "backstory": a.backstory,
            "tools": a.tools or [],
            "verbose": a.verbose,
            "memory": a.memory,
            "allow_delegation": a.allow_delegation,
        })
    return yaml.safe_dump(data, allow_unicode=True, sort_keys=False)

def to_yaml_tasks(tasks, agents_by_id):
    data = []
    for t in tasks:
        data.append({
            "agent": agents_by_id[t.agent_id].name if t.agent_id in agents_by_id else "unknown",
            "description": t.description,
            "expected_output": t.expected_output or "",
            "tools": t.tools or [],
            "async_execution": t.async_execution or False,
            "output_file": t.output_file or "",
        })
    return yaml.safe_dump(data, allow_unicode=True, sort_keys=False)
