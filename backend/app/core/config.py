from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "local"
    cors_allow_origins: str = "http://localhost:3000"
    admin_email_whitelist: str = ""


settings = Settings()
