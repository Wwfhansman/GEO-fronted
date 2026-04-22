from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "local"
    database_url: str = "sqlite:///./geo.db"
    supabase_jwt_secret: str = "dev-secret"
    supabase_project_url: str = ""
    supabase_service_role_key: str = ""
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    chatgpt_model: str = "openai/gpt-5.4-mini"
    deepseek_model: str = "deepseek-v3"
    doubao_model: str = "doubao-1.5-pro-32k"
    tongyi_model: str = "qwen/qwen3.5-plus"
    review_model_api_key: str = ""
    email_api_key: str = ""
    email_from: str = "noreply@geo.example.com"
    lead_notification_to: str = ""
    cors_allow_origins: str = "http://localhost:3000"
    admin_email_whitelist: str = ""
    turnstile_secret_key: str = ""
    turnstile_verify_url: str = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    bootstrap_rate_limit_per_ip: int = 10
    bootstrap_rate_limit_window_seconds: int = 3600
    test_rate_limit_per_ip: int = 20
    test_rate_limit_per_user: int = 10
    test_rate_limit_window_seconds: int = 3600

    @field_validator(
        "database_url",
        "supabase_jwt_secret",
        "supabase_project_url",
        "supabase_service_role_key",
        "openai_api_key",
        "openai_base_url",
        "chatgpt_model",
        "deepseek_model",
        "doubao_model",
        "tongyi_model",
        "review_model_api_key",
        "cors_allow_origins",
        "admin_email_whitelist",
        "turnstile_secret_key",
        "turnstile_verify_url",
        mode="before",
    )
    @classmethod
    def strip_string_values(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def default_database_url(cls, value: object) -> str:
        if isinstance(value, str) and not value.strip():
            return "sqlite:///./geo.db"
        return str(value)

    @field_validator("openai_base_url", mode="before")
    @classmethod
    def default_openai_base_url(cls, value: object) -> str:
        if isinstance(value, str) and not value.strip():
            return "https://api.openai.com/v1"
        return str(value)


settings = Settings()
