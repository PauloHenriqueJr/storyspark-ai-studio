from crewai import Agent, Task, Crew, Process, LLM

def build_crew(agents_conf, tasks_conf, llm: LLM, tools_provider):
    agents = []
    for a in agents_conf:
        agents.append(Agent(
            role=a["role"],
            goal=a["goal"],
            backstory=a.get("backstory", ""),
            tools=tools_provider(a.get("tools", [])),
            verbose=a.get("verbose", True),
            memory=a.get("memory", False),
            allow_delegation=a.get("allow_delegation", False),
            llm=llm
        ))
    crew_tasks = []
    for t in tasks_conf:
        agent_idx = t.get("agent_index", 0)
        crew_tasks.append(Task(
            description=t["description"],
            expected_output=t.get("expected_output", ""),
            agent=agents[agent_idx]
        ))
    return Crew(agents=agents, tasks=crew_tasks, process=Process.sequential)
