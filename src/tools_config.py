import os

try:
    from crewai_tools import SerperDevTool, ScrapeWebsiteTool, FileReadTool
except ImportError as e:
    print(f"Warning: crewai_tools import failed: {e}. Tools will be disabled.")
    SerperDevTool = None
    ScrapeWebsiteTool = None
    FileReadTool = None

def available_tools(selected: list[str]):
    tools = []
    try:
        if "serper" in selected and SerperDevTool:
            serper_key = os.getenv("SERPER_API_KEY")
            if serper_key:
                tools.append(SerperDevTool(api_key=serper_key))
            else:
                print("Warning: SERPER_API_KEY not set, skipping SerperDevTool.")

        if "scrape" in selected and ScrapeWebsiteTool:
            tools.append(ScrapeWebsiteTool())

        if "file_read" in selected and FileReadTool:
            tools.append(FileReadTool())
    except Exception as e:
        print(f"Warning: Failed to initialize tools: {e}")

    return tools
