/**
 * Sentinel Fabric SDK
 * A comprehensive SDK for building security scanners, enrichers, and integrations
 * @version 0.1.0
 */

export const AssetType = {
  REPOSITORY: 'repository',
  BUCKET: 'bucket',
  DATABASE: 'database',
  API: 'api',
  CONTAINER: 'container',
  FUNCTION: 'function',
  SERVICE: 'service',
  DOMAIN: 'domain',
  CERTIFICATE: 'certificate',
  SECRET: 'secret'
};

export const Severity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
};

export const FindingStatus = {
  OPEN: 'open',
  TRIAGE: 'triage',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  FALSE_POSITIVE: 'false_positive',
  IGNORED: 'ignored'
};

export const ScanType = {
  SECRET: 'secret',
  VULNERABILITY: 'vulnerability',
  CONFIGURATION: 'configuration',
  COMPLIANCE: 'compliance',
  FULL: 'full'
};

export const PolicyStatus = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  DRAFT: 'draft'
};

export function defineScanner(config) {
  if (!config.name) {
    throw new Error('Scanner must have a name');
  }
  if (!config.scan) {
    throw new Error('Scanner must implement a scan function');
  }

  return {
    kind: 'scanner',
    version: '0.1.0',
    enabled: true,
    ...config
  };
}

export function defineEnricher(config) {
  if (!config.name) {
    throw new Error('Enricher must have a name');
  }
  if (!config.enrich) {
    throw new Error('Enricher must implement an enrich function');
  }

  return {
    kind: 'enricher',
    version: '0.1.0',
    ...config
  };
}

export function definePolicy(config) {
  if (!config.name) {
    throw new Error('Policy must have a name');
  }
  if (!config.evaluate) {
    throw new Error('Policy must implement an evaluate function');
  }

  return {
    kind: 'policy',
    version: '0.1.0',
    status: config.status || 'enabled',
    severity: config.severity || 'medium',
    ...config
  };
}

export function createFinding(data) {
  const required = ['title', 'severity', 'assetId'];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Finding must have ${field}`);
    }
  }

  return {
    id: data.id || `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: data.title,
    severity: data.severity,
    assetId: data.assetId,
    status: data.status || FindingStatus.OPEN,
    cvss: data.cvss || null,
    cve: data.cve || null,
    description: data.description || '',
    createdAt: data.createdAt || new Date().toISOString(),
    assignee: data.assignee || null,
    scanner: data.scanner || null,
    tags: data.tags || [],
    evidence: data.evidence || [],
    remediation: data.remediation || null
  };
}

export function createAsset(data) {
  if (!data.name || !data.type) {
    throw new Error('Asset must have name and type');
  }

  return {
    id: data.id || `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    name: data.name,
    owner: data.owner || null,
    criticality: data.criticality || 'medium',
    tags: data.tags || [],
    metadata: data.metadata || {},
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

export function createEvidence(data) {
  return {
    id: data.id || `evidence-${Date.now()}`,
    type: data.type,
    content: data.content,
    timestamp: data.timestamp || new Date().toISOString(),
    source: data.source,
    metadata: data.metadata || {}
  };
}

export class ScannerRunner {
  constructor(options = {}) {
    this.scanners = [];
    this.onFinding = options.onFinding || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.onError = options.onError || (() => {});
  }

  register(scanner) {
    if (scanner.kind !== 'scanner') {
      throw new Error('Invalid scanner: must be created with defineScanner()');
    }
    this.scanners.push(scanner);
    return this;
  }

  async run(context = {}) {
    const results = {
      assetsScanned: 0,
      findings: [],
      errors: [],
      duration: 0
    };

    const startTime = Date.now();

    for (const scanner of this.scanners) {
      if (!scanner.enabled) continue;

      this.onProgress({ scanner: scanner.name, status: 'running' });

      try {
        const scanResult = await scanner.scan(context);
        
        results.assetsScanned += scanResult.assetsScanned || 0;
        results.findings.push(...(scanResult.findings || []));

        scanResult.findings?.forEach(finding => {
          this.onFinding({
            ...finding,
            scanner: scanner.name
          });
        });

        this.onProgress({ scanner: scanner.name, status: 'completed', findings: scanResult.findings?.length || 0 });
      } catch (error) {
        const errorRecord = { scanner: scanner.name, error: error.message };
        results.errors.push(errorRecord);
        this.onError(errorRecord);
      }
    }

    results.duration = Date.now() - startTime;
    return results;
  }
}

export class PolicyEngine {
  constructor(options = {}) {
    this.policies = [];
    this.onViolation = options.onViolation || (() => {});
  }

  register(policy) {
    if (policy.kind !== 'policy') {
      throw new Error('Invalid policy: must be created with definePolicy()');
    }
    this.policies.push(policy);
    return this;
  }

  async evaluate(context = {}) {
    const results = {
      policiesRun: 0,
      violations: [],
      duration: 0
    };

    const startTime = Date.now();

    for (const policy of this.policies) {
      if (policy.status !== 'enabled') continue;

      results.policiesRun++;

      try {
        const evaluation = await policy.evaluate(context);

        if (evaluation.violated) {
          const violation = {
            policy: policy.name,
            severity: policy.severity,
            message: evaluation.message,
            details: evaluation.details || {}
          };
          results.violations.push(violation);
          this.onViolation(violation);
        }
      } catch (error) {
        console.error(`Policy ${policy.name} failed:`, error);
      }
    }

    results.duration = Date.now() - startTime;
    return results;
  }
}

export class EnricherPipeline {
  constructor(options = {}) {
    this.enrichers = [];
  }

  register(enricher) {
    if (enricher.kind !== 'enricher') {
      throw new Error('Invalid enricher: must be created with defineEnricher()');
    }
    this.enrichers.push(enricher);
    return this;
  }

  async enrich(entity, context = {}) {
    let enriched = { ...entity };

    for (const enricher of this.enrichers) {
      try {
        enriched = await enricher.enrich(enriched, context) || enriched;
      } catch (error) {
        console.error(`Enricher ${enricher.name} failed:`, error);
      }
    }

    return enriched;
  }
}

export class APIClient {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async request(method, endpoint, data = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getOverview() {
    return this.request('GET', '/api/v1/overview');
  }

  async getAssets(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/api/v1/assets?${query}`);
  }

  async getAsset(id) {
    return this.request('GET', `/api/v1/assets/${id}`);
  }

  async getFindings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/api/v1/findings?${query}`);
  }

  async getFinding(id) {
    return this.request('GET', `/api/v1/findings/${id}`);
  }

  async updateFinding(id, data) {
    return this.request('PATCH', `/api/v1/findings/${id}`, data);
  }

  async runScan(type = 'full') {
    return this.request('POST', '/api/v1/scans/run', { type });
  }

  async getScans() {
    return this.request('GET', '/api/v1/scans');
  }

  async getPolicies() {
    return this.request('GET', '/api/v1/policies');
  }

  async getMetrics() {
    return this.request('GET', '/api/v1/metrics');
  }

  async getAttackSurface() {
    return this.request('GET', '/api/v1/attack-surface');
  }

  async getGraph() {
    return this.request('GET', '/api/v1/graph');
  }

  async getTimeline() {
    return this.request('GET', '/api/v1/timeline');
  }

  async getAuditLog() {
    return this.request('GET', '/api/v1/audit-log');
  }
}

export function createSDK(options = {}) {
  return {
    client: new APIClient(options.baseUrl),
    scanners: new ScannerRunner(options),
    policies: new PolicyEngine(options),
    enrichers: new EnricherPipeline(options),
    AssetType,
    Severity,
    FindingStatus,
    ScanType,
    PolicyStatus,
    createFinding,
    createAsset,
    createEvidence,
    defineScanner,
    defineEnricher,
    definePolicy
  };
}

export default {
  AssetType,
  Severity,
  FindingStatus,
  ScanType,
  PolicyStatus,
  defineScanner,
  defineEnricher,
  definePolicy,
  createFinding,
  createAsset,
  createEvidence,
  ScannerRunner,
  PolicyEngine,
  EnricherPipeline,
  APIClient,
  createSDK
};