const API_BASE = 'http://127.0.0.1:8080';

class SentinelClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async fetchJSON(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  }

  async getOverview() {
    return this.fetchJSON('/api/v1/overview');
  }

  async getAssets(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.fetchJSON(`/api/v1/assets?${query}`);
  }

  async getAsset(id) {
    return this.fetchJSON(`/api/v1/assets/${id}`);
  }

  async getFindings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.fetchJSON(`/api/v1/findings?${query}`);
  }

  async getFinding(id) {
    return this.fetchJSON(`/api/v1/findings/${id}`);
  }

  async updateFinding(id, data) {
    const response = await fetch(`${this.baseUrl}/api/v1/findings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getScans() {
    return this.fetchJSON('/api/v1/scans');
  }

  async runScan(type = 'full') {
    const response = await fetch(`${this.baseUrl}/api/v1/scans/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    return response.json();
  }

  async getPolicies() {
    return this.fetchJSON('/api/v1/policies');
  }

  async getMetrics() {
    return this.fetchJSON('/api/v1/metrics');
  }

  async getAttackSurface() {
    return this.fetchJSON('/api/v1/attack-surface');
  }

  async getGraph() {
    return this.fetchJSON('/api/v1/graph');
  }

  async getTimeline() {
    return this.fetchJSON('/api/v1/timeline');
  }

  async getAuditLog() {
    return this.fetchJSON('/api/v1/audit-log');
  }

  async getHealth() {
    return this.fetchJSON('/health');
  }
}

class Dashboard {
  constructor() {
    this.client = new SentinelClient(API_BASE);
    this.currentView = 'dashboard';
    this.findings = [];
    this.assets = [];
    this.scans = [];
    this.policies = [];
    this.metrics = null;
    this.attackSurface = null;
    this.graph = null;
    this.filter = 'all';
    this.searchQuery = '';
  }

