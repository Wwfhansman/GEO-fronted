from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.core.config import settings
from app.core.cors import install_cors

app = FastAPI(title="GEO Backend")
install_cors(app, settings.cors_allow_origins.split(","))
app.include_router(health_router)
app.include_router(auth_router)
