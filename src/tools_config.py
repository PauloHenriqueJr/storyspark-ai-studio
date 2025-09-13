import os

def available_tools(selected: list[str]):
    # Tools desabilitadas - crewai_tools não tem as classes esperadas (SerperDevTool, FileReadTool)
    # TODO: Investigar classes corretas do crewai_tools ou usar alternativa
    tools = []
    # Investigado: crewai_tools não contém SerperDevTool ou FileReadTool
    # if "serper" in selected:
    #     try:
    #         # TODO: Encontrar classe correta para Serper
    #         serper_key = os.getenv("SERPER_API_KEY")
    #         if serper_key:
    #             pass  # tools.append(SerperTool(api_key=serper_key))
    #     except ImportError:
    #         pass
    # if "file_read" in selected:
    #     try:
    #         # TODO: Encontrar classe correta para FileRead
    #         pass  # tools.append(FileReadTool())
    #     except ImportError:
    #         pass
    return tools
