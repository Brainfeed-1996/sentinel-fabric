import http from 'node:http';
import { URL } from 'node:url';

const port = process.env.PORT || 8080;

const db = {
  assets: [
    { id: 'asset-001', type: 'repository', name: 'service-a', owner: 'platform-team', criticality: 'high', tags: ['production', 'customer-facing'], createdAt: '2026-01-15T10:00:00Z' },
    { id: 'asset-002', type: 'bucket', name: 'marketing-assets', owner: 'marketing-platform', criticality: 'medium', tags: ['storage', 'public'], createdAt: '2026-02-20T14:30:00Z' },
    { id: 'asset-003', type: 'database', name: 'users-db', owner: 'core-team', criticality: 'critical', tags: ['production', 'pci'], createdAt: '2026-01-10T08:00:00Z' },
    { id: 'asset-004', type: 'api', name: 'payment-gateway', owner: 'payments-team', criticality: 'critical', tags: ['production', 'financial'], createdAt: '2026-03-01T09:15:00Z' },
    { id: 'asset-005', type: 'container', name: 'worker-service', owner: 'infrastructure', criticality: 'high', tags: ['kubernetes', 'backend'], createdAt: '2026-03-10T11:45:00Z' },
    { id: 'asset-006', type: 'function', name: 'image-processor', owner: 'media-team', criticality: 'medium', tags: ['serverless', 'lambda'], createdAt: '2026-03-15T16:20:00Z' }
  ],
  findings: [
    { id: 'finding-001', title: 'Exposed credential in repository history', severity: 'high', assetId: 'asset-001', status: 'open', cvss: 7.5, cve: null, description: 'AWS_ACCESS_KEY detected in git commit history', createdAt: '2026-04-15T09:30:00Z', assignee: 'security-team' },
    { id: 'finding-002', title: 'Public object storage bucket without policy restriction', severity: 'critical', assetId: 'asset-002', status: 'triage', cvss: 9.8, cve: null, description: 'S3 bucket policy allows public access', createdAt: '2026-04-18T14:00:00Z', assignee: null },
    { id: 'finding-003', title: 'SQL injection vulnerability in API endpoint', severity: 'critical', assetId: 'asset-004', status: 'open', cvss: 9.1, cve: 'CVE-2026-1234', description: 'Unparameterized SQL query in user endpoint', createdAt: '2026-04-17T11:20:00Z', assignee: 'security-team' },
    { id: 'finding-004', title: 'Weak TLS configuration detected', severity: 'medium', assetId: 'asset-003', status: 'resolved', cvss: 5.3, cve: null, description: 'Database accepts TLS 1.0 connections', createdAt: '2026-04-10T08:45:00Z', assignee: 'dba-team' },
    { id: 'finding-005', title: 'Excessive IAM permissions', severity: 'high', assetId: 'asset-005', status: 'open', cvss: 8.2, cve: null, description: 'Service account has admin privileges', createdAt: '2026-04-16T13:30:00Z', assignee: 'platform-team' },
    { id: 'finding-006', title: 'Container image with known vulnerabilities', severity: 'medium', assetId: 'asset-005', status: 'triage', cvss: 6.5, cve: 'CVE-2026-5678', description: 'Base image has 3 critical CVEs', createdAt: '2026-04-18T10:00:00Z', assignee: null }
  ],
  scans: [
    { id: 'scan-001', type: 'secret', status: 'completed', assetsScanned: 6, findings: 3, startedAt: '2026-04-18T08:00:00Z', completedAt: '2026-04-18T08:45:00Z' },
    { id: 'scan-002', type: 'vulnerability', status: 'completed', assetsScanned: 4, findings: 2, startedAt: '2026-04-17T14:00:00Z', completedAt: '2026-04-17T15:30:00Z' },
    { id: 'scan-003', type: 'configuration', status: 'running', assetsScanned: 2, findings: 1, startedAt: '2026-04-18T16:00:00Z', completedAt: null }
  ],
  policies: [
    { id: 'policy-001', name: 'S3 Public Access', description: 'Block public S3 buckets', severity: 'critical', status: 'enabled', lastRun: '2026-04-18T12:00:00Z' },
    { id: 'policy-002', name: 'Secrets in Code', description: 'Detect exposed secrets', severity: 'high', status: 'enabled', lastRun: '2026-04-18T12:00:00Z' },
    { id: 'policy-003', name: 'IAM Least Privilege', description: 'Enforce minimal permissions', severity: 'high', status: 'enabled', lastRun: '2026-04-18T12:00:00Z' },
    { id: 'policy-004', name: 'TLS 1.2+ Only', description: 'Require TLS 1.2 or higher', severity: 'medium', status: 'disabled', lastRun: '2026-04-15T12:00:00Z' }
  ],
  users: [
    { id: 'user-001', name: 'Security Admin', email: 'admin@sentinel.local', role: 'administrator', lastLogin: '2026-04-18T15:30:00Z' },
    { id: 'user-002', name: 'Analyst One', email: 'analyst1@sentinel.local', role: 'analyst', lastLogin: '2026-04-17T09:15:00Z' }
  ]
};