  async init() {
    this.setupEventListeners();
    await this.loadData();
    this.navigate('dashboard');
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.nav;
        if (view) this.navigate(view);
      });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.textContent.toLowerCase().trim();
        this.renderFindingsTable();
      });
    });

    const searchInput = document.querySelector('.table-search input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderFindingsTable();
      });
    }

    document.querySelectorAll('.action-card').forEach(card => {
      card.addEventListener('click', () => {
        const title = card.querySelector('h4')?.textContent;
        if (title) this.handleQuickAction(title);
      });
    });

    document.querySelectorAll('.chart-period').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-period').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this.handlePageChange(btn);
      });
    });
  }

  navigate(view) {
    this.currentView = view;
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-nav="${view}"]`)?.classList.add('active');

    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    switch(view) {
      case 'dashboard':
        mainContent.innerHTML = this.renderDashboard();
        break;
      case 'assets':
        mainContent.innerHTML = this.renderAssets();
        break;
      case 'findings':
        mainContent.innerHTML = this.renderFindings();
        break;
      case 'scans':
        mainContent.innerHTML = this.renderScans();
        break;
      case 'policies':
        mainContent.innerHTML = this.renderPolicies();
        break;
      case 'attack-surface':
        mainContent.innerHTML = this.renderAttackSurface();
        break;
      case 'graphs':
        mainContent.innerHTML = this.renderGraph();
        break;
      case 'logs':
        mainContent.innerHTML = this.renderAuditLog();
        break;
      default:
        mainContent.innerHTML = this.renderDashboard();
    }

    this.setupEventListeners();
    this.showToast('Navigation', `Viewing ${view}`, 'success');
  }

  async loadData() {
    const statusEl = document.querySelector('[data-status]');
    const statusBarDot = document.querySelector('.status-dot');
    
    try {
      const [overview, health] = await Promise.all([
        this.client.getOverview(),
        this.client.getHealth()
      ]);

      this.updateDashboard(overview);
      if (statusEl) {
        statusEl.textContent = `Connected to ${health.service}`;
        statusEl.style.color = 'var(--accent-primary)';
      }
      if (statusBarDot) {
        statusBarDot.classList.add('online');
        statusBarDot.classList.remove('offline');
      }

      const findingsData = await this.client.getFindings();
      this.findings = findingsData.data || findingsData;

      const assetsData = await this.client.getAssets();
      this.assets = assetsData.data || assetsData;

      this.scans = await this.client.getScans();
      this.policies = await this.client.getPolicies();
      this.metrics = await this.client.getMetrics();
      this.attackSurface = await this.client.getAttackSurface();
      this.graph = await this.client.getGraph();
      
      this.updateLastSync();
      
    } catch (error) {
      console.error('Failed to load data:', error);
      if (statusEl) {
        statusEl.textContent = 'API unavailable, showing static data.';
        statusEl.style.color = 'var(--warning)';
      }
      if (statusBarDot) {
        statusBarDot.classList.remove('online');
        statusBarDot.classList.add('offline');
      }
    }
  }

  updateDashboard(data) {
    const totalAssetsEl = document.querySelector('[data-total-assets]');
    const totalFindingsEl = document.querySelector('[data-total-findings]');
    const criticalEl = document.querySelector('[data-critical]');
    const highEl = document.querySelector('[data-high]');
    const badges = document.querySelectorAll('.nav-badge');

    if (totalAssetsEl) totalAssetsEl.textContent = data.totalAssets || 0;
    if (totalFindingsEl) totalFindingsEl.textContent = data.totalFindings || 0;
    if (criticalEl) criticalEl.textContent = data.severities?.critical || 0;
    if (highEl) highEl.textContent = data.severities?.high || 0;
    
    if (badges[0]) badges[0].textContent = data.totalAssets || 0;
    if (badges[1]) badges[1].textContent = data.totalFindings || 0;
  }

  updateLastSync() {
    const lastSyncEl = document.getElementById('lastSync');
    if (lastSyncEl) {
      lastSyncEl.textContent = 'Just now';
    }
  }

  renderDashboard() {
    return `
      <header class="header">
        <div class="header-left">
          <div>
            <h1 class="page-title">Security Dashboard</h1>
            <div class="breadcrumb">
              <a href="#" onclick="dashboard.navigate('dashboard'); return false;">Home</a>
              <i class="fas fa-chevron-right"></i>
              <span>Dashboard</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search assets, findings...">
          </div>
          <button class="btn btn-icon" title="Notifications"><i class="fas fa-bell"></i></button>
          <button class="btn btn-icon" title="Help"><i class="fas fa-question-circle"></i></button>
          <button class="btn btn-primary" onclick="dashboard.runFullScan()">
            <i class="fas fa-play"></i> Run Scan
          </button>
        </div>
      </header>
      <div class="content">
        <div class="stats-grid">
          <div class="stat-card fade-in stagger-1">
            <div class="stat-header">
              <div class="stat-icon primary"><i class="fas fa-layer-group"></i></div>
              <div class="stat-trend up"><i class="fas fa-arrow-up"></i> 12%</div>
            </div>
            <div class="stat-value" data-total-assets>${this.assets.length || 0}</div>
            <div class="stat-label">Total Assets</div>
          </div>
          <div class="stat-card danger fade-in stagger-2">
            <div class="stat-header">
              <div class="stat-icon danger"><i class="fas fa-bug"></i></div>
              <div class="stat-trend down"><i class="fas fa-arrow-down"></i> 8%</div>
            </div>
            <div class="stat-value" data-total-findings>${this.findings.length || 0}</div>
            <div class="stat-label">Active Findings</div>
          </div>
          <div class="stat-card warning fade-in stagger-3">
            <div class="stat-header">
              <div class="stat-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
            </div>
            <div class="stat-value">${this.findings.filter(f => f.severity === 'critical').length}</div>
            <div class="stat-label">Critical Severity</div>
          </div>
          <div class="stat-card info fade-in stagger-4">
            <div class="stat-header">
              <div class="stat-icon info"><i class="fas fa-clock"></i></div>
            </div>
            <div class="stat-value">${this.findings.filter(f => f.severity === 'high').length}</div>
            <div class="stat-label">High Severity</div>
          </div>
        </div>
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Findings Over Time</h3>
              <div class="chart-actions">
                <button class="chart-period">7D</button>
                <button class="chart-period active">30D</button>
                <button class="chart-period">90D</button>
              </div>
            </div>
            <div class="chart-container">
              <div class="bar-chart">
                <div class="bar-item"><div class="bar-value">3</div><div class="bar" style="height: 60px;"></div><div class="bar-label">Week 1</div></div>
                <div class="bar-item"><div class="bar-value">5</div><div class="bar" style="height: 100px;"></div><div class="bar-label">Week 2</div></div>
                <div class="bar-item"><div class="bar-value">2</div><div class="bar" style="height: 40px;"></div><div class="bar-label">Week 3</div></div>
                <div class="bar-item"><div class="bar-value">4</div><div class="bar" style="height: 80px;"></div><div class="bar-label">Week 4</div></div>
              </div>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-header"><h3 class="chart-title">Severity Distribution</h3></div>
            <div class="chart-container">
              <div class="donut-container">
                <div class="donut-chart">
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle cx="90" cy="90" r="70" fill="none" stroke="var(--border-primary)" stroke-width="20"/>
                    <circle cx="90" cy="90" r="70" fill="none" stroke="var(--critical)" stroke-width="20" stroke-dasharray="110 440" stroke-dashoffset="0"/>
                    <circle cx="90" cy="90" r="70" fill="none" stroke="var(--high)" stroke-width="20" stroke-dasharray="110 440" stroke-dashoffset="-110"/>
                    <circle cx="90" cy="90" r="70" fill="none" stroke="var(--medium)" stroke-width="20" stroke-dasharray="110 440" stroke-dashoffset="-220"/>
                    <circle cx="90" cy="90" r="70" fill="none" stroke="var(--low)" stroke-width="20" stroke-dasharray="110 440" stroke-dashoffset="-330"/>
                  </svg>
                  <div class="donut-center"><div class="donut-total">${this.findings.length}</div><div class="donut-label">Total</div></div>
                </div>
                <div class="donut-legend">
                  <div class="legend-item"><div class="legend-dot" style="background: var(--critical);"></div><span class="legend-text">Critical</span><span class="legend-value">${this.findings.filter(f => f.severity === 'critical').length}</span></div>
                  <div class="legend-item"><div class="legend-dot" style="background: var(--high);"></div><span class="legend-text">High</span><span class="legend-value">${this.findings.filter(f => f.severity === 'high').length}</span></div>
                  <div class="legend-item"><div class="legend-dot" style="background: var(--medium);"></div><span class="legend-text">Medium</span><span class="legend-value">${this.findings.filter(f => f.severity === 'medium').length}</span></div>
                  <div class="legend-item"><div class="legend-dot" style="background: var(--low);"></div><span class="legend-text">Low</span><span class="legend-value">${this.findings.filter(f => f.severity === 'low').length}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ${this.renderFindingsCard()}
        <div class="charts-grid" style="margin-top: 24px;">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Recent Activity</h3>
              <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;"><i class="fas fa-sync"></i> Refresh</button>
            </div>
            <div class="activity-feed">
              <div class="activity-item"><div class="activity-icon scan"><i class="fas fa-search"></i></div><div class="activity-content"><div class="activity-text"><strong>Secret Scanner</strong> completed scan on <strong>service-a</strong></div><div class="activity-time">2 hours ago</div></div></div>
              <div class="activity-item"><div class="activity-icon alert"><i class="fas fa-exclamation-triangle"></i></div><div class="activity-content"><div class="activity-text">New <strong>critical</strong> finding: Public bucket exposure</div><div class="activity-time">4 hours ago</div></div></div>
              <div class="activity-item"><div class="activity-icon resolve"><i class="fas fa-check-circle"></i></div><div class="activity-content"><div class="activity-text"><strong>Finding-001</strong> moved to triage status</div><div class="activity-time">6 hours ago</div></div></div>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-header"><h3 class="chart-title">Quick Actions</h3></div>
            <div class="quick-actions">
              <div class="action-card"><div class="action-card-icon scan"><i class="fas fa-radar"></i></div><div class="action-card-text"><h4>Run Full Scan</h4><p>Scan all assets</p></div></div>
              <div class="action-card"><div class="action-card-icon policy"><i class="fas fa-shield-alt"></i></div><div class="action-card-text"><h4>Run Policies</h4><p>Evaluate all policies</p></div></div>
              <div class="action-card"><div class="action-card-icon export"><i class="fas fa-download"></i></div><div class="action-card-text"><h4>Export Report</h4><p>Download PDF/CSV</p></div></div>
              <div class="action-card"><div class="action-card-icon report"><i class="fas fa-chart-bar"></i></div><div class="action-card-text"><h4>View Reports</h4><p>Security analytics</p></div></div>
            </div>
          </div>
        </div>
      </div>
      <div class="status-bar">
        <div class="status-item"><div class="status-dot online"></div><span>API Connected</span></div>
        <div class="status-item"><span>Last sync: <span id="lastSync">Just now</span></span></div>
        <div class="status-item"><span>Version: <strong>0.1.0</strong></span></div>
        <div style="margin-left: auto;"><span><i class="fas fa-shield-alt" style="color: var(--accent-primary);"></i> Sentinel Fabric v0.1.0</span></div>
      </div>
    `;
  }

  renderFindingsCard() {
    return `
      <div class="table-card">
        <div class="table-header">
          <h3 class="table-title">Active Findings</h3>
          <div class="table-filters">
            <div class="table-search">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Search findings...">
            </div>
            <button class="filter-btn active">All</button>
            <button class="filter-btn">Critical</button>
            <button class="filter-btn">High</button>
            <button class="filter-btn">Open</button>
            <button class="filter-btn">In Triage</button>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Finding</th><th>Severity</th><th>Asset</th><th>Status</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody id="findingsTable">
            ${this.renderFindingsRows()}
          </tbody>
        </table>
        <div class="pagination">
          <div class="pagination-info">Showing 1-${Math.min(this.findings.length, 10)} of ${this.findings.length} findings</div>
          <div class="pagination-controls">
            <button class="page-btn" disabled><i class="fas fa-chevron-left"></i></button>
            <button class="page-btn active">1</button>
            <button class="page-btn" ${this.findings.length <= 10 ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
          </div>
        </div>
      </div>
    `;
  }

  renderFindingsRows(limit = 10) {
    let filtered = [...this.findings];
    if (this.filter !== 'all') {
      if (this.filter === 'open') filtered = filtered.filter(f => f.status === 'open');
      else if (this.filter === 'critical') filtered = filtered.filter(f => f.severity === 'critical');
      else if (this.filter === 'high') filtered = filtered.filter(f => f.severity === 'high');
      else if (this.filter === 'in triage') filtered = filtered.filter(f => f.status === 'triage');
    }
    if (this.searchQuery) {
      filtered = filtered.filter(f => f.title.toLowerCase().includes(this.searchQuery) || f.id.toLowerCase().includes(this.searchQuery));
    }
    filtered = filtered.slice(0, limit);

    if (filtered.length === 0) {
      return `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px;"></i><div>No findings match your criteria</div></td></tr>`;
    }

    return filtered.map(finding => `
      <tr>
        <td><div style="font-weight: 600;">${this.escapeHtml(finding.title)}</div><div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">ID: ${this.escapeHtml(finding.id)}</div></td>
        <td><span class="severity-badge ${finding.severity}"><i class="fas fa-${this.getSeverityIcon(finding.severity)}"></i> ${this.capitalize(finding.severity)}</span></td>
        <td><span class="asset-tag"><i class="fas fa-${this.getAssetIcon(finding.assetId)}"></i> ${this.escapeHtml(finding.assetId)}</span></td>
        <td><span class="status-badge ${finding.status}"><i class="fas fa-circle" style="font-size: 8px;"></i> ${this.capitalize(finding.status)}</span></td>
        <td>${finding.createdAt ? finding.createdAt.split('T')[0] : '2026-04-18'}</td>
        <td>
          <button class="action-btn" title="View Details" onclick="dashboard.viewFinding('${finding.id}')"><i class="fas fa-eye"></i></button>
          <button class="action-btn" title="Edit" onclick="dashboard.editFinding('${finding.id}')"><i class="fas fa-edit"></i></button>
          <button class="action-btn" title="More"><i class="fas fa-ellipsis-v"></i></button>
        </td>
      </tr>
    `).join('');
  }

  renderFindingsTable() {
    const tbody = document.getElementById('findingsTable');
    if (tbody) tbody.innerHTML = this.renderFindingsRows();
  }

  renderAssets() {
    return `
      <header class="header">
        <div class="header-left">
          <div>
            <h1 class="page-title">Asset Inventory</h1>
            <div class="breadcrumb">
              <a href="#" onclick="dashboard.navigate('dashboard'); return false;">Home</a>
              <i class="fas fa-chevron-right"></i>
              <span>Assets</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search assets...">
          </div>
          <button class="btn btn-primary"><i class="fas fa-plus"></i> Add Asset</button>
        </div>
      </header>
      <div class="content">
        <div class="table-card">
          <div class="table-header">
            <h3 class="table-title">All Assets (${this.assets.length})</h3>
            <div class="table-filters">
              <button class="filter-btn active">All</button>
              <button class="filter-btn">Repository</button>
              <button class="filter-btn">Bucket</button>
              <button class="filter-btn">Database</button>
              <button class="filter-btn">API</button>
              <button class="filter-btn">Container</button>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Asset</th><th>Type</th><th>Owner</th><th>Criticality</th><th>Tags</th><th>Findings</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${this.assets.map(asset => `
                <tr>
                  <td><div style="font-weight: 600;">${this.escapeHtml(asset.name)}</div><div style="font-size: 12px; color: var(--text-muted);">${this.escapeHtml(asset.id)}</div></td>
                  <td><span class="asset-tag"><i class="fas fa-${this.getAssetTypeIcon(asset.type)}"></i> ${this.capitalize(asset.type)}</span></td>
                  <td>${this.escapeHtml(asset.owner || 'N/A')}</td>
                  <td><span class="severity-badge ${asset.criticality}">${this.capitalize(asset.criticality)}</span></td>
                  <td>${(asset.tags || []).map(t => `<span class="status-badge" style="font-size: 10px; padding: 2px 8px;">${t}</span>`).join(' ')}</td>
                  <td>${this.findings.filter(f => f.assetId === asset.id).length}</td>
                  <td>
                    <button class="action-btn" title="View"><i class="fas fa-eye"></i></button>
                    <button class="action-btn" title="Scan"><i class="fas fa-radar"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderFindings() {
    return `
      <header class="header">
        <div class="header-left">
          <div>
            <h1 class="page-title">Security Findings</h1>
            <div class="breadcrumb">
              <a href="#" onclick="dashboard.navigate('dashboard'); return false;">Home</a>
              <i class="fas fa-chevron-right"></i>
              <span>Findings</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search findings...">
          </div>
          <button class="btn btn-primary"><i class="fas fa-filter"></i> Filter</button>
        </div>
      </header>
      <div class="content">
        <div class="stats-grid" style="margin-bottom: 24px;">
          <div class="stat-card"><div class="stat-header"><div class="stat-icon danger"><i class="fas fa-radiation"></i></div></div><div class="stat-value">${this.findings.filter(f => f.severity === 'critical').length}</div><div class="stat-label">Critical</div></div>
          <div class="stat-card"><div class="stat-header"><div class="stat-icon warning"><i class="fas fa-exclamation-circle"></i></div></div><div class="stat-value">${this.findings.filter(f => f.severity === 'high').length}</div><div class="stat-label">High</div></div>
          <div class="stat-card"><div class="stat-header"><div class="stat-icon info"><i class="fas fa-exclamation-triangle"></i></div></div><div class="stat-value">${this.findings.filter(f => f.severity === 'medium').length}</div><div class="stat-label">Medium</div></div>
          <div class="stat-card"><div class="stat-header"><div class="stat-icon primary"><i class="fas fa-info-circle"></i></div></div><div class="stat-value">${this.findings.filter(f => f.severity === 'low').length}</div><div class="stat-label">Low</div></div>
        </div>
        ${this.renderFindingsCard()}
      </div>
    `;
  }

  renderScans() {
    return `
      <header class="header">
        <div class="header-left">
          <div>
            <h1 class="page-title">Security Scans</h1>
            <div class="breadcrumb">
              <a href="#" onclick="dashboard.navigate('dashboard'); return false;">Home</a>
              <i class="fas fa-chevron-right"></i>
              <span>Scans</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <button class="btn btn-primary" onclick="dashboard.runFullScan()"><i class="fas fa-play"></i> Run New Scan</button>
        </div>
      </header>
      <div class="content">
        <div class="table-card">
          <div class="table-header">
            <h3 class="table-title">Scan History</h3>
          </div>
          <table>
            <thead>
              <tr><th>Scan ID</th><th>Type</th><th>Status</th><th>Assets Scanned</th><th>Findings</th><th>Started</th><th>Completed</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${this.scans.map(scan => `
                <tr>
                  <td><div style="font-weight: 600;">${scan.id}</div></td>
                  <td><span class="asset-tag"><i class="fas fa-${this.getScanTypeIcon(scan.type)}"></i> ${this.capitalize(scan.type)}</span></td>
                  <td><span class="status-badge ${scan.status}"><i class="fas fa-circle" style="font-size: 8px;"></i> ${this.capitalize(scan.status)}</span></td>
                  <td>${scan.assetsScanned}</td>
                  <td>${scan.findings}</td>
                  <td>${scan.startedAt ? scan.startedAt.replace('T', ' ').substring(0, 16) : 'N/A'}</td>
                  <td>${scan.completedAt ? scan.completedAt.replace('T', ' ').substring(0, 16) : 'In Progress'}</td>
                  <td>
                    <button class="action-btn" title="View Results"><i class="fas fa-eye"></i></button>
                    <button class="action-btn" title="Re-run"><i class="fas fa-redo"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderPolicies() {
    return `
      <header class="header">
        <div class="header-left">
          <div>
            <h1 class="page-title">Security Policies</h1>
            <div class="breadcrumb">
              <a href="#" onclick="dashboard.navigate('dashboard'); return false;">Home</a>
              <i class="fas fa-chevron-right"></i>
              <span>Policies</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <button class="btn btn-primary"><i class="fas fa-plus"></i> Create Policy</button>
        </div>
      </header>
      <div class="content">
        <div class="table-card">
          <div class="table-header">
            <h3 class="table-title">Active Policies</h3>
          </div>
          <table>
            <thead>
              <tr><th>Policy</th><th>Description</th><th>Severity</th><th>Status</th><th>Last Run</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${this.policies.map(policy => `
                <tr>
                  <td><div style="font-weight: 600;">${this.escapeHtml(policy.name)}</div></td>
                  <td>${this.escapeHtml(policy.description)}</td>
                  <td><span class="severity-badge ${policy.severity}">${this.capitalize(policy.severity)}</span></td>
                  <td><span class="status-badge ${policy.status === 'enabled' ? 'open' : 'resolved'}"><i class="fas fa-circle" style="font-size: 8px;"></i> ${policy.status}</span></td>
                  <td>${policy.lastRun ? policy.lastRun.replace('T', ' ').substring(0, 16) : 'Never'}</td>
                  <td>
                    <button class="action-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn" title="Run"><i class="fas fa-play"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderAttackSurface() {
    if (!this.attackSurface) return '<div class="content"><p>Loading...</p></div>';
    return `
      <header class="header">
        <div class="header-left">
          <div>
            <h1 class="page-title">Attack Surface Analysis</h1>
            <div class="breadcrumb">
              <a href="#" onclick="dashboard.navigate('dashboard'); return false;">Home</a>
              <i class="fas fa-chevron-right"></i>
              <span>Attack Surface</span>
            </div>
          </div>
        </div>
      </header>
      <div class="content">
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-header"><div class="stat-icon primary"><i class="fas fa-layer-group"></i></div></div><div class="stat-value">${this.attackSurface.summary.totalAssets}</div><div class="stat-label">Total Assets</div></div>
          <div class="stat-card danger"><div class="stat-header"><div class="stat-icon danger"><i class="fas fa-external-link-alt"></i></div></div><div class="stat-value">${this.attackSurface.summary.exposedAssets}</div><div class="stat-label">Exposed Assets</div></div>
          <div class="stat-card warning"><div class="stat-header"><div class="stat-icon warning"><i class="fas fa-bullseye"></i></div></div><div class="stat-value">${this.attackSurface.summary.highValueTargets}</div><div class="stat-label">High Value Targets</div></div>
          <div class="stat-card info"><div class="stat-header"><div class="stat-icon info"><i class="fas fa-expand-arrows-alt"></i></div></div><div class="stat-value">${this.attackSurface.summary.blastRadius}</div><div class="stat-label">Blast Radius</div></div>
        </div>
        <div class="charts-grid" style="margin-top: 24px;">
          <div class="chart-card">
            <div class="chart-header"><h3 class="chart-title">Exposures</h3></div>
            <table>
              <thead><tr><th>Type</th><th>Count</th><th>Severity</th></tr></thead>
              <tbody>
                ${this.attackSurface.exposures.map(e => `
                  <tr><td>${e.type}</td><td>${e.count}</td><td><span class="severity-badge ${e.severity}">${this.capitalize(e.severity)}</span></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="chart-card">
            <div class="chart-header"><h3 class="chart-title">Attack Paths</h3></div>
            <div style="padding: 16px;">
              ${this.attackSurface.attackPaths.map(path => `
                <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${path.from} → ${path.to}</div>
                  <div style="font-size: 13px; color: var(--text-muted);">${path.description}</div>
                  <div style="margin-top: 8px;"><span class="severity-badge high">Risk: ${path.risk}</span></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderGraph() {
    if (!this.graph) return '<div class="content"><p>Loading...</p></div>';
    return `
      <header class="header">
        <div class="header-left">
          <div>
            <h1 class="page-title">Asset Relationship Graph</h1>
            <div class="breadcrumb">
              <a href="#" onclick="dashboard.navigate('dashboard'); return false;">Home</a>
              <i class="fas fa-chevron-right"></i>
              <span>Graph</span>
            </div>
          </div>
        </div>
      </header>
      <div class="content">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Asset Relationships</h3>
            <div class="chart-actions">
              <button class="btn btn-secondary"><i class="fas fa-expand"></i> Full Screen</button>
            </div>
          </div>
          <div style="padding: 20px;">
            <div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; align-items: center; min-height: 400px;">
              ${this.graph.nodes.map(node => `
                <div style="background: ${this.getNodeColor(node.criticality)}; padding: 16px 24px; border-radius: 12px; text-align: center; box-shadow: var(--shadow-md);">
                  <div style="font-weight: 600;">${this.escapeHtml(node.label)}</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${node.type}</div>
                  <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${node.id}</div>
                </div>
              `).join('')}
            </div>
            <div style="margin-top: 24px; text-align: center;">
              <div style="font-size: 13px; color: var(--text-muted);">Connections:</div>
              <div style="margin-top: 8px;">
                ${this.graph.edges.map(edge => `
                  <span class="status-badge" style="margin: 4px;">${edge.from} <i class="fas fa-arrow-right"></i> ${edge.to} (${edge.type})</span>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderAuditLog() {
    return `
      <header class="header">
        <div class="header-left">
          <div>
            <h1 class="page-title">Audit Logs</h1>
            <div class="breadcrumb">
              <a href="#" onclick="dashboard.navigate('dashboard'); return false;">Home</a>
              <i class="fas fa-chevron-right"></i>
              <span>Audit Logs</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <button class="btn btn-secondary"><i class="fas fa-download"></i> Export Logs</button>
        </div>
      </header>
      <div class="content">
        <div class="table-card">
          <div class="table-header">
            <h3 class="table-title">Recent Activity Logs</h3>
          </div>
          <table>
            <thead>
              <tr><th>Timestamp</th><th>Action</th><th>User</th><th>Details</th></tr>
            </thead>
            <tbody>
              <tr><td>2026-04-18 15:30</td><td><span class="status-badge open">finding.updated</span></td><td>admin@sentinel.local</td><td>finding-001 status: open</td></tr>
              <tr><td>2026-04-18 16:00</td><td><span class="status-badge open">scan.started</span></td><td>system</td><td>scan-003 type: configuration</td></tr>
              <tr><td>2026-04-18 12:00</td><td><span class="status-badge open">policy.evaluated</span></td><td>system</td><td>3 policies run, 1 finding</td></tr>
              <tr><td>2026-04-15 10:00</td><td><span class="status-badge resolved">asset.created</span></td><td>admin@sentinel.local</td><td>asset-006 type: function</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async runFullScan() {
    this.showToast('Scan Started', 'Running full security scan...', 'success');
    try {
      await this.client.runScan('full');
      this.showToast('Scan Complete', 'Full scan completed successfully', 'success');
    } catch (e) {
      this.showToast('Scan Failed', e.message, 'error');
    }
  }

  handleQuickAction(title) {
    switch (title) {
      case 'Run Full Scan': this.runFullScan(); break;
      case 'Run Policies': this.showToast('Policies', 'Evaluating security policies...', 'success'); break;
      case 'Export Report': this.showToast('Export', 'Generating report...', 'success'); break;
      case 'View Reports': this.navigate('dashboard'); break;
    }
  }

  handlePageChange(btn) {
    this.showToast('Pagination', 'Page change requested', 'success');
  }

  viewFinding(id) {
    const finding = this.findings.find(f => f.id === id);
    if (finding) {
      this.showToast('View Finding', `${finding.title}`, 'success');
    }
  }

  editFinding(id) {
    this.showToast('Edit Finding', `Editing ${id}`, 'success');
  }

  getSeverityIcon(severity) {
    const icons = { critical: 'radiation', high: 'exclamation-circle', medium: 'exclamation-triangle', low: 'info-circle' };
    return icons[severity] || 'circle';
  }

  getAssetIcon(assetId) {
    if (assetId?.startsWith('asset-001')) return 'code-branch';
    if (assetId?.startsWith('asset-002')) return 'cloud';
    return 'server';
  }

  getAssetTypeIcon(type) {
    const icons = { repository: 'code-branch', bucket: 'cloud', database: 'database', api: 'plug', container: 'cube', function: 'bolt' };
    return icons[type] || 'server';
  }

  getScanTypeIcon(type) {
    const icons = { secret: 'key', vulnerability: 'bug', configuration: 'cog', compliance: 'shield-alt', full: 'radar' };
    return icons[type] || 'search';
  }

  getNodeColor(criticality) {
    const colors = { critical: 'rgba(220, 38, 38, 0.3)', high: 'rgba(249, 115, 22, 0.3)', medium: 'rgba(234, 179, 8, 0.3)', low: 'rgba(34, 197, 94, 0.3)' };
    return colors[criticality] || 'rgba(17, 24, 39, 0.8)';
  }

  capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="toast-icon fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>
      <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
}

const dashboard = new Dashboard();
document.addEventListener('DOMContentLoaded', () => dashboard.init());
window.dashboard = dashboard;