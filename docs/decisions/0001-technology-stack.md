# 0001 — Technology stack

- Status: Proposed
- Date: 2026-10-16
- Method: every candidate looked up and its current docs fetched via Context7
  (library IDs listed). Licenses are verified in CI (see "Consequences").

## Context

ProdSim is a self-hosted industrial simulation, scheduling, optimization and shop-floor
analytics platform: Next.js frontend + FastAPI backend in Docker, built with compose,
multi-user, on-prem friendly. The product is dual-licensed (PolyForm Noncommercial +
commercial), so shipped dependencies must be permissive or weak-copyleft used unmodified;
no GPL/AGPL in the shipped product.

## Decision

### Backend

| Concern | Choice | Rejected (Context7 IDs consulted) | Why |
|---|---|---|---|
| ORM / migrations | SQLAlchemy 2.0 async + Alembic, asyncpg driver (`/websites/sqlalchemy_en_20`, `/websites/alembic_sqlalchemy`) | SQLModel `/websites/sqlmodel_tiangolo` (0.0.x), Tortoise `/tortoise/tortoise-orm` | Mature async support, async Alembic env; asyncpg avoids LGPL psycopg |
| Database + time series | PostgreSQL 17 + TimescaleDB (`/timescale/timescaledb`) | InfluxDB 3 `/websites/influxdata_influxdb3`, QuestDB `/websites/questdb` | One DB, one backup, JOIN telemetry with master data |
| Job queue | Celery 5.6 (`/celery/celery`) on **Valkey** | Dramatiq `/bogdanp/dramatiq` (LGPL), arq `/python-arq/arq`, Taskiq, Hatchet `/websites/hatchet_run` | Progress (`update_state`), hard cancel (`revoke(terminate=True)`), prefork for CPU-bound sim/solver |
| Realtime push | SSE via sse-starlette (`/sysid/sse-starlette`) + Valkey pub/sub (`/redis/redis-py`) | WebSockets (kept for future collaborative editing) | One-way, cookie auth, auto-reconnect, proxy-friendly |
| Simulation | SimPy 4 (`/websites/simpy_readthedocs_io_en`) | salabim `/salabim/salabim` | Small, stable, interrupts for breakdowns; headless |
| Optimization | OR-Tools CP-SAT (`/google/or-tools`) + highspy (MIT) for LP/MIP | Pyomo `/pyomo/pyomo`, Timefold (JVM only) | Native interval/no-overlap scheduling, progress callbacks |
| Auth | pwdlib[argon2], pyotp, Authlib (OIDC: Entra ID, Keycloak, ADFS), ldap3; server-side sessions; custom RBAC tables | MSAL, pycasbin `/apache/casbin-pycasbin` | Generic OIDC covers Entra + on-prem IdPs; revocable, auditable sessions |
| Connectors | asyncua, aiomqtt (+ protobuf Sparkplug B), aiokafka, pymodbus, polars (calamine) + openpyxl | paho direct, confluent-kafka, pandas-first | asyncio-native; polars fast for big CSV/XLSX |
| ML | MLflow 3 (tracking + registry on Postgres), scikit-learn, optional PyTorch, ONNX Runtime | DVC, lakeFS | App-managed datasets: immutable snapshots + content hash |
| LLM providers | pydantic-ai 2 (`/pydantic/pydantic-ai`) | LiteLLM `/websites/litellm_ai`, direct SDKs | Typed outputs; OpenAI, Anthropic, Azure, Bedrock, OpenAI-compatible (Ollama/vLLM) |
| Tooling | uv, ruff, pyright (strict), pytest + pytest-asyncio + httpx ASGITransport + testcontainers | mypy, ty (0.0.x) | Fast, standard |
| Observability | structlog JSON, OpenTelemetry (OTLP, opt-in), prometheus_client | — | On-prem friendly, customer-owned collectors |

### Frontend

| Concern | Choice | Rejected | Why |
|---|---|---|---|
| Framework | Next.js 16 App Router, React 19.2, `output: "standalone"` (`/vercel/next.js`) | — | Small Docker image, RSC |
| UI kit | shadcn/ui + Tailwind v4 (`/shadcn-ui/ui`) | Mantine (runner-up), MUI (commercial grid features) | Own the components; dense industrial theme |
| Process editor | @xyflow/react 12 (`/xyflow/xyflow`) | Rete.js | Standard for custom-node editors |
| Charts | Apache ECharts (`/apache/echarts-doc`); uPlot for dense live trends | Recharts (SVG, slow beyond ~10k points), visx | Canvas, incremental data, LTTB sampling |
| State / forms / tables | TanStack Query 5, Zustand 5, react-hook-form + Zod 4, TanStack Table 8 + Virtual | — | Standard, well documented |
| API client | openapi-typescript + openapi-fetch + openapi-react-query | Orval, Hey API | Types only, minimal runtime |
| Testing | Vitest, Testing Library, MSW 2, Playwright | — | Typed mocks from the same OpenAPI types |
| i18n | next-intl 4, locale from user profile (DE/EN) | — | First-class App Router support |

## Consequences / risks

1. **Valkey instead of Redis** (Redis 7.4+ is RSAL/SSPL/AGPL). Wire-compatible.
2. **TimescaleDB TSL features** (compression, continuous aggregates) may be bundled but
   not offered as a hosted DB service; confirm with counsel or use the Apache-only image.
3. **LGPL deps** (asyncua, ldap3) used unmodified and not vendored; license texts shipped.
4. **Do not bundle AGPL infrastructure** (MinIO, Grafana, Redis 8). Artifact store =
   local volume or customer-provided S3.
5. Use plain `highspy` only, never `highspy-extras`.
6. Sparkplug B implemented from the Tahu `.proto` (EPL-2.0; review generated code).
7. Job cancellation: cooperative checkpoints first (flag checked in SimPy/CP-SAT
   callbacks), `terminate` as fallback; `worker_prefetch_multiplier=1`, `acks_late`.
8. Pin fast-moving deps (pydantic-ai 2, openapi-fetch 0.x); Renovate for updates.
9. CI license gate: `pip-licenses --fail-on="GPL;AGPL"` and `license-checker --failOn GPL`
   (with explicit allowlist for reviewed LGPL packages).