function json(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(payload, null, 2));
}

function jsonError(res, code, message) {
  json(res, code, { error: true, message, timestamp: new Date().toISOString() });
}

function parseQuery(url) {
  const params = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

function paginate(items, page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: items.slice(start, end),
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasNext: end < items.length,
      hasPrev: page > 1
    }
  };
}

const routes = {
  'GET /health': () => ({ status: 'healthy', service: 'sentinel-fabric-api', version: '0.1.0', uptime: process.uptime() }),
  
  'GET /api/v1/overview': () => {
    const severities = { critical: 0, high: 0, medium: 0, low: 0 };
    const statuses = { open: 0, triage: 0, resolved: 0 };
    
    db.findings.forEach(f => {
      severities[f.severity] = (severities[f.severity] || 0) + 1;
      statuses[f.status] = (statuses[f.status] || 0) + 1;
    });

    return {
      totalAssets: db.assets.length,
      totalFindings: db.findings.length,
      severities,
      statuses,
      recentScans: db.scans.length,
      activePolicies: db.policies.filter(p => p.status === 'enabled').length
    };
  },

  'GET /api/v1/assets': (params) => {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    let assets = [...db.assets];
    
    if (params.type) {
      assets = assets.filter(a => a.type === params.type);
    }
    if (params.criticality) {
      assets = assets.filter(a => a.criticality === params.criticality);
    }
    if (params.owner) {
      assets = assets.filter(a => a.owner === params.owner);
    }

    return paginate(assets, page, limit);
  },

  'GET /api/v1/assets/:id': (params) => {
    const asset = db.assets.find(a => a.id === params.id);
    if (!asset) return null;
    
    const assetFindings = db.findings.filter(f => f.assetId === asset.id);
    return { ...asset, findings: assetFindings };
  },

  'GET /api/v1/findings': (params) => {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    let findings = [...db.findings];
    
    if (params.severity) {
      findings = findings.filter(f => f.severity === params.severity);
    }
    if (params.status) {
      findings = findings.filter(f => f.status === params.status);
    }
    if (params.assetId) {
      findings = findings.filter(f => f.assetId === params.assetId);
    }

    return paginate(findings, page, limit);
  },

  'GET /api/v1/findings/:id': (params) => {
    return db.findings.find(f => f.id === params.id) || null;
  },

  'PATCH /api/v1/findings/:id': (params, body) => {
    const finding = db.findings.find(f => f.id === params.id);
    if (!finding) return null;
    
    if (body.status) finding.status = body.status;
    if (body.assignee) finding.assignee = body.assignee;
    if (body.notes) finding.notes = body.notes;
    
    return finding;
  },

  'GET /api/v1/scans': () => db.scans,

  'GET /api/v1/scans/:id': (params) => {
    return db.scans.find(s => s.id === params.id) || null;
  },

  'POST /api/v1/scans/run': (params, body) => {
    const newScan = {
      id: `scan-${Date.now()}`,
      type: body?.type || 'full',
      status: 'running',
      assetsScanned: 0,
      findings: 0,
      startedAt: new Date().toISOString(),
      completedAt: null
    };
    db.scans.unshift(newScan);
    return newScan;
  },

  'GET /api/v1/policies': () => db.policies,

  'GET /api/v1/policies/:id': (params) => {
    return db.policies.find(p => p.id === params.id) || null;
  },

  'GET /api/v1/metrics': () => ({
    assetTypes: db.assets.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {}),
    severityBreakdown: db.findings.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; }, {}),
    statusBreakdown: db.findings.reduce((acc, f) => { acc[f.status] = (acc[f.status] || 0) + 1; return acc; }, {}),
    topOwners: db.assets.reduce((acc, a) => { acc[a.owner] = (acc[a.owner] || 0) + 1; return acc; }, {}),
    criticalityBreakdown: db.assets.reduce((acc, a) => { acc[a.criticality] = (acc[a.criticality] || 0) + 1; return acc; }, {})
  }),

  'GET /api/v1/timeline': () => ({
    events: [
      { id: 'evt-001', type: 'scan', message: 'Secret scanner completed', timestamp: '2026-04-18T10:45:00Z', severity: 'info' },
      { id: 'evt-002', type: 'finding', message: 'Critical finding: Public S3 bucket', timestamp: '2026-04-18T14:00:00Z', severity: 'critical' },
      { id: 'evt-003', type: 'remediation', message: 'Finding moved to triage', timestamp: '2026-04-18T14:30:00Z', severity: 'info' },
      { id: 'evt-004', type: 'policy', message: 'Policy evaluation completed', timestamp: '2026-04-18T12:00:00Z', severity: 'info' },
      { id: 'evt-005', type: 'scan', message: 'Configuration scan started', timestamp: '2026-04-18T16:00:00Z', severity: 'info' }
    ]
  }),

  'GET /api/v1/attack-surface': () => ({
    summary: { totalAssets: db.assets.length, exposedAssets: 2, highValueTargets: 3, blastRadius: 12 },
    exposures: [
      { type: 'public_bucket', count: 1, severity: 'critical' },
      { type: 'exposed_credential', count: 1, severity: 'high' },
      { type: 'weak_auth', count: 0, severity: 'high' },
      { type: 'insecure_protocol', count: 1, severity: 'medium' }
    ],
    attackPaths: [
      { from: 'asset-001', to: 'asset-003', risk: 8.5, description: 'Compromised repo leads to database' },
      { from: 'asset-002', to: 'asset-004', risk: 9.2, description: 'Public bucket exposes payment API' }
    ]
  }),

  'GET /api/v1/graph': () => ({
    nodes: db.assets.map(a => ({ id: a.id, label: a.name, type: a.type, criticality: a.criticality })),
    edges: [
      { from: 'asset-001', to: 'asset-003', type: 'has_access', risk: 8.5 },
      { from: 'asset-002', to: 'asset-004', type: 'depends_on', risk: 9.2 },
      { from: 'asset-005', to: 'asset-003', type: 'connects_to', risk: 6.0 }
    ]
  }),

  'GET /api/v1/audit-log': () => ({
    entries: [
      { id: 'log-001', action: 'finding.updated', user: 'admin@sentinel.local', details: { findingId: 'finding-001', changes: { status: 'open' } }, timestamp: '2026-04-18T15:30:00Z' },
      { id: 'log-002', action: 'scan.started', user: 'system', details: { scanId: 'scan-003', type: 'configuration' }, timestamp: '2026-04-18T16:00:00Z' },
      { id: 'log-003', action: 'policy.evaluated', user: 'system', details: { policiesRun: 3, findingsGenerated: 1 }, timestamp: '2026-04-18T12:00:00Z' },
      { id: 'log-004', action: 'asset.created', user: 'admin@sentinel.local', details: { assetId: 'asset-006', type: 'function' }, timestamp: '2026-04-15T10:00:00Z' }
    ]
  })
};

