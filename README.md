# Sentinel Fabric

![CI](https://github.com/Brainfeed-1996/sentinel-fabric/actions/workflows/ci.yml/badge.svg)

Security operations and exposure management platform for modern engineering teams.

Sentinel Fabric is a security control plane that unifies asset inventory, attack surface mapping, secret exposure scanning, misconfiguration analysis, risk scoring, and remediation workflows into one opinionated platform.

## Why this project matters

Security teams often drown in fragmented tooling, partial visibility, and noisy findings. Sentinel Fabric is designed to reduce that fragmentation by combining visibility, graph-based reasoning, policy analysis, and operator workflows in a single extensible system.

This project is meant to demonstrate deep engineering across:

- cybersecurity
- backend systems
- distributed services
- data modeling
- developer platform design
- observability
- product architecture

## Current status

Early flagship build phase with:

- initial control-plane API
- first SDK primitives
- operator console mock connected to local API
- ADRs and architecture docs
- CI and contribution templates

## Architecture at a glance

```text
connectors and scanners
        |
        v
 ingestion workers
        |
        v
 assets, findings, evidence
        |
        +--> policy evaluation
        |
        +--> graph reasoning
        |
        v
 remediation workflows
        |
        v
 operator console
```

## Core capabilities

- unified asset inventory
- attack surface graph
- secret and credential exposure scanning
- configuration posture analysis
- risk scoring and prioritization
- remediation workflow engine
- evidence collection and audit trails
- plugin SDK for scanners and enrichers

## Repository structure

```text
sentinel-fabric/
  apps/
    api/
    web/
    worker/
  packages/
    sdk/
    policy-engine/
    graph-core/
  docs/
```

## Demo surfaces

- API health and overview endpoints under `apps/api`
- static operator console mock under `apps/web/index.html`

## Documentation

- docs/architecture.md
- docs/threat-model.md
- docs/design-decisions.md
- docs/adr-001-control-plane-monorepo.md
- docs/adr-002-asset-finding-model.md
- docs/operator-workflows.md
- docs/api.md
- docs/roadmap.md

## Roadmap

### Near term

- connect the UI to richer live API data
- add richer domain models and persistence
- implement policy evaluation skeleton
- expand scanner and enricher SDK contracts

### Mid term

- graph-based attack path modeling
- multi-tenant access control
- workflow-based remediation lifecycle
- benchmarks and sample datasets

## Security

See SECURITY.md.

## Contributing

See CONTRIBUTING.md.

## License

Apache-2.0
