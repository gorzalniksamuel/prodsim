# Contributing to ProdSim

Thanks for your interest. ProdSim is source-available under the
[PolyForm Noncommercial License 1.0.0](LICENSE); contributions are welcome.

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Contributor License Agreement

All contributions require agreeing to the [CLA](CLA.md), which lets the project keep
offering a commercial license alongside the noncommercial one. On your first pull
request, an automated check asks you to sign by posting a comment.

## Development setup

Requirements: Docker with Compose, `make`, Python 3.13+ and Node 24+ for local tooling.

```bash
git clone https://github.com/gorzalniksamuel/prodsim.git
cd prodsim
make dev
```

`make dev` starts the stack with the `dev` profile (hot reload, seed data). See the
[README](README.md) for the quick start.

## Test-driven development is required

Write a failing test first, watch it fail for the expected reason, then write the
minimum code to make it pass. Pull requests that add behavior without tests will be
asked to add them. Run the test suites and linters before pushing.

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/), for example:

```
feat(api): add health endpoint
fix(web): correct locale fallback
docs: clarify quick start
```

Keep commits focused and pull requests small enough to review.

## Connectors and plugins

ProdSim is built around pluggable connectors (data sources) and plugins. The plugin
SDK and its guide will be published under `docs/` together with the data connector
epic (E4); a link will be added here when it exists.

## Reporting bugs and security issues

Use the issue templates for bugs and feature requests. For security problems, follow
[SECURITY.md](SECURITY.md) and do not open a public issue.
