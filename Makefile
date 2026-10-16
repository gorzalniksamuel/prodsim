COMPOSE_DIR := deploy/compose
COMPOSE     := docker compose -f $(COMPOSE_DIR)/compose.yaml
COMPOSE_DEV := $(COMPOSE) -f $(COMPOSE_DIR)/compose.dev.yaml

.PHONY: up down logs dev test lint e2e smoke api-generate env

env:
	@./scripts/ensure-env.sh

## Build and start the full stack; web on http://localhost:3000
up: env
	$(COMPOSE) up -d --build --wait --wait-timeout 300

## Stop the stack and remove its volumes
down:
	$(COMPOSE_DEV) down -v --remove-orphans

logs:
	$(COMPOSE) logs -f --tail=100

## Like `up`, but also publishes api:8000, db:5432 and valkey:6379 on localhost
dev: env
	$(COMPOSE_DEV) up -d --build --wait --wait-timeout 300

test:
	cd backend && uv run pytest
	cd apps/web && npm test

lint:
	cd backend && uv run ruff check . && uv run ruff format --check . && uv run pyright
	cd apps/web && npm run lint && npm run typecheck

## Playwright against a running stack (run `make up` first); override with E2E_BASE_URL
e2e:
	cd apps/web && { [ -d node_modules ] || npm ci; } && npx playwright install chromium && npm run e2e

## Build, start, and assert the stack is healthy. `make smoke SMOKE_TEARDOWN=1` tears down after.
smoke:
	./scripts/smoke.sh

api-generate:
	cd apps/web && npm run api:generate
