import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers_projects import router as projects_router
from .routers_agents import router as agents_router
from .routers_tasks import router as tasks_router
from .routers_executions import router as executions_router
from .routers_settings import router as settings_router
from .routers_import_export import router as import_export_router
from .routers_auth import router as auth_router
from .routers_billing import router as billing_router
from db.seed import init_db


def create_app() -> FastAPI:
    app = FastAPI(
        title="Crew AI Studio API",
        version="1.0.0",
        description="API para projetos, agentes, tasks, execuções, importação/exportação e integrações",
    )

    # CORS
    origins = os.getenv("CORS_ORIGINS", "*").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in origins if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Ensure database tables exist
    @app.on_event("startup")
    def _startup_create_tables():
        try:
            init_db()
        except Exception:
            # On start errors should not crash the app in dev; logs will be visible in console
            pass

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.include_router(projects_router)
    app.include_router(agents_router)
    app.include_router(tasks_router)
    app.include_router(executions_router)
    app.include_router(settings_router)
    app.include_router(import_export_router)
    app.include_router(auth_router)
    app.include_router(billing_router)

    # AI Builder (prompt-to-flow)
    try:
        from .routers_builder import router as builder_router
        app.include_router(builder_router)
    except Exception:
        # Router is optional; ignore import errors in constrained envs
        pass

    return app


app = create_app()
