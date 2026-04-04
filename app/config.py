from __future__ import annotations

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    # For Supabase Auth JWT verification, set this to your project's JWT secret.
    secret_key: str = Field(
        default="change-me",
        validation_alias=AliasChoices("SECRET_KEY", "SUPABASE_JWT_SECRET"),
    )
    access_token_expire_minutes: int = Field(default=720, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    timezone: str = Field(default="Asia/Kolkata", validation_alias="TIMEZONE")

    # Auth provider + Supabase config
    auth_provider: str = Field(default="supabase", validation_alias="AUTH_PROVIDER")
    supabase_url: str | None = Field(default=None, validation_alias="SUPABASE_URL")
    supabase_anon_key: str | None = Field(default=None, validation_alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str | None = Field(default=None, validation_alias="SUPABASE_SERVICE_ROLE_KEY")

    # For local dev/testing only: create tables from SQLAlchemy models.
    auto_create_schema: bool = Field(default=False, validation_alias="AUTO_CREATE_SCHEMA")


settings = Settings()
