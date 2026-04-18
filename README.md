# Sentinel Fabric

![Sentinel Fabric](https://img.shields.io/badge/Sentinel-Fabric-v0.1.0-brightgreen)
![License](https://img.shields.io/badge/License-Apache--2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Security](https://img.shields.io/badge/Security-Platform-red)

<p align="center">
  <img src="https://img.shields.io/badge/Security-Operations-ff6b6b?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Exposure-Management-4ecdc4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Control-Plane-45b7d1?style=for-the-badge" />
</p>

---

## Overview

**Sentinel Fabric** is a production-grade security operations and exposure management platform designed for modern engineering teams. It unifies asset inventory, attack surface mapping, secret exposure scanning, misconfiguration analysis, risk scoring, and remediation workflows into one extensible, opinionated system.

This project demonstrates enterprise-grade software engineering across cybersecurity, distributed systems, backend architecture, data modeling, developer tooling, observability, and product design.

## Why Sentinel Fabric?

Security teams often drown in fragmented tooling, partial visibility, and noisy findings. Sentinel Fabric addresses these challenges by combining:

- **Unified Visibility**: Single pane of glass for all security assets and findings
- **Graph-Based Reasoning**: Attack path modeling and relationship analysis
- **Policy Engine**: Configurable security policies with enforcement
- **Workflow Automation**: Remediation tracking and audit trails
- **Extensibility**: Plugin SDK for custom scanners and enrichers

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Sentinel Fabric                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Connectors  │───▶│   Workers    │───▶│    API       │      │
│  │  & Scanners  │    │  (Ingestion) │    │   Server     │      │
│  └──────────────┘    └──────────────┘    └──────┬───────┘      │
│                                                 │              │
│  ┌──────────────┐    ┌──────────────┐          │              │
│  │   Policy     │◀───│    Graph     │◀─────────┤              │
│  │   Engine     │    │    Core      │          │              │
│  └──────────────┘    └──────────────┘          │              │
│                                                 ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Remediation│    │   Operator   │◀───│     UI       │      │
│  │   Workflows  │    │   Console    │    │  Dashboard   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Capabilities

| Capability | Description |
|------------|-------------|
| **Asset Inventory** | Unified tracking of repositories, buckets, databases, APIs, containers, and functions |
| **Attack Surface Mapping** | Graph-based relationship modeling and exposure analysis |
| **Secret Scanning** | Detection of exposed credentials, API keys, and secrets in code history |
| **Configuration Analysis** | Security posture assessment for cloud resources and infrastructure |
| **Risk Scoring** | CVSS-based prioritization with business context awareness |
| **Remediation Workflows** | Tracking, assignment, and verification of security fixes |
| **Policy Engine** | Configurable security rules with automated enforcement |
| **Audit Trails** | Complete logging of all security operations and changes |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Brainfeed-1996/sentinel-fabric.git
cd sentinel-fabric

# Install dependencies
npm install

# Start the API server
cd apps/api && npm run dev

# In another terminal, serve the UI
cd apps/web && npx serve .
```

The API will be available at `http://localhost:8080` and the UI at `http://localhost:3000`.

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |

### Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/assets` | List all assets (paginated) |
| GET | `/api/v1/assets/:id` | Get asset details |
| GET | `/api/v1/overview` | Dashboard overview |

### Findings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/findings` | List all findings |
| GET | `/api/v1/findings/:id` | Get finding details |
| PATCH | `/api/v1/findings/:id` | Update finding status |

### Scans & Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/scans` | List scan history |
| POST | `/api/v1/scans/run` | Initiate new scan |
| GET | `/api/v1/policies` | List policies |
| GET | `/api/v1/metrics` | Security metrics |

### Advanced

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/attack-surface` | Attack surface analysis |
| GET | `/api/v1/graph` | Asset relationship graph |
| GET | `/api/v1/timeline` | Event timeline |
| GET | `/api/v1/audit-log` | Audit log entries |

## Project Structure

```
sentinel-fabric/
├── apps/
│   ├── api/              # REST API server
│   │   └── src/
│   │       └── server.js
│   ├── web/              # Operator console UI
│   │   ├── index.html
│   │   └── app.js
│   └── worker/           # Background workers
├── packages/
│   ├── sdk/              # Scanner & enricher SDK
│   ├── policy-engine/    # Policy evaluation
│   └── graph-core/       # Graph database core
├── docs/
│   ├── architecture.md   # System architecture
│   ├── threat-model.md  # Threat modeling
│   ├── design-decisions.md
│   ├── api.md           # API reference
│   ├── adr-001-*.md     # Architecture decision records
│   └── *.md             # Additional documentation
├── package.json         # Root workspace config
├── CONTRIBUTING.md      # Contribution guidelines
├── SECURITY.md         # Security policy
└── LICENSE             # Apache 2.0
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 18+ (ES Modules) |
| **API** | Native HTTP server |
| **UI** | Vanilla HTML/CSS/JS |
| **Data** | In-memory (MVP) |
| **Testing** | Jest (planned) |
| **CI/CD** | GitHub Actions |

## Configuration

Environment variables for the API:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8080 | HTTP server port |
| NODE_ENV | development | Runtime environment |
| LOG_LEVEL | info | Logging verbosity |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md).

## Roadmap

### Near Term (v0.2.0)
- [ ] Connect UI to live API data
- [ ] Add domain models and persistence
- [ ] Implement policy evaluation skeleton
- [ ] Expand scanner/enricher SDK

### Mid Term (v0.3.0)
- [ ] Graph-based attack path modeling
- [ ] Multi-tenant access control
- [ ] Workflow-based remediation lifecycle

### Long Term (v1.0)
- [ ] Distributed architecture
- [ ] Plugin marketplace
- [ ] Enterprise features

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ for security engineers</strong>
</p>