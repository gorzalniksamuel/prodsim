"""Typed application settings, read from `PRODSIM_*` environment variables."""

import secrets
from functools import lru_cache
from typing import Any, Literal, Self, cast

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_DATABASE_URL = "postgresql+asyncpg://prodsim:prodsim@localhost:5432/prodsim"
_DEFAULT_VALKEY_URL = "redis://localhost:6379/0"
_MIN_PROD_SECRET_LENGTH = 32
_PROD_REQUIRED = ("secret_key", "database_url", "valkey_url")
_PLACEHOLDER_SECRET = "change-me"  # noqa: S105


def _generate_secret() -> SecretStr:
    return SecretStr(secrets.token_hex(32))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PRODSIM_", extra="ignore")

    environment: Literal["dev", "test", "prod"] = "dev"
    secret_key: SecretStr = Field(default_factory=_generate_secret)
    database_url: str = _DEFAULT_DATABASE_URL
    valkey_url: str = _DEFAULT_VALKEY_URL
    log_level: str = "INFO"
    cors_origins: list[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def _require_in_prod(cls, data: Any) -> Any:  # noqa: ANN401
        # Dev/test defaults and the generated secret must never leak into production.
        if not isinstance(data, dict):
            return data
        values = cast("dict[str, Any]", data)
        if values.get("environment") != "prod":
            return values
        missing = [f for f in _PROD_REQUIRED if values.get(f) in (None, "")]
        if missing:
            raise ValueError(f"required in prod: {', '.join(missing)}")
        return values

    @model_validator(mode="after")
    def _validate_prod(self) -> Self:
        if self.environment != "prod":
            return self
        secret = self.secret_key.get_secret_value()
        if len(secret) < _MIN_PROD_SECRET_LENGTH or secret.lower() == _PLACEHOLDER_SECRET:
            raise ValueError(
                f"secret_key must be at least {_MIN_PROD_SECRET_LENGTH} characters "
                "and not the placeholder in prod"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
