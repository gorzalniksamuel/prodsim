# ProdSim

ProdSim is a self-hostable platform for industrial process simulation, production
scheduling and shop-floor analytics. You build a living model of your production
(machines, lines, products, variants, materials, people, shifts), feed it with your own
data from wherever it lives, and use it to:

- **simulate** "what if" questions (new orders, a new machine, an extra shift, breakdowns),
- **optimize and schedule** production under real constraints,
- **monitor** the shop floor (OEE, downtimes and reasons, part and batch tracking),
- **learn** from the data (datasets, training, bring-your-own models),
- **report and explain** results, with AI from any provider you trust.

The guiding promise: there is no reason anybody can't use their data or their model.
Every input path (files, databases, streams, machines, MES) and every AI backend (cloud
or on-prem) is meant to be pluggable.

> Status: early development. Nothing here is released yet.

## License: source-available, not open source

ProdSim is **source-available**. It is not OSI-approved open source.

- The code is licensed under the
  [PolyForm Noncommercial License 1.0.0](LICENSE): free to use, modify and contribute to
  for non-commercial purposes (personal, research, education, non-profits, evaluation).
- Any commercial use requires a paid license. See
  [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).
- Contributions require agreeing to the [CLA](CLA.md), so the project can keep offering
  both licenses.

## Quick start

Requires Docker with Compose and `make`.

```bash
cp deploy/compose/.env.example deploy/compose/.env && make up
```

## Architecture

```
          ┌──────────────┐        ┌──────────────────────────────┐
browser ─▶│  web         │──API──▶│  api (FastAPI)                │
          │  Next.js     │◀─WS/SSE│  REST + realtime + auth       │
          └──────────────┘        └──────┬──────────────┬─────────┘
                                         │              │ enqueue / events
                                  ┌──────▼─────┐  ┌─────▼─────┐
                                  │ postgres   │  │ broker /  │
                                  │ (+ time-   │  │ cache     │
                                  │  series)   │  └─────┬─────┘
                                  └──────▲─────┘        │
                                         │       ┌──────▼───────────────┐
                                         ├───────│ worker(s)            │ sim / opt / ML / reports
                                         │       └──────────────────────┘
                                         │       ┌──────────────────────┐
                                         └───────│ connector-runner(s)  │ OPC UA, MQTT, Kafka, polling…
                                                 └──────────────────────┘
          optional profiles: model registry/tracking, object storage (S3-compatible),
          local LLM runtime, OpenTelemetry collector + Prometheus/Grafana
```

The backend is a modular monolith: one Python package and image, started in different
roles (`api`, `worker`, `connector-runner`, `scheduler`). The web app talks only to the
public API. Technology choices are recorded in
[docs/decisions/0001-technology-stack.md](docs/decisions/0001-technology-stack.md).

## Roadmap

Each epic is delivered as its own spec, plan and build. **v0.1 = E0, E1, E2, E3, E5.**

- **E0 Foundation and repo**: monorepo, licenses, skeletons, compose stack, CI.
- **E1 Identity, roles, audit**: local login, 2FA, roles and permissions, audit log.
- **E2 Jobs, logs, notifications**: job queue and workers, job overview, notifications.
- **E3 Plant and process modeling**: resources, products, routings, visual process editor, versioning.
- **E4 Data connectors and ingestion**: files, databases, streams, OPC UA, plugin SDK.
- **E5 Simulation engine**: discrete-event simulation, KPIs, scenarios, calibration.
- **E6 Optimization and scheduling (APS)**: finite-capacity scheduling, Gantt, re-scheduling.
- **E7 Shop-floor monitoring**: machine states, OEE, downtime capture, batch tracking.
- **E8 Datasets, ML and bring-your-own models**: dataset builder, training, model registry.
- **E9 AI assistant and reporting**: provider-agnostic LLMs, report builder, AI evaluation.
- **E10 MES / ERP integration**: connector profiles and a custom interface designer.
- **E11 Business use-case packs**: capable-to-promise, OEE intelligence, traceability and more.
- **E12 Hardening and ops**: backup/restore, upgrades, HA notes, load and security review.

## Links

- [Contributing](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Commercial license](COMMERCIAL-LICENSE.md) and [CLA](CLA.md)
- Repository: https://github.com/gorzalniksamuel/prodsim
