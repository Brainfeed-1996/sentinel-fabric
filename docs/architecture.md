# Architecture

## Overview

Sentinel Fabric is designed as a modular security control plane.

### Architectural goals

- unify fragmented security telemetry and asset knowledge
- preserve explainability of findings and risk scores
- support multi-tenancy and strong isolation boundaries
- allow incremental adoption through plugins and connectors
- keep operator workflows auditable and automatable

## Main components

### API service
Responsible for public APIs, authentication hooks, authorization checks, and orchestration entrypoints.

### Ingestion workers
Collect assets, findings, metadata, and scan outputs from external systems and internal scanners.

### Correlation engine
Normalize incoming evidence and merge related records into coherent entities and findings.

### Graph core
Build and query relationships between assets, identities, secrets, exposures, and control failures.

### Policy engine
Evaluate posture and risk policies against assets and graph-derived context.

### Workflow engine
Drive remediation, approvals, ticketing, and response actions.

## Trust boundaries

- tenant boundary
- control plane versus worker execution boundary
- connector boundary for third-party integrations
- privileged remediation boundary

## Initial data model

- organization
- tenant
- asset
- identity
- secret
- exposure
- finding
- policy
- remediation action
- evidence artifact

## Non-goals for MVP

- full SIEM replacement
- endpoint detection agent
- proprietary threat intelligence feed network
