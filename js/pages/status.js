// ═══════════════════════════════════════════════
// RailSmart — Live Running Status Page
// ═══════════════════════════════════════════════

const StatusPage = {
  name: 'status',
  _selectedTrain: null,
  _liveData: null,
  _refreshInterval: null,
  _refreshTimer: null,

  render() {
    return `
      <div class="status-page">
        <div class="page-header">
          <h1>📍 Live Running Status</h1>
          <p>Track your train in real-time with station-by-station updates</p>
        </div>

        <div class="status-search">
          <input class="input" type="text" placeholder="Enter train number (e.g. 12951)" id="status-train-input" autocomplete="off">
          <button class="btn btn-primary" id="status-search-btn">Track</button>
          <button class="btn btn-secondary" id="status-map-btn" style="white-space:nowrap; display:none;">🗺️ Track on Map</button>
        </div>

        <div id="status-content"></div>
      </div>
    `;
  },

  init() {
    // Check if a train was pre-selected
    const savedTrain = getSelectedTrain();
    if (savedTrain) {
      const input = $('#status-train-input');
      if (input) input.value = savedTrain;
      this._loadTrain(savedTrain);
    }

    this._bindEvents();
  },

  _bindEvents() {
    on(document, 'click', (e) => {
      if (e.target.closest('#status-search-btn')) {
        const input = $('#status-train-input');
        if (input && input.value.trim()) {
          this._loadTrain(input.value.trim());
        }
      }
      if (e.target.closest('#status-map-btn')) {
        if (this._selectedTrain) {
          localStorage.removeItem('railsmart_map_route'); // clear active route
          saveSelectedTrain(this._selectedTrain.number);
          window.location.hash = '#map';
        }
      }
      if (e.target.closest('#refresh-btn')) {
        this._refreshData();
      }
    });

    on(document, 'keydown', (e) => {
      if (e.target.id === 'status-train-input' && e.key === 'Enter') {
        this._loadTrain(e.target.value.trim());
      }
    });
  },

  _loadTrain(query) {
    const train = TRAINS.find(t => t.number === query || t.name.toLowerCase().includes(query.toLowerCase()));
    if (!train) {
      this._showNotFound();
      const mapBtn = $('#status-map-btn');
      if (mapBtn) mapBtn.style.display = 'none';
      return;
    }

    this._selectedTrain = train;
    saveSelectedTrain(train.number);
    this._refreshData();
    this._startAutoRefresh();

    const mapBtn = $('#status-map-btn');
    if (mapBtn) mapBtn.style.display = 'inline-flex';
  },

  _refreshData() {
    if (!this._selectedTrain) return;
    this._liveData = generateLiveData(this._selectedTrain);
    this._renderStatus();
  },

  _startAutoRefresh() {
    this._stopAutoRefresh();
    this._refreshInterval = setInterval(() => {
      this._refreshData();
    }, 60000);

    // Restart the progress bar animation
    this._restartProgressBar();
  },

  _stopAutoRefresh() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = null;
    }
  },

  _restartProgressBar() {
    const bar = $('#refresh-fill');
    if (bar) {
      bar.style.animation = 'none';
      bar.offsetHeight; // Trigger reflow
      bar.style.animation = 'refreshProgress 60s linear';
    }
  },

  _showNotFound() {
    const container = $('#status-content');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🚫</div>
          <div class="empty-state-title">Train not found</div>
          <div class="empty-state-text">Please check the train number and try again</div>
        </div>
      `;
    }
  },

  _renderStatus() {
    const container = $('#status-content');
    if (!container || !this._liveData) return;

    const data = this._liveData;
    const delayInfo = getDelayInfo(data.overallDelay);
    const lastStation = data.liveRoute[data.currentStationIdx];
    const finalStation = data.liveRoute[data.liveRoute.length - 1];
    const currentMin = getCurrentSimMinutes();
    const eta = finalStation.actualArrival ? getCountdown(finalStation.actualArrival, currentMin) : '--';

    container.innerHTML = `
      <!-- Refresh Bar -->
      <div class="refresh-bar">
        <div class="refresh-bar-fill" id="refresh-fill"></div>
      </div>

      <!-- Summary Card -->
      <div class="status-summary" style="animation: slideUp 0.4s ease;">
        <div class="status-summary-info">
          <h2>${data.name}</h2>
          <div class="train-number">#${data.number} · ${getTrainTypeLabel(data.type)}</div>
          <div class="status-summary-meta">
            <span>📍 Last: <strong>${lastStation.stationInfo?.name || lastStation.station}</strong></span>
            <span>🎯 ETA: <strong>${eta}</strong></span>
          </div>
        </div>
        <div style="text-align:right;">
          <span class="badge ${delayInfo.class}" style="font-size: var(--fs-sm); padding: var(--space-2) var(--space-4);">
            ${data.status === 'cancelled' ? '❌ Cancelled' : delayInfo.label}
          </span>
          <br>
          <button class="btn btn-ghost btn-sm" id="refresh-btn" style="margin-top:var(--space-2)">↻ Refresh</button>
        </div>
      </div>

      <!-- Timeline -->
      <div class="status-timeline-container" style="animation: slideUp 0.5s ease;">
        <h3 style="margin-bottom: var(--space-6); display:flex; align-items:center; gap:var(--space-2);">
          🛤️ Station Timeline
        </h3>
        <div class="timeline">
          ${data.liveRoute.map((stop, i) => this._renderTimelineItem(stop, i, data)).join('')}
        </div>
      </div>
    `;

    this._restartProgressBar();
  },

  _renderTimelineItem(stop, index, data) {
    const isCurrent = index === data.currentStationIdx;
    const isPassed = stop.hasPassed;
    const isLast = index === data.liveRoute.length - 1;
    const isFirst = index === 0;

    let statusClass = 'upcoming';
    if (isCurrent) statusClass = 'current';
    else if (isPassed) statusClass = 'passed';
    if (stop.delay > 15) statusClass += ' delayed';

    const delayMin = stop.delay || 0;
    let delayBadge = '';
    if (delayMin > 0 && (isPassed || isCurrent)) {
      const delayClass = delayMin > 30 ? 'very-late' : 'late';
      delayBadge = `<span class="timeline-delay ${delayClass}">+${delayMin}m</span>`;
    } else if (isPassed && delayMin <= 0) {
      delayBadge = `<span class="timeline-delay early">On Time</span>`;
    }

    const scheduledArr = isFirst ? '--' : formatTime(stop.arrivalMin);
    const scheduledDep = isLast ? '--' : formatTime(stop.departureMin);
    const actualArr = isFirst ? '--' : formatTime(stop.actualArrival);
    const actualDep = isLast ? '--' : formatTime(stop.actualDeparture);

    const actualArrClass = stop.delay > 30 ? 'actual major-delayed' : stop.delay > 15 ? 'actual delayed' : 'actual';

    return `
      <div class="timeline-item ${statusClass}" style="animation: slideIn 0.3s ease both; animation-delay: ${index * 0.06}s;">
        <div class="timeline-dot"></div>
        <div>
          <div class="timeline-station">
            ${stop.stationInfo?.name || stop.station} 
            <span style="color:var(--text-muted); font-family:var(--font-mono); font-size:var(--fs-xs);">(${stop.station})</span>
            ${isCurrent ? '<span style="color:var(--accent-cyan); font-size:var(--fs-xs); margin-left:var(--space-2);">● CURRENT</span>' : ''}
            ${delayBadge}
          </div>
          <div class="timeline-times">
            ${!isFirst ? `<span class="scheduled">Arr: ${scheduledArr}</span>` : ''}
            ${!isFirst && (isPassed || isCurrent) ? `<span class="${actualArrClass}">→ ${actualArr}</span>` : ''}
            ${!isLast ? `<span class="scheduled">Dep: ${scheduledDep}</span>` : ''}
            ${!isLast && isPassed ? `<span class="${actualArrClass}">→ ${actualDep}</span>` : ''}
          </div>
          <div class="timeline-platform">
            Platform ${stop.platform} · ${stop.distKm} km from origin
          </div>
        </div>
      </div>
    `;
  },

  destroy() {
    this._stopAutoRefresh();
  }
};
