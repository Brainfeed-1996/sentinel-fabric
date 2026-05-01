# Sentinel Fabric

![CI](https://github.com/Brainfeed-1996/sentinel-fabric/actions/workflows/ci.yml/badge.svg)

Security operations and exposure management control plane for modern engineering organizations.

Sentinel Fabric is a platform-oriented security project that unifies asset inventory, attack surface intelligence, evidence collection, posture analysis, graph reasoning, risk scoring, and remediation workflows into a single operator-focused system. It is designed as a high-signal demonstration of how to engineer security products with strong data models, extensible services, and pragmatic operational workflows.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [What this repository demonstrates](#what-this-repository-demonstrates)
- [Problem statement](#problem-statement)
- [Design goals](#design-goals)
- [Non-goals](#non-goals)
- [Platform architecture](#platform-architecture)
- [Domain model](#domain-model)
- [Core capabilities](#core-capabilities)
- [Operator workflows](#operator-workflows)
- [Risk model](#risk-model)
- [API and service boundaries](#api-and-service-boundaries)
- [Repository structure](#repository-structure)
- [Engineering trade-offs](#engineering-trade-offs)
- [Example deployment scenarios](#example-deployment-scenarios)
- [Security posture](#security-posture)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Why this belongs in a high-ROI portfolio](#why-this-belongs-in-a-high-roi-portfolio)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Why this exists

Security teams rarely suffer from a total lack of tools.

They suffer from too many tools with too little integration.

A typical environment may include:

- cloud asset discovery
- external attack surface management
- secret scanning
- CSPM and IaC checks
- vulnerability feeds
- issue trackers
- CMDB fragments
- spreadsheets and one-off scripts

The result is predictable:

- duplicated findings
- inconsistent asset identity
- poor prioritization
- weak evidence chains
- remediation work that does not map cleanly to actual ownership

Sentinel Fabric exists to model the security control plane as a cohesive engineering problem instead of a pile of scanners.

## What this repository demonstrates

This project is meant to show the kind of engineering judgment expected in strong infrastructure and security roles. It demonstrates:

- cybersecurity product architecture
- graph-oriented data modeling
- API and control-plane design
- backend service boundaries
- workflow-oriented operator tooling
- risk reasoning and prioritization logic
- observability and auditability considerations

It is intentionally broader than a narrow scanner. The point is to show system design depth.

## Problem statement

A serious exposure management platform needs to answer questions like:

- what assets do we actually have?
- how are they related?
- which findings matter most?
- what evidence supports those findings?
- who should own remediation?
- how do we prove the state changed after the fix?

These questions sound operational, but they are deeply technical. They require strong domain models, normalization logic, a policy engine, and an interface that helps operators reason under uncertainty.

## Design goals

### 1. Asset identity before everything else
If the system cannot reliably decide when two observations refer to the same asset, every downstream feature gets noisy.

### 2. Evidence-preserving ingestion
Raw observations should remain traceable even after normalization so analysts can audit how a finding was derived.

### 3. Graph-native reasoning
Security posture depends on relationships, not just individual records. Internet-facing status, credential exposure, ownership, network adjacency, and cloud role bindings all matter together.

### 4. Operator usefulness over vendor theater
The platform should optimize for helping a security engineer make decisions, not for generating impressive but low-signal dashboards.

### 5. Extensible control plane
Scanners, enrichers, policies, and remediation integrations should fit into explicit contracts.

## Non-goals

Sentinel Fabric is not trying to be:

- a full SIEM replacement
- an endpoint agent platform
- a narrow CVE-only scanner
- a ticketing system in disguise
- a compliance checklist generator with weak technical grounding

It sits in the space between asset intelligence, exposure management, posture reasoning, and operational follow-through.

## Platform architecture

```text
connectors / scanners / imports
             |
             v
      ingestion workers
             |
             v
  raw observations and evidence
             |
             v
 identity resolution + normalization
             |
    +--------+----------+----------------+
    |                   |                |
    v                   v                v
asset graph        policy engine    finding synthesis
    |                   |                |
    +---------+---------+----------------+
              |
              v
        risk scoring layer
              |
              v
      remediation workflows
              |
              v
        operator console + API
```

### Major subsystems

#### Ingestion layer
Consumes data from scanners, APIs, cloud inventories, code repositories, and custom connectors.

#### Identity and normalization layer
Maps heterogeneous observations into coherent domain entities such as services, hosts, domains, certificates, repositories, roles, and secrets.

#### Graph core
Stores relationships that matter for attack paths, ownership, exposure, and blast radius estimation.

#### Policy engine
Evaluates posture rules, invariants, and organization-specific guardrails.

#### Risk engine
Prioritizes findings using severity, exploitability, exposure context, ownership confidence, business criticality, and evidence freshness.

#### Workflow layer
Turns findings into actionable remediation paths instead of static alerts.

## Domain model

The platform is centered on a few critical entity types:

- **Asset**: a stable security-relevant object such as a host, service, domain, cloud resource, repo, or identity principal
- **Observation**: raw fact collected from a source at a specific time
- **Evidence**: supporting artifact explaining why an observation or finding exists
- **Finding**: synthesized security issue with severity, context, and status
- **Policy Result**: evaluation output for a rule or control
- **Relationship**: typed edge between entities, used for graph reasoning
- **Remediation Task**: operator-facing unit of work linked to findings and owners

This structure allows the system to distinguish between “what was seen”, “what the platform believes”, and “what should happen next”.

## Core capabilities

- unified asset inventory across disparate sources
- attack surface mapping and external exposure reasoning
- secret and credential exposure scanning model
- misconfiguration analysis and policy checks
- graph-based relationship traversal
- severity and context aware risk scoring
- remediation workflow generation and lifecycle tracking
- evidence collection for analyst trust and auditability
- plugin SDK for scanners, enrichers, and export targets

## Operator workflows

A strong security platform is only as good as its operating model.

Sentinel Fabric is structured around practical operator questions such as:

### Triage
Which new findings appeared today, which ones are duplicates, and which ones are actually urgent?

### Attribution
Who owns this affected asset or code path?

### Validation
What evidence supports the finding? Is it fresh? Was it derived from multiple sources?

### Prioritization
Does this issue affect an internet-facing asset, privileged identity, or crown-jewel service?

### Remediation
What should be fixed first, and how can that work be tracked cleanly?

### Verification
Was the issue truly resolved, or did the platform merely stop observing it?

See `docs/operator-workflows.md` for more detail.

## Risk model

Sentinel Fabric is designed around context-aware prioritization rather than naive severity ordering.

Inputs to risk scoring may include:

- raw issue severity
- exposure path and public reachability
- asset criticality
- privilege level
- evidence confidence
- ownership confidence
- exploit preconditions
- recurrence history
- freshness and staleness windows

This is important because a “medium” severity issue on an internet-facing privileged component may deserve more urgency than an isolated “high” severity issue in a dead environment.

## API and service boundaries

The API surface is intended to support:

- asset and finding queries
- evidence retrieval
- workflow actions
- policy inspection
- connector registration
- health and readiness inspection

The project separates concerns between:

- public control-plane API
- background workers
- graph and policy packages
- web operator interface
- SDK contracts for integration points

## Repository structure

```text
sentinel-fabric/
  apps/
    api/                   # control-plane API
    web/                   # operator console
    worker/                # ingestion and background processing
  packages/
    sdk/                   # extension contracts for scanners/enrichers
    policy-engine/         # posture and rule evaluation primitives
    graph-core/            # entity and relationship model
  docs/
```

## Engineering trade-offs

### Control plane over all-in-one binary
This keeps the domain modular and easier to evolve as the platform grows.

### Opinionated domain model
A generic blob store would be easier to start, but much harder to reason with.

### Graph reasoning as a core primitive
This adds complexity, but it is the right abstraction for security context.

### Evidence retention
Retaining provenance may cost more in storage, but dramatically improves analyst trust.

## Example deployment scenarios

### 1. Startup security team building its first real asset inventory
Sentinel Fabric can unify cloud resources, DNS assets, repositories, and secret exposures into one operational model.

### 2. Mid-size SaaS company trying to cut alert fatigue
Risk scoring and deduplication logic help reduce noise and focus on exploitable exposures.

### 3. Platform team building internal security tooling
The repository can serve as a reference architecture for a control plane that integrates with existing scanners rather than replacing them.

## Security posture

Because this project handles sensitive inventory and security findings, the architecture assumes:

- role-aware access control
- careful evidence handling
- explicit audit trails
- controlled integration boundaries
- separation between collection and presentation layers

See `docs/threat-model.md` and `SECURITY.md`.

## Documentation

- `docs/architecture.md`
- `docs/threat-model.md`
- `docs/design-decisions.md`
- `docs/adr-001-control-plane-monorepo.md`
- `docs/adr-002-asset-finding-model.md`
- `docs/operator-workflows.md`
- `docs/api.md`
- `docs/faq.md`
- `docs/ui-notes.md`
- `docs/roadmap.md`

Subpackage and app docs:

- `apps/api/README.md`
- `apps/web/README.md`
- `apps/worker/README.md`
- `packages/sdk/README.md`
- `packages/policy-engine/README.md`
- `packages/graph-core/README.md`

## Roadmap

### Near term

- enrich core asset and finding schemas
- implement persistence beyond initial local development modes
- improve policy evaluation contracts and rule packs
- support richer workflow state transitions
- connect the web UI to more live API data

### Mid term

- attack path and blast radius modeling
- tenant-aware authorization boundaries
- risk explanation engine for analyst trust
- integration packs for common cloud and SCM providers
- SLA-aware remediation orchestration

### Long term

- continuous exposure drift detection
- recommendation engine for remediation sequencing
- evidence snapshots for governance reviews
- simulation-based prioritization using graph traversal heuristics

## Why this belongs in a high-ROI portfolio

Sentinel Fabric stands out because it signals maturity across several hard dimensions at once:

- security domain understanding
- distributed systems thinking
- strong data modeling
- product architecture taste
- ability to design tools for real operators

This is the kind of repository that helps recruiters and senior interviewers quickly see principal-level potential, especially for roles in security engineering, infrastructure, cloud platforms, and developer tooling.

## Security

See `SECURITY.md`.

## Contributing

See `CONTRIBUTING.md`.

## License

Apache-2.0
