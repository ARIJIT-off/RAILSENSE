// ═══════════════════════════════════════════════
// RailSmart — Delay & Analytics Dashboard
// Adapts to selected route from Search/MAP-TRACK
// ═══════════════════════════════════════════════

const AnalyticsPage = {
  name: 'analytics',
  _activeTab: 'delays',
  _routeStations: null,    // array of station codes on the active route
  _routeLabel: null,       // e.g. "Konnagar → Bally"

  render() {
    this._loadRoute();
    return `
      <div class="analytics-page">
        <div class="page-header">
          <h1>📊 Delay & Analytics Dashboard</h1>
          ${this._routeLabel
            ? `<p>Insights for <strong style="color:var(--accent-cyan);">${this._routeLabel}</strong></p>`
            : `<p>Comprehensive railway performance insights and track health analysis</p>`
          }
        </div>

        <!-- Stats Overview -->
        <div class="grid-4" style="margin-bottom:var(--space-6);">
          <div class="stat-card" style="animation: slideUp 0.3s ease both;">
            <div class="stat-value">${this._getAvgPunctuality()}%</div>
            <div class="stat-label">Avg Punctuality</div>
          </div>
          <div class="stat-card" style="animation: slideUp 0.35s ease both;">
            <div class="stat-value">${this._getAvgDelay()}m</div>
            <div class="stat-label">Avg Delay</div>
          </div>
          <div class="stat-card" style="animation: slideUp 0.4s ease both;">
            <div class="stat-value">${this._getTrackSections().length}</div>
            <div class="stat-label">Track Sections</div>
          </div>
          <div class="stat-card" style="animation: slideUp 0.45s ease both;">
            <div class="stat-value">${this._getAccidents().length}</div>
            <div class="stat-label">Risk Stations</div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-bar analytics-tabs">
          <button class="tab-item ${this._activeTab === 'delays' ? 'active' : ''}" data-atab="delays">🔗 Delay Causes</button>
          <button class="tab-item ${this._activeTab === 'speedup' ? 'active' : ''}" data-atab="speedup">⚡ Speed-Up</button>
          <button class="tab-item ${this._activeTab === 'track' ? 'active' : ''}" data-atab="track">🛤️ Track Health</button>
          <button class="tab-item ${this._activeTab === 'risk' ? 'active' : ''}" data-atab="risk">⚠️ Risk</button>
          <button class="tab-item ${this._activeTab === 'performance' ? 'active' : ''}" data-atab="performance">📈 Performance</button>
        </div>

        <div id="analytics-content"></div>
      </div>
    `;
  },

  // ── Load route from localStorage (saved by Search/MAP-TRACK) ──
  _loadRoute() {
    const savedRoute = getMapRoute();
    if (savedRoute && savedRoute.from && savedRoute.to) {
      const fromSt = findStation(savedRoute.from);
      const toSt = findStation(savedRoute.to);
      if (fromSt && toSt) {
        this._routeLabel = `${fromSt.name} → ${toSt.name}`;
        // Get all trains between these stations and collect their station codes
        const trains = searchTrainsBetweenStations(savedRoute.from, savedRoute.to);
        const codes = new Set();
        trains.forEach(t => {
          const fromIdx = t.route.findIndex(s => s.station === savedRoute.from);
          const toIdx = t.route.findIndex(s => s.station === savedRoute.to);
          if (fromIdx >= 0 && toIdx >= 0) {
            const start = Math.min(fromIdx, toIdx);
            const end = Math.max(fromIdx, toIdx);
            for (let i = start; i <= end; i++) codes.add(t.route[i].station);
          }
        });
        this._routeStations = codes.size > 0 ? [...codes] : null;
      }
    } else {
      this._routeStations = null;
      this._routeLabel = null;
    }
  },

  // ── Filtered data getters ──
  _getTrackSections() {
    if (!this._routeStations) return TRACK_SECTIONS;
    return TRACK_SECTIONS.filter(s =>
      this._routeStations.includes(s.from) || this._routeStations.includes(s.to)
    );
  },

  _getAccidents() {
    if (!this._routeStations) return ACCIDENT_HISTORY;
    return ACCIDENT_HISTORY.filter(a => this._routeStations.includes(a.station));
  },

  _getPerformance() {
    if (!this._routeStations) return TRAIN_PERFORMANCE;
    // Match trains that pass through the route stations
    const routeTrains = searchTrainsBetweenStations(
      getMapRoute()?.from, getMapRoute()?.to
    );
    const routeNumbers = new Set(routeTrains.map(t => t.number));
    const filtered = TRAIN_PERFORMANCE.filter(tp => routeNumbers.has(tp.trainNumber));
    return filtered.length > 0 ? filtered : TRAIN_PERFORMANCE;
  },

  _getSpeedups() {
    if (!this._routeStations) return SPEEDUP_OPPORTUNITIES;
    return SPEEDUP_OPPORTUNITIES.filter(op => {
      const parts = op.section.split('→').map(s => s.trim());
      return parts.some(code => this._routeStations.includes(code));
    });
  },

  _getAvgPunctuality() {
    const data = this._getPerformance();
    if (!data.length) return 0;
    return Math.round(data.reduce((a, b) => a + b.punctuality, 0) / data.length);
  },

  _getAvgDelay() {
    const data = this._getPerformance();
    if (!data.length) return 0;
    return Math.round(data.reduce((a, b) => a + b.avgDelay, 0) / data.length);
  },

  init() {
    this._renderContent();
    this._bindEvents();
  },

  _bindEvents() {
    on(document, 'click', (e) => {
      const tabBtn = e.target.closest('[data-atab]');
      if (tabBtn) {
        this._activeTab = tabBtn.dataset.atab;
        $$('[data-atab]').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        this._renderContent();
      }
    });
  },

  _renderContent() {
    const container = $('#analytics-content');
    if (!container) return;

    switch (this._activeTab) {
      case 'delays': container.innerHTML = this._renderDelayCauses(); break;
      case 'speedup': container.innerHTML = this._renderSpeedup(); break;
      case 'track': container.innerHTML = this._renderTrackHealth(); break;
      case 'risk': container.innerHTML = this._renderRisk(); break;
      case 'performance': container.innerHTML = this._renderPerformance(); break;
    }
  },

  _renderDelayCauses() {
    return `
      <div class="analytics-grid" style="animation: fadeIn 0.3s ease;">
        <div class="analytics-section analytics-full-width">
          <h3>🔗 Delay Causes Breakdown</h3>
          <p style="margin-bottom:var(--space-5); color:var(--text-tertiary);">Distribution of primary delay causes${this._routeLabel ? ` on ${this._routeLabel}` : ' across the network'}</p>
          <div class="bar-chart">
            ${DELAY_CAUSES.map((cause, i) => `
              <div class="bar-chart-row" style="animation: slideIn 0.3s ease both; animation-delay: ${i * 0.1}s;">
                <div class="bar-chart-label">${cause.icon} ${cause.label}</div>
                <div class="bar-chart-track">
                  <div class="bar-chart-fill" style="width:${cause.pct}%; background:${cause.color}; animation-delay: ${i * 0.1}s;">
                    ${cause.pct}%
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="analytics-section">
          <h3>📋 Key Insights</h3>
          <div style="display:flex; flex-direction:column; gap:var(--space-3);">
            <div class="card-flat" style="padding:var(--space-3);">
              <div style="font-size:var(--fs-sm); color:var(--text-secondary);">
                <strong style="color:var(--chart-cascading);">Cascading delays</strong> are the #1 cause, accounting for 32% of all delays. These occur when one delayed train impacts schedules of following trains on the same route.
              </div>
            </div>
            <div class="card-flat" style="padding:var(--space-3);">
              <div style="font-size:var(--fs-sm); color:var(--text-secondary);">
                <strong style="color:var(--chart-signal);">Signal failures</strong> contribute 24% — primarily on older sections with manual or semi-automatic signalling.
              </div>
            </div>
            <div class="card-flat" style="padding:var(--space-3);">
              <div style="font-size:var(--fs-sm); color:var(--text-secondary);">
                <strong style="color:var(--chart-weather);">Weather disruptions</strong> peak during monsoon (Jul-Sep) and fog season (Dec-Jan), especially on northern routes.
              </div>
            </div>
          </div>
        </div>

        <div class="analytics-section">
          <h3>🕐 Peak Delay Hours</h3>
          <div style="display:flex; flex-direction:column; gap:var(--space-2);">
            ${[
              { time: '06:00 - 09:00', pct: 65, label: 'Morning Rush' },
              { time: '09:00 - 12:00', pct: 35, label: 'Mid-Morning' },
              { time: '12:00 - 16:00', pct: 25, label: 'Afternoon' },
              { time: '16:00 - 19:00', pct: 55, label: 'Evening Rush' },
              { time: '19:00 - 22:00', pct: 70, label: 'Night Peak' },
              { time: '22:00 - 06:00', pct: 45, label: 'Overnight' },
            ].map(slot => `
              <div style="display:flex; align-items:center; gap:var(--space-2); font-size:var(--fs-sm);">
                <span style="min-width:110px; color:var(--text-tertiary); font-family:var(--font-mono); font-size:var(--fs-xs);">${slot.time}</span>
                <div style="flex:1; height:16px; background:var(--bg-tertiary); border-radius:var(--radius-sm); overflow:hidden;">
                  <div style="height:100%; width:${slot.pct}%; background: linear-gradient(90deg, var(--accent-blue), var(--accent-cyan)); border-radius:var(--radius-sm); animation: barGrow 0.8s ease both;"></div>
                </div>
                <span style="min-width:30px; color:var(--text-muted); font-size:var(--fs-xs);">${slot.pct}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  _renderSpeedup() {
    const speedups = this._getSpeedups();
    return `
      <div style="animation: fadeIn 0.3s ease;">
        <div class="analytics-section" style="margin-bottom:var(--space-4);">
          <h3>⚡ Speed-Up Opportunities</h3>
          <p style="color:var(--text-tertiary); margin-bottom:var(--space-5);">Track sections where infrastructure upgrades could significantly reduce journey times${this._routeLabel ? ` on ${this._routeLabel}` : ''}</p>
        </div>
        ${speedups.length === 0 ? '<div style="text-align:center; color:var(--text-muted); padding:var(--space-6);">No speed-up data for this route segment</div>' : ''}
        <div style="display:flex; flex-direction:column; gap:var(--space-4);">
          ${speedups.map((op, i) => `
            <div class="card" style="animation: slideUp 0.3s ease both; animation-delay: ${i * 0.1}s;">
              <div class="flex-between" style="margin-bottom:var(--space-3);">
                <div>
                  <div style="font-weight:var(--fw-semibold); font-size:var(--fs-md);">🛤️ ${op.section}</div>
                  <div style="font-size:var(--fs-sm); color:var(--text-tertiary);">${op.details}</div>
                </div>
                <span class="badge ${op.priority === 'high' ? 'badge-major-delay' : 'badge-minor-delay'}" style="text-transform:capitalize;">
                  ${op.priority} priority
                </span>
              </div>
              <div class="grid-3" style="gap:var(--space-4);">
                <div>
                  <div style="font-size:var(--fs-xs); color:var(--text-muted); text-transform:uppercase;">Current Speed</div>
                  <div style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--status-minor-delay);">${op.currentSpeed} km/h</div>
                </div>
                <div>
                  <div style="font-size:var(--fs-xs); color:var(--text-muted); text-transform:uppercase;">Potential Speed</div>
                  <div style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--status-ontime);">${op.potentialSpeed} km/h</div>
                </div>
                <div>
                  <div style="font-size:var(--fs-xs); color:var(--text-muted); text-transform:uppercase;">Time Saved</div>
                  <div style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--accent-cyan);">${op.timeSaved} min</div>
                </div>
              </div>
              <div style="margin-top:var(--space-3); font-size:var(--fs-sm); color:var(--text-muted);">
                💰 Estimated Investment: <strong style="color:var(--text-secondary);">${op.investment}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  _renderTrackHealth() {
    const sections = this._getTrackSections();
    return `
      <div style="animation: fadeIn 0.3s ease;">
        <div class="analytics-section" style="margin-bottom:var(--space-4);">
          <h3>🛤️ Track Health Scores</h3>
          <p style="color:var(--text-tertiary); margin-bottom:var(--space-3);">Health scores${this._routeLabel ? ` for ${this._routeLabel}` : ''} computed from rail age, material, signalling type, and last upgrade year</p>
          <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-4);">
            <span class="badge badge-ontime">● Good (80+)</span>
            <span class="badge badge-minor-delay">● Fair (60-79)</span>
            <span class="badge badge-major-delay">● Poor (&lt;60)</span>
          </div>
        </div>
        ${sections.length === 0 ? '<div style="text-align:center; color:var(--text-muted); padding:var(--space-6);">No track health data for this route segment</div>' : ''}
        <div style="display:flex; flex-direction:column; gap:var(--space-2);">
          ${sections.map((section, i) => {
            const health = getTrackHealthLabel(section.score);
            return `
              <div class="track-segment" style="animation: slideIn 0.3s ease both; animation-delay: ${i * 0.05}s;">
                <div class="track-score ${health.class}">${section.score}</div>
                <div style="flex:1;">
                  <div style="font-weight:var(--fw-medium); font-size:var(--fs-sm);">${section.from} → ${section.to}</div>
                  <div style="font-size:var(--fs-xs); color:var(--text-muted);">${section.distKm} km · ${section.railType} rail · ${section.signalling} signalling</div>
                </div>
                <div style="text-align:right; font-size:var(--fs-xs); color:var(--text-muted);">
                  <div>Age: ${section.age}yr</div>
                  <div>Upgraded: ${section.lastUpgrade}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  _renderRisk() {
    const accidents = this._getAccidents();
    return `
      <div style="animation: fadeIn 0.3s ease;">
        <div class="analytics-section" style="margin-bottom:var(--space-4);">
          <h3>⚠️ Historical Accident Risk${this._routeLabel ? ` — ${this._routeLabel}` : ' by Station'}</h3>
          <p style="color:var(--text-tertiary);">Based on incident records and operational risk assessment</p>
        </div>
        ${accidents.length === 0 ? '<div style="text-align:center; color:var(--text-muted); padding:var(--space-6);">No risk data for this route segment</div>' : ''}
        <div style="display:flex; flex-direction:column; gap:var(--space-3);">
          ${accidents.sort((a, b) => b.incidents - a.incidents).map((entry, i) => {
            const style = getRiskLevelStyle(entry.riskLevel);
            const stationInfo = findStation(entry.station);
            return `
              <div class="card-flat" style="animation: slideUp 0.3s ease both; animation-delay: ${i * 0.08}s;">
                <div class="flex-between" style="margin-bottom:var(--space-2);">
                  <div>
                    <span style="font-weight:var(--fw-semibold);">${stationInfo?.name || entry.station}</span>
                    <span style="font-family:var(--font-mono); font-size:var(--fs-xs); color:var(--text-muted); margin-left:var(--space-2);">(${entry.station})</span>
                  </div>
                  <span class="badge" style="background:${style.bg}; color:${style.color}; border:1px solid ${style.color}30; text-transform:capitalize;">
                    ${entry.riskLevel} risk
                  </span>
                </div>
                <div style="font-size:var(--fs-sm); color:var(--text-tertiary);">
                  ${entry.description}
                </div>
                <div style="display:flex; gap:var(--space-4); margin-top:var(--space-2); font-size:var(--fs-xs); color:var(--text-muted);">
                  <span>📋 ${entry.incidents} incidents</span>
                  <span>📅 Last: ${entry.lastIncident}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  _renderPerformance() {
    const perf = this._getPerformance();
    return `
      <div style="animation: fadeIn 0.3s ease;">
        <div class="analytics-section analytics-full-width" style="margin-bottom:var(--space-4);">
          <h3>📈 Train Performance${this._routeLabel ? ` — ${this._routeLabel}` : ''}</h3>
        </div>
        ${perf.length === 0 ? '<div style="text-align:center; color:var(--text-muted); padding:var(--space-6);">No performance data for this route</div>' : ''}
        <div class="card-flat" style="overflow-x:auto;">
          <table class="pnr-table">
            <thead>
              <tr>
                <th>Train</th>
                <th>Number</th>
                <th>Punctuality</th>
                <th>Avg Delay</th>
                <th>On-Time Runs</th>
                <th>Total Runs</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              ${perf.sort((a, b) => b.punctuality - a.punctuality).map((tp, i) => {
                const pColor = tp.punctuality >= 85 ? 'var(--status-ontime)' : tp.punctuality >= 75 ? 'var(--status-minor-delay)' : 'var(--status-major-delay)';
                const trend = tp.punctuality >= 85 ? '📈' : tp.punctuality >= 75 ? '➡️' : '📉';
                return `
                  <tr style="animation: slideIn 0.3s ease both; animation-delay: ${i * 0.05}s;">
                    <td style="font-weight:var(--fw-medium); color:var(--text-primary);">${tp.name}</td>
                    <td><span style="font-family:var(--font-mono); font-size:var(--fs-xs); color:var(--text-muted);">${tp.trainNumber}</span></td>
                    <td><span style="color:${pColor}; font-weight:var(--fw-bold);">${tp.punctuality}%</span></td>
                    <td>${tp.avgDelay}m</td>
                    <td>${tp.onTimeRuns}</td>
                    <td>${tp.totalRuns}</td>
                    <td>${trend}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  destroy() {}
};
