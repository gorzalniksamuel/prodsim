import pytest
from pydantic import ValidationError

from prodsim.core.config import Settings, get_settings

PROD_OK = {
    "PRODSIM_ENVIRONMENT": "prod",
    "PRODSIM_SECRET_KEY": "s" * 32,
    "PRODSIM_DATABASE_URL": "postgresql+asyncpg://u:p@db:5432/prodsim",
    "PRODSIM_VALKEY_URL": "redis://valkey:6379/0",
}


@pytest.fixture(autouse=True)
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in list(PROD_OK) + ["PRODSIM_CORS_ORIGINS"]:
        monkeypatch.delenv(key, raising=False)
    get_settings.cache_clear()


def set_prod(monkeypatch: pytest.MonkeyPatch, **overrides: str | None) -> None:
    for key, value in {**PROD_OK, **overrides}.items():
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)


def test_prod_requires_secret_key(monkeypatch: pytest.MonkeyPatch) -> None:
    set_prod(monkeypatch, PRODSIM_SECRET_KEY=None)
    with pytest.raises(ValidationError, match="secret_key"):
        Settings()


def test_prod_rejects_short_secret_key(monkeypatch: pytest.MonkeyPatch) -> None:
    set_prod(monkeypatch, PRODSIM_SECRET_KEY="s" * 31)
    with pytest.raises(ValidationError, match="secret_key"):
        Settings()


@pytest.mark.parametrize("placeholder", ["change-me", "CHANGE-ME", "Change-Me"])
def test_prod_rejects_placeholder_secret_key(
    monkeypatch: pytest.MonkeyPatch, placeholder: str
) -> None:
    set_prod(monkeypatch, PRODSIM_SECRET_KEY=placeholder)
    with pytest.raises(ValidationError, match="secret_key"):
        Settings()


def test_prod_accepts_valid_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    set_prod(monkeypatch)
    settings = Settings()
    assert settings.environment == "prod"
    assert settings.secret_key.get_secret_value() == "s" * 32


def test_prod_requires_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    set_prod(monkeypatch, PRODSIM_DATABASE_URL=None)
    with pytest.raises(ValidationError, match="database_url"):
        Settings()


def test_prod_requires_valkey_url(monkeypatch: pytest.MonkeyPatch) -> None:
    set_prod(monkeypatch, PRODSIM_VALKEY_URL=None)
    with pytest.raises(ValidationError, match="valkey_url"):
        Settings()


def test_dev_generates_secret_key() -> None:
    settings = Settings()
    assert len(settings.secret_key.get_secret_value()) >= 32


def test_dev_generated_secret_keys_differ() -> None:
    assert Settings().secret_key != Settings().secret_key


def test_dev_defaults() -> None:
    settings = Settings()
    assert settings.environment == "dev"
    assert settings.database_url == "postgresql+asyncpg://prodsim:prodsim@localhost:5432/prodsim"
    assert settings.valkey_url == "redis://localhost:6379/0"
    assert settings.log_level == "INFO"
    assert settings.cors_origins == []


def test_env_overrides_with_prefix(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PRODSIM_ENVIRONMENT", "test")
    monkeypatch.setenv("PRODSIM_CORS_ORIGINS", '["http://localhost:3000"]')
    settings = Settings()
    assert settings.environment == "test"
    assert settings.cors_origins == ["http://localhost:3000"]


def test_get_settings_is_cached() -> None:
    assert get_settings() is get_settings()
