// ═══════════════════════════════════════════════
// RailSmart — PNR Status Page
// ═══════════════════════════════════════════════

const PNRPage = {
  name: 'pnr',
  _currentPNR: null,

  render() {
    return `
      <div class="pnr-page">
        <div class="page-header">
          <h1>🎫 PNR Status</h1>
          <p>Check your booking status, coach, berth and reservation details</p>
        </div>

        <div class="pnr-search-box">
          <div style="font-size:48px; margin-bottom:var(--space-4);">🔖</div>
          <h3>Enter your PNR Number</h3>
          <p style="color:var(--text-muted); font-size:var(--fs-sm);">10-digit PNR number from your ticket</p>
          <div class="pnr-input-wrapper">
            <input class="input" type="text" maxlength="10" placeholder="0000000000" id="pnr-input" autocomplete="off">
            <button class="btn btn-primary" id="pnr-check-btn">Check</button>
          </div>
          <div style="margin-top:var(--space-4);">
            <div style="font-size:var(--fs-xs); color:var(--text-muted); margin-bottom:var(--space-2);">Try a sample PNR:</div>
            <div class="pnr-quick-list">
              ${getAllPNRNumbers().slice(0, 5).map(pnr => `
                <button class="pnr-quick-btn" data-pnr="${pnr}">${pnr}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <div id="pnr-result"></div>
      </div>
    `;
  },

  init() {
    this._bindEvents();
  },

  _bindEvents() {
    on(document, 'click', (e) => {
      if (e.target.closest('#pnr-check-btn')) {
        const input = $('#pnr-input');
        if (input) this._checkPNR(input.value.trim());
      }

      const quickBtn = e.target.closest('[data-pnr]');
      if (quickBtn) {
        const pnr = quickBtn.dataset.pnr;
        const input = $('#pnr-input');
        if (input) input.value = pnr;
        this._checkPNR(pnr);
      }
    });

    on(document, 'keydown', (e) => {
      if (e.target.id === 'pnr-input' && e.key === 'Enter') {
        this._checkPNR(e.target.value.trim());
      }
    });
  },

  _checkPNR(pnrNumber) {
    const result = lookupPNR(pnrNumber);
    const container = $('#pnr-result');
    if (!container) return;

    if (!result) {
      container.innerHTML = `
        <div class="empty-state" style="animation: slideUp 0.3s ease;">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">PNR not found</div>
          <div class="empty-state-text">Please check the PNR number and try again. Try one of the sample PNRs above.</div>
        </div>
      `;
      return;
    }

    this._currentPNR = result;
    this._renderResult(result, container);
  },

  _renderResult(pnr, container) {
    const fromStation = findStation(pnr.from);
    const toStation = findStation(pnr.to);
    const chartClass = pnr.chartStatus === 'Prepared' ? 'badge-ontime' : 'badge-minor-delay';

    container.innerHTML = `
      <div class="pnr-result">
        <div class="pnr-result-header">
          <div class="flex-between" style="margin-bottom:var(--space-4);">
            <div>
              <div style="font-size:var(--fs-xs); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">PNR Number</div>
              <div style="font-size:var(--fs-2xl); font-weight:var(--fw-bold); font-family:var(--font-mono); color:var(--text-primary);">${pnr.pnr}</div>
            </div>
            <span class="badge ${chartClass}" style="font-size:var(--fs-sm); padding:var(--space-2) var(--space-4);">
              Chart: ${pnr.chartStatus}
            </span>
          </div>

          <div style="font-size:var(--fs-md); font-weight:var(--fw-semibold); color:var(--text-primary);">${pnr.trainName}</div>
          <div style="font-size:var(--fs-sm); color:var(--text-tertiary);">#${pnr.trainNumber} · Class: ${pnr.class} · ${pnr.journeyDate}</div>

          <div class="pnr-journey-info">
            <div class="pnr-journey-station">
              <div class="code">${pnr.from}</div>
              <div class="name">${fromStation?.name || pnr.from}</div>
            </div>
            <div class="pnr-journey-arrow">→</div>
            <div class="pnr-journey-station">
              <div class="code">${pnr.to}</div>
              <div class="name">${toStation?.name || pnr.to}</div>
            </div>
          </div>
        </div>

        <div class="pnr-result-body">
          <h4 style="margin-bottom:var(--space-4); color:var(--text-secondary);">👤 Passenger Details</h4>
          <table class="pnr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Passenger</th>
                <th>Age/Gender</th>
                <th>Booking Status</th>
                <th>Current Status</th>
                <th>Coach</th>
                <th>Berth</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              ${pnr.passengers.map((p, i) => {
                let statusClass = 'pnr-status-cnf';
                if (p.current.startsWith('RAC')) statusClass = 'pnr-status-rac';
                else if (p.current.startsWith('WL')) statusClass = 'pnr-status-wl';

                return `
                  <tr style="animation: slideIn 0.3s ease both; animation-delay: ${i * 0.08}s;">
                    <td>${i + 1}</td>
                    <td style="font-weight:var(--fw-medium); color:var(--text-primary);">${p.name}</td>
                    <td>${p.age} / ${p.gender}</td>
                    <td><span class="${statusClass}">${p.booking}</span></td>
                    <td><span class="${statusClass}">${p.current}</span></td>
                    <td style="font-family:var(--font-mono);">${p.coach}</td>
                    <td style="font-family:var(--font-mono);">${p.berth}</td>
                    <td>${p.berthType}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          ${pnr.boardingPoint !== pnr.from ? `
            <div style="margin-top:var(--space-4); padding:var(--space-3); background:var(--status-minor-delay-bg); border-radius:var(--radius-md); font-size:var(--fs-sm); color:var(--status-minor-delay);">
              ⚠️ Boarding Point: <strong>${pnr.boardingPoint}</strong> (different from booking station)
            </div>
          ` : ''}

          <div style="margin-top:var(--space-6); display:flex; gap:var(--space-3);">
            <button class="btn btn-secondary" onclick="window.location.hash='#status'; saveSelectedTrain('${pnr.trainNumber}');">
              📍 Track This Train
            </button>
            <button class="btn btn-secondary" onclick="window.location.hash='#map'; saveSelectedTrain('${pnr.trainNumber}');">
              🗺️ View on Map
            </button>
          </div>
        </div>
      </div>
    `;
  },

  destroy() {}
};
