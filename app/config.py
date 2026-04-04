from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    database_url: str = Field(default="sqlite:///./pos.db", validation_alias="DATABASE_URL")
    secret_key: str = Field(default="change-me", validation_alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=720, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    timezone: str = Field(default="Asia/Kolkata", validation_alias="TIMEZONE")


settings = Settings()
