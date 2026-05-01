# ADR-001: Use a monorepo for the initial Sentinel Fabric build

## Status
Accepted

## Context

Sentinel Fabric is intended to evolve into a multi-surface platform with API, web console, workers, shared domain packages, and extension points.

## Decision

Use a monorepo in the early phases to keep domain contracts, architecture documents, shared packages, and service boundaries visible while the system model is still moving.

## Consequences

### Positive

- easier cross-package refactoring
- clearer shared domain vocabulary
- simpler coordinated evolution of API, workers, and SDK

### Negative

- requires discipline to avoid accidental coupling
- may need repo decomposition later if team scale grows
