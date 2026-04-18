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

  async getAssets() {
    return this.fetchJSON('/api/v1/assets');
  }

  async getFindings() {
    return this.fetchJSON('/api/v1/findings');
  }

  async getHealth() {
    return this.fetchJSON('/health');
  }

  async runScan(assetType) {
    return this.fetchJSON(`/api/v1/scans/run?type=${assetType}`);
  }
}

class Dashboard {
  constructor() {
    this.client = new SentinelClient(API_BASE);
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.findings = [];
    this.assets = [];
    this.filter = 'all';
    this.searchQuery = '';
  }

  async init() {
    this.setupEventListeners();
    await this.loadData();
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(item.dataset.nav);
      });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.textContent.toLowerCase();
        this.renderFindings();
      });
    });

    const searchInput = document.querySelector('.table-search input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderFindings();
    });

    document.querySelectorAll('.action-card').forEach(card => {
      card.addEventListener('click', () => {
        const title = card.querySelector('h4').textContent;
        this.handleQuickAction(title);
      });
    });

    document.querySelectorAll('.chart-period').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-period').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  navigate(view) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-nav="${view}"]`)?.classList.add('active');
    this.showToast('Navigation', `Navigated to ${view}`, 'success');
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
      statusEl.textContent = `Connected to ${health.service}`;
      statusEl.style.color = 'var(--accent-primary)';
      statusBarDot.classList.add('online');
      statusBarDot.classList.remove('offline');
      
      this.findings = await this.client.getFindings();
      this.assets = await this.client.getAssets();
      this.renderFindings();
      this.updateLastSync();
      
    } catch (error) {
      console.error('Failed to load data:', error);
      statusEl.textContent = 'API unavailable, showing static data.';
      statusEl.style.color = 'var(--warning)';
      statusBarDot.classList.remove('online');
      statusBarDot.classList.add('offline');
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

  renderFindings() {
    const tbody = document.getElementById('findingsTable');
    if (!tbody) return;

    let filteredFindings = this.findings;

    if (this.filter !== 'all') {
      if (this.filter === 'open') {
        filteredFindings = filteredFindings.filter(f => f.status === 'open');
      } else if (this.filter === 'critical') {
        filteredFindings = filteredFindings.filter(f => f.severity === 'critical');
      } else if (this.filter === 'high') {
        filteredFindings = filteredFindings.filter(f => f.severity === 'high');
      } else if (this.filter === 'in triage') {
        filteredFindings = filteredFindings.filter(f => f.status === 'triage');
      }
    }

    if (this.searchQuery) {
      filteredFindings = filteredFindings.filter(f => 
        f.title.toLowerCase().includes(this.searchQuery) ||
        f.id.toLowerCase().includes(this.searchQuery)
      );
    }

    if (filteredFindings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px;"></i>
            <div>No findings match your criteria</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredFindings.map(finding => `
      <tr>
        <td>
          <div style="font-weight: 600;">${this.escapeHtml(finding.title)}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">ID: ${this.escapeHtml(finding.id)}</div>
        </td>
        <td>
          <span class="severity-badge ${finding.severity}">
            <i class="fas fa-${this.getSeverityIcon(finding.severity)}"></i>
            ${this.capitalize(finding.severity)}
          </span>
        </td>
        <td>
          <span class="asset-tag">
            <i class="fas fa-${this.getAssetIcon(finding.assetId)}"></i>
            ${this.escapeHtml(finding.assetId)}
          </span>
        </td>
        <td>
          <span class="status-badge ${finding.status}">
            <i class="fas fa-circle" style="font-size: 8px;"></i>
            ${this.capitalize(finding.status)}
          </span>
        </td>
        <td>2026-04-18</td>
        <td>
          <button class="action-btn" title="View Details" onclick="dashboard.viewFinding('${finding.id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn" title="Edit" onclick="dashboard.editFinding('${finding.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn" title="More">
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  viewFinding(id) {
    const finding = this.findings.find(f => f.id === id);
    if (finding) {
      this.showToast('View Finding', `Opened details for ${id}`, 'success');
    }
  }

  editFinding(id) {
    this.showToast('Edit Finding', `Editing ${id}`, 'success');
  }

  getSeverityIcon(severity) {
    const icons = {
      critical: 'radiation',
      high: 'exclamation-circle',
      medium: 'exclamation-triangle',
      low: 'info-circle'
    };
    return icons[severity] || 'circle';
  }

  getAssetIcon(assetId) {
    if (assetId.startsWith('repo:')) return 'code-branch';
    if (assetId.startsWith('cloud:bucket:')) return 'cloud';
    if (assetId.startsWith('cloud:')) return 'cloud';
    return 'server';
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async handleQuickAction(title) {
    switch (title) {
      case 'Run Full Scan':
        this.showToast('Scan Started', 'Running full asset scan...', 'success');
        break;
      case 'Run Policies':
        this.showToast('Policies', 'Evaluating security policies...', 'success');
        break;
      case 'Export Report':
        this.showToast('Export', 'Generating report...', 'success');
        break;
      case 'View Reports':
        this.showToast('Reports', 'Opening analytics dashboard...', 'success');
        break;
    }
  }

  updateLastSync() {
    const lastSyncEl = document.getElementById('lastSync');
    if (lastSyncEl) {
      lastSyncEl.textContent = 'Just now';
    }
  }

  showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="toast-icon fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
}

const dashboard = new Dashboard();
document.addEventListener('DOMContentLoaded', () => dashboard.init());

window.dashboard = dashboard;