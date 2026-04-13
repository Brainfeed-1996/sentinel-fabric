# Threat Model

## Assets to protect

- tenant data
- scan results
- secrets discovered during scans
- remediation credentials and tokens
- audit logs
- workflow history

## Threat actors

- external attacker targeting public APIs
- malicious tenant user
- compromised connector integration
- compromised worker node
- insider with excessive privileges

## Main risks

- cross-tenant data leakage
- insecure storage of discovered secrets
- privilege escalation in remediation workflows
- forged or replayed scanner results
- excessive trust in third-party connectors
- graph poisoning through malicious telemetry

## Mitigations to emphasize

- strong tenant scoping on every query path
- envelope encryption for sensitive artifacts
- short-lived credentials and least privilege for actions
- signed worker-to-control-plane communication
- immutable audit trails for sensitive actions
- policy-based approval gates for remediation
- provenance metadata for ingested findings