function matchRoute(method, pathname) {
  const routeKeys = Object.keys(routes).filter(k => k.startsWith(method));
  
  for (const key of routeKeys) {
    const [rmethod, path] = key.split(' ');
    
    if (path === pathname) {
      return { handler: routes[key], params: {} };
    }
    
    const pathParts = path.split('/');
    const pathnameParts = pathname.split('/');
    
    if (pathParts.length === pathnameParts.length) {
      const params = {};
      const match = pathParts.every((part, i) => {
        if (part.startsWith(':')) {
          params[part.slice(1)] = pathnameParts[i];
          return true;
        }
        return part === pathnameParts[i];
      });
      
      if (match) {
        return { handler: routes[key], params };
      }
    }
  }
  
  return null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = url.pathname;
  const method = req.method;
  const params = parseQuery(url);

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const route = matchRoute(method, pathname);

  if (!route) {
    return jsonError(res, 404, `Route ${method} ${pathname} not found`);
  }

  if (method === 'PATCH' || method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const result = route.handler(route.params, parsed);
        
        if (result === null) {
          return jsonError(res, 404, 'Resource not found');
        }
        
        json(res, 200, result);
      } catch (e) {
        jsonError(res, 400, 'Invalid JSON body');
      }
    });
  } else {
    try {
      const result = route.handler(params);
      
      if (result === null) {
        return jsonError(res, 404, 'Resource not found');
      }
      
      json(res, 200, result);
    } catch (e) {
      jsonError(res, 500, 'Internal server error');
    }
  }
});

server.listen(port, () => {
  console.log(`Sentinel Fabric API v0.1.0 listening on :${port}`);
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/v1/overview');
  console.log('  GET  /api/v1/assets');
  console.log('  GET  /api/v1/assets/:id');
  console.log('  GET  /api/v1/findings');
  console.log('  GET  /api/v1/findings/:id');
  console.log('  PATCH /api/v1/findings/:id');
  console.log('  GET  /api/v1/scans');
  console.log('  POST /api/v1/scans/run');
  console.log('  GET  /api/v1/policies');
  console.log('  GET  /api/v1/metrics');
  console.log('  GET  /api/v1/timeline');
  console.log('  GET  /api/v1/attack-surface');
  console.log('  GET  /api/v1/graph');
  console.log('  GET  /api/v1/audit-log');
});