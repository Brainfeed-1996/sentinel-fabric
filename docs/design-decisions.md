# Design Decisions

## Why a control plane model

A control plane architecture makes it easier to separate orchestration, policy, visibility, and execution concerns.

## Why graph-based reasoning

Security posture is relational. Attack paths, trust chains, credential exposure, blast radius, and policy exceptions become much easier to reason about as relationships rather than isolated rows.

## Why plugin extensibility matters

No security platform covers every environment. Connectors, scanners, enrichers, and actions need stable extension points.

## Why auditability is first-class

Security tooling is often used to justify action under uncertainty. Operators need to see what was found, why it matters, how a score was produced, and what triggered an action.
