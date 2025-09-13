import os

def available_tools(selected: list[str]):
    # Temporariamente desabilitado devido a problemas de versão do crewai-tools
    # TODO: Atualizar para versão compatível do crewai-tools
    tools = []
    # if "serper" in selected:
    #     try:
    #         from crewai_tools import SerperDevTool
    #         serper_key = os.getenv("SERPER_API_KEY")
    #         if serper_key:
    #             tools.append(SerperDevTool(api_key=serper_key))
    #     except ImportError:
    #         pass
    # if "file_read" in selected:
    #     try:
    #         from crewai_tools import FileReadTool
    #         tools.append(FileReadTool())
    #     except ImportError:
    #         pass
    return tools
