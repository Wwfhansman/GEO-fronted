from fastapi import FastAPI

from app.api.routes.analytics import router as analytics_router
from app.api.routes.auth import router as auth_router
from app.api.routes.context import router as context_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.leads import router as leads_router
from app.api.routes.tests import router as tests_router
from app.core.config import settings
from app.core.cors import install_cors
from app.db.session import init_db

app = FastAPI(title="GEO Backend")
install_cors(app, settings.cors_allow_origins.split(","))
app.include_router(health_router)
app.include_router(analytics_router)
app.include_router(auth_router)
app.include_router(context_router)
app.include_router(tests_router)
app.include_router(leads_router)
app.include_router(dashboard_router)


@app.on_event("startup")
def startup_init_db() -> None:
    init_db()
