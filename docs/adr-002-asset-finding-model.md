# ADR-002: Model assets and findings as separate first-class entities

## Status
Accepted

## Context

Security platforms often collapse assets, exposures, and findings into one noisy record model. That harms explainability, deduplication, and lifecycle tracking.

## Decision

Treat assets as stable entities and findings as time-varying analytical outputs attached to assets and evidence.

## Consequences

### Positive

- better lifecycle semantics
- cleaner deduplication and evidence handling
- easier graph projection and scoring

### Negative

- requires more explicit joins and relationships
- slightly more domain complexity in the MVP
