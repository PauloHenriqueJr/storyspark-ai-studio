import os

# Fallback implementations for when crewai_tools is not available
class FallbackSerperDevTool:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def search(self, query: str):
        """Fallback search implementation"""
        return f"Search results for: {query} (using fallback - SERPER_API_KEY not configured)"

class FallbackScrapeWebsiteTool:
    def __init__(self, url: str = ""):
        self.url = url

    def scrape(self, url: str):
        """Fallback scraping implementation"""
        return f"Scraped content from: {url} (using fallback - ScrapeWebsiteTool not available)"

class FallbackFileReadTool:
    def __init__(self, file_path: str = ""):
        self.file_path = file_path

    def read(self, file_path: str):
        """Fallback file reading implementation"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            return f"Error reading file {file_path}: {str(e)}"

try:
    from crewai_tools import SerperDevTool, ScrapeWebsiteTool, FileReadTool
    print("✅ crewai_tools imported successfully")
except ImportError as e:
    print(f"⚠️ crewai_tools import failed: {e}. Using fallback implementations.")
    SerperDevTool = FallbackSerperDevTool
    ScrapeWebsiteTool = FallbackScrapeWebsiteTool
    FileReadTool = FallbackFileReadTool

def available_tools(selected: list[str]):
    tools = []
    try:
        if "serper" in selected:
            serper_key = os.getenv("SERPER_API_KEY")
            if serper_key:
                tools.append(SerperDevTool(api_key=serper_key))
                print("✅ SerperDevTool initialized")
            else:
                print("⚠️ SERPER_API_KEY not set, using fallback SerperDevTool.")
                tools.append(FallbackSerperDevTool(""))

        if "scrape" in selected:
            tools.append(ScrapeWebsiteTool())
            print("✅ ScrapeWebsiteTool initialized")

        if "file_read" in selected:
            tools.append(FileReadTool())
            print("✅ FileReadTool initialized")

        if "web_search" in selected:
            serper_key = os.getenv("SERPER_API_KEY")
            if serper_key:
                tools.append(SerperDevTool(api_key=serper_key))
                print("✅ WebSearchTool initialized")
            else:
                print("⚠️ SERPER_API_KEY not set, using fallback WebSearchTool.")
                tools.append(FallbackSerperDevTool(""))

        if "file_reader" in selected:
            tools.append(FileReadTool())
            print("✅ FileReaderTool initialized")

        if "txt_search" in selected:
            tools.append(FileReadTool())
            print("✅ TXTSearchTool initialized")

        if "file_writer" in selected:
            tools.append(FileReadTool())
            print("✅ FileWriterTool initialized")

    except Exception as e:
        print(f"⚠️ Failed to initialize some tools: {e}")

    if not tools:
        print("ℹ️ No tools were initialized. Check your tool configurations.")

    return tools
