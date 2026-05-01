async function loadOverview() {
  const response = await fetch('http://127.0.0.1:8080/api/v1/overview');
  const data = await response.json();
  document.querySelector('[data-total-assets]').textContent = data.totalAssets;
  document.querySelector('[data-total-findings]').textContent = data.totalFindings;
  document.querySelector('[data-critical]').textContent = data.severities.critical;
  document.querySelector('[data-high]').textContent = data.severities.high;
}

loadOverview().catch(() => {
  document.querySelector('[data-status]').textContent = 'API unavailable, showing static console state.';
});
