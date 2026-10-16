# syntax=docker/dockerfile:1
FROM ghcr.io/astral-sh/uv:0.11 AS uv

FROM python:3.14-slim AS builder
COPY --from=uv /uv /uvx /bin/
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
WORKDIR /app
# Dependencies first (cached unless the lockfile changes), then the project itself.
COPY pyproject.toml uv.lock README.md ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project
COPY src ./src
COPY alembic ./alembic
COPY alembic.ini ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-editable

FROM python:3.14-slim AS runtime
RUN groupadd --system --gid 10001 prodsim \
    && useradd --system --uid 10001 --gid prodsim --home-dir /app --shell /usr/sbin/nologin prodsim
WORKDIR /app
# Application files stay root-owned: the runtime user cannot modify code.
COPY --from=builder /app /app
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
USER 10001:10001
EXPOSE 8000
# Overridden per compose service: worker (celery) and migrate (alembic upgrade head).
CMD ["uvicorn", "prodsim.api.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
