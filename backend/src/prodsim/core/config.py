"""Typed application settings, read from `PRODSIM_*` environment variables."""

import secrets
from functools import lru_cache
from typing import Any, Literal, Self

from pydantic import Field, SecretStr, model_validator
from pydantic.fields import FieldInfo
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource, SettingsConfigDict

_DEFAULT_DATABASE_URL = "postgresql+asyncpg://prodsim:prodsim@localhost:5432/prodsim"
_DEFAULT_VALKEY_URL = "redis://localhost:6379/0"
_MIN_PROD_SECRET_LENGTH = 32
_PROD_REQUIRED = ("secret_key", "database_url", "valkey_url")
_PLACEHOLDER_SECRET = "change-me"  # noqa: S105


def _generate_secret() -> SecretStr:
    return SecretStr(secrets.token_hex(32))


class _MaskSecretSource(PydanticBaseSettingsSource):
    """Wraps a settings source so `secret_key` is a SecretStr before validation.

    Pydantic echoes the raw input in ValidationError messages; masking it here keeps the
    secret out of startup errors and logs.
    """

    def __init__(self, inner: PydanticBaseSettingsSource) -> None:
        super().__init__(inner.settings_cls)
        self._inner = inner

    def get_field_value(self, field: FieldInfo, field_name: str) -> tuple[Any, str, bool]:
        return self._inner.get_field_value(field, field_name)

    def __call__(self) -> dict[str, Any]:
        values = self._inner()
        secret = values.get("secret_key")
        if isinstance(secret, str):
            values["secret_key"] = SecretStr(secret)
        return values


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PRODSIM_", extra="ignore")

    environment: Literal["dev", "test", "prod"] = "dev"
    secret_key: SecretStr = Field(default_factory=_generate_secret)
    database_url: str = _DEFAULT_DATABASE_URL
    valkey_url: str = _DEFAULT_VALKEY_URL
    log_level: str = "INFO"
    cors_origins: list[str] = Field(default_factory=list)

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        sources = (init_settings, env_settings, dotenv_settings, file_secret_settings)
        return tuple(_MaskSecretSource(source) for source in sources)

    @model_validator(mode="after")
    def _validate_prod(self) -> Self:
        if self.environment != "prod":
            return self
        missing = [f for f in _PROD_REQUIRED if f not in self.model_fields_set]
        if missing:
            raise ValueError(f"required in prod: {', '.join(missing)}")
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
