# Sentinel Fabric API Reference

## Base URL

```
http://localhost:8080
```

## Content Type

All requests and responses use JSON format.

```http
Content-Type: application/json
```

---

## Endpoints

### Health Check

**GET** `/health`

Returns the health status of the API service.

**Response:**

```json
{
  "status": "healthy",
  "service": "sentinel-fabric-api",
  "version": "0.1.0",
  "uptime": 1234.56
}
```

---

### Overview

**GET** `/api/v1/overview`

Returns a summary of the security posture for the dashboard.

**Response:**

```json
{
  "totalAssets": 6,
  "totalFindings": 6,
  "severities": {
    "critical": 2,
    "high": 2,
    "medium": 2,
    "low": 0
  },
  "statuses": {
    "open": 3,
    "triage": 2,
    "resolved": 1
  },
  "recentScans": 3,
  "activePolicies": 3
}
```

---

### Assets

**GET** `/api/v1/assets`

Returns a paginated list of assets.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page |
| type | string | - | Filter by asset type |
| criticality | string | - | Filter by criticality level |
| owner | string | - | Filter by owner |

**Response:**

```json
{
  "data": [
    {
      "id": "asset-001",
      "type": "repository",
      "name": "service-a",
      "owner": "platform-team",
      "criticality": "high",
      "tags": ["production", "customer-facing"],
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 6,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**GET** `/api/v1/assets/:id`

Returns detailed information about a specific asset.

**Response:**

```json
{
  "id": "asset-001",
  "type": "repository",
  "name": "service-a",
  "owner": "platform-team",
  "criticality": "high",
  "tags": ["production", "customer-facing"],
  "createdAt": "2026-01-15T10:00:00Z",
  "findings": [
    {
      "id": "finding-001",
      "title": "Exposed credential in repository history",
      "severity": "high"
    }
  ]
}
```

---

### Findings

**GET** `/api/v1/findings`

Returns a paginated list of findings.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page |
| severity | string | - | Filter by severity |
| status | string | - | Filter by status |
| assetId | string | - | Filter by asset |

**Response:**

```json
{
  "data": [
    {
      "id": "finding-001",
      "title": "Exposed credential in repository history",
      "severity": "high",
      "assetId": "asset-001",
      "status": "open",
      "cvss": 7.5,
      "cve": null,
      "description": "AWS_ACCESS_KEY detected in git commit history",
      "createdAt": "2026-04-15T09:30:00Z",
      "assignee": "security-team"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 6,
    "totalPages": 1
  }
}
```

**GET** `/api/v1/findings/:id`

Returns detailed information about a specific finding.

**PATCH** `/api/v1/findings/:id`

Updates a finding.

**Request Body:**

```json
{
  "status": "resolved",
  "assignee": "analyst1@sentinel.local",
  "notes": "Fixed by rotating credentials"
}
```

**Response:**

```json
{
  "id": "finding-001",
  "title": "Exposed credential in repository history",
  "severity": "high",
  "status": "resolved",
  "assignee": "analyst1@sentinel.local",
  "notes": "Fixed by rotating credentials"
}
```

---

### Scans

**GET** `/api/v1/scans`

Returns the history of all scans.

**Response:**

```json
[
  {
    "id": "scan-001",
    "type": "secret",
    "status": "completed",
    "assetsScanned": 6,
    "findings": 3,
    "startedAt": "2026-04-18T08:00:00Z",
    "completedAt": "2026-04-18T08:45:00Z"
  }
]
```

**GET** `/api/v1/scans/:id`

Returns details of a specific scan.

**POST** `/api/v1/scans/run`

Initiates a new scan.

**Request Body:**

```json
{
  "type": "full"
}
```

**Response:**

```json
{
  "id": "scan-004",
  "type": "full",
  "status": "running",
  "assetsScanned": 0,
  "findings": 0,
  "startedAt": "2026-04-18T17:00:00Z",
  "completedAt": null
}
```

---

### Policies

**GET** `/api/v1/policies`

Returns all security policies.

**Response:**

```json
[
  {
    "id": "policy-001",
    "name": "S3 Public Access",
    "description": "Block public S3 buckets",
    "severity": "critical",
    "status": "enabled",
    "lastRun": "2026-04-18T12:00:00Z"
  }
]
```

---

### Metrics

**GET** `/api/v1/metrics`

Returns various security metrics.

**Response:**

```json
{
  "assetTypes": {
    "repository": 1,
    "bucket": 1,
    "database": 1,
    "api": 1,
    "container": 1,
    "function": 1
  },
  "severityBreakdown": {
    "critical": 2,
    "high": 2,
    "medium": 2
  },
  "statusBreakdown": {
    "open": 3,
    "triage": 2,
    "resolved": 1
  },
  "topOwners": {
    "platform-team": 1,
    "marketing-platform": 1,
    "core-team": 1
  },
  "criticalityBreakdown": {
    "critical": 2,
    "high": 2,
    "medium": 2
  }
}
```

---

### Attack Surface

**GET** `/api/v1/attack-surface`

Returns attack surface analysis data.

**Response:**

```json
{
  "summary": {
    "totalAssets": 6,
    "exposedAssets": 2,
    "highValueTargets": 3,
    "blastRadius": 12
  },
  "exposures": [
    { "type": "public_bucket", "count": 1, "severity": "critical" },
    { "type": "exposed_credential", "count": 1, "severity": "high" }
  ],
  "attackPaths": [
    {
      "from": "asset-001",
      "to": "asset-003",
      "risk": 8.5,
      "description": "Compromised repo leads to database"
    }
  ]
}
```

---

### Graph

**GET** `/api/v1/graph`

Returns the asset relationship graph.

**Response:**

```json
{
  "nodes": [
    { "id": "asset-001", "label": "service-a", "type": "repository", "criticality": "high" }
  ],
  "edges": [
    { "from": "asset-001", "to": "asset-003", "type": "has_access", "risk": 8.5 }
  ]
}
```

---

### Timeline

**GET** `/api/v1/timeline`

Returns recent security events.

**Response:**

```json
{
  "events": [
    {
      "id": "evt-001",
      "type": "scan",
      "message": "Secret scanner completed",
      "timestamp": "2026-04-18T10:45:00Z",
      "severity": "info"
    }
  ]
}
```

---

### Audit Log

**GET** `/api/v1/audit-log`

Returns audit log entries.

**Response:**

```json
{
  "entries": [
    {
      "id": "log-001",
      "action": "finding.updated",
      "user": "admin@sentinel.local",
      "details": {
        "findingId": "finding-001",
        "changes": { "status": "open" }
      },
      "timestamp": "2026-04-18T15:30:00Z"
    }
  ]
}
```

---

## Data Models

### Asset

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| type | string | Asset type (repository, bucket, database, api, container, function) |
| name | string | Display name |
| owner | string | Team or owner |
| criticality | string | Business criticality (critical, high, medium, low) |
| tags | array | Additional tags |
| createdAt | timestamp | Creation timestamp |

### Finding

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| title | string | Finding title |
| severity | string | Severity level (critical, high, medium, low) |
| assetId | string | Related asset ID |
| status | string | Status (open, triage, resolved) |
| cvss | float | CVSS score |
| cve | string | CVE identifier (if applicable) |
| description | string | Detailed description |
| createdAt | timestamp | Creation timestamp |
| assignee | string | Assigned user |

### Scan

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| type | string | Scan type (secret, vulnerability, configuration) |
| status | string | Status (running, completed, failed) |
| assetsScanned | integer | Number of assets scanned |
| findings | integer | Number of findings |
| startedAt | timestamp | Start timestamp |
| completedAt | timestamp | Completion timestamp |

---

## Error Responses

All errors follow this format:

```json
{
  "error": true,
  "message": "Error description",
  "timestamp": "2026-04-18T17:00:00Z"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |