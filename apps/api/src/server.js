import http from 'node:http';

const port = process.env.PORT || 8080;

const findings = [
  {
    id: 'finding-001',
    title: 'Exposed credential in repository history',
    severity: 'high',
    assetId: 'repo:example/service-a',
    status: 'open'
  },
  {
    id: 'finding-002',
    title: 'Public object storage bucket without policy restriction',
    severity: 'critical',
    assetId: 'cloud:bucket:marketing-assets',
    status: 'triage'
  }
];

const assets = [
  {
    id: 'asset-001',
    type: 'repository',
    name: 'service-a',
    owner: 'platform-team',
    criticality: 'high'
  },
  {
    id: 'asset-002',
    type: 'bucket',
    name: 'marketing-assets',
    owner: 'marketing-platform',
    criticality: 'medium'
  }
];

function json(res, code, payload) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    return json(res, 200, { status: 'ok', service: 'sentinel-fabric-api' });
  }

  if (req.url === '/api/v1/assets') {
    return json(res, 200, { data: assets, total: assets.length });
  }

  if (req.url === '/api/v1/findings') {
    return json(res, 200, { data: findings, total: findings.length });
  }

  if (req.url === '/api/v1/overview') {
    return json(res, 200, {
      totalAssets: assets.length,
      totalFindings: findings.length,
      severities: {
        critical: findings.filter((item) => item.severity === 'critical').length,
        high: findings.filter((item) => item.severity === 'high').length
      }
    });
  }

  return json(res, 404, { error: 'not_found' });
});

server.listen(port, () => {
  console.log(`sentinel-fabric api listening on :${port}`);
});
