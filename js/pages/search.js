// ═══════════════════════════════════════════════
// RailSmart — Search & Discovery Page
// ═══════════════════════════════════════════════

const SearchPage = {
  name: 'search',
  _searchMode: 'stations', // 'stations' | 'train'
  _typeFilter: 'all',      // 'all' | 'express' | 'local' | 'metro'
  _sortBy: 'nearest',    // default: soonest departure after now
  _fareFilter: [],
  _selectedDate: new Date(),
  _results: [],
  _fromStation: null,
  _toStation: null,

  render() {
    return `
      <div class="search-page">
        <div class="page-header">
          <h1>🔍 Search Trains</h1>
          <p>Find trains between stations or search by train number</p>
        </div>

        <div class="search-box" id="search-box">
          <!-- Search Mode Tabs -->
          <div class="search-mode-tabs">
            <button class="tab-item ${this._searchMode === 'stations' ? 'active' : ''}" data-mode="stations" id="mode-stations">Between Stations</button>
            <button class="tab-item ${this._searchMode === 'train' ? 'active' : ''}" data-mode="train" id="mode-train">Train Number / Name</button>
          </div>

          ${this._searchMode === 'stations' ? this._renderStationSearch() : this._renderTrainSearch()}
        </div>

        <!-- Filter Tabs -->
        <div class="tab-bar" style="margin-bottom: var(--space-4);">
          <button class="tab-item ${this._typeFilter === 'all' ? 'active' : ''}" data-type="all" id="filter-all">All</button>
          <button class="tab-item ${this._typeFilter === 'express' ? 'active' : ''}" data-type="express" id="filter-express">🚄 Express</button>
          <button class="tab-item ${this._typeFilter === 'local' ? 'active' : ''}" data-type="local" id="filter-local">🚃 Local</button>
        </div>

        <!-- Results -->
        <div id="search-results"></div>

        <!-- Search History -->
        <div id="search-history-section"></div>
      </div>
    `;
  },

  _renderStationSearch() {
    const dateLabel = getDateLabel(this._selectedDate);
    return `
      <div class="search-fields">
        <div class="input-group autocomplete" id="from-autocomplete">
          <label>From Station</label>
          <input class="input input-with-icon" type="text" placeholder="Enter station name or code"
            id="from-input" value="${this._fromStation ? this._fromStation.name : ''}" autocomplete="off">
          <span class="input-icon">🚉</span>
          <div class="autocomplete-dropdown" id="from-dropdown" style="display:none"></div>
        </div>
        <button class="search-swap-btn" id="swap-btn" title="Swap stations">⇄</button>
        <div class="input-group autocomplete" id="to-autocomplete">
          <label>To Station</label>
          <input class="input input-with-icon" type="text" placeholder="Enter station name or code"
            id="to-input" value="${this._toStation ? this._toStation.name : ''}" autocomplete="off">
          <span class="input-icon">🏁</span>
          <div class="autocomplete-dropdown" id="to-dropdown" style="display:none"></div>
        </div>
      </div>

      <div class="search-date-row">
        <button class="chip ${dateLabel === 'Today' ? 'selected' : ''}" data-date="today" id="date-today">📅 Today</button>
        <button class="chip ${dateLabel === 'Tomorrow' ? 'selected' : ''}" data-date="tomorrow" id="date-tomorrow">📅 Tomorrow</button>
        <input type="date" class="input" style="max-width: 180px;" id="date-picker"
          value="${this._selectedDate.toISOString().split('T')[0]}">
      </div>

      <div class="search-filters">
        <span style="font-size: var(--fs-sm); color: var(--text-tertiary); margin-right: var(--space-2);">Fare Class:</span>
        ${FARE_CLASSES.map(fc => `
          <button class="chip ${this._fareFilter.includes(fc) ? 'selected' : ''}" data-fare="${fc}" id="fare-${fc}">${fc}</button>
        `).join('')}
      </div>

      <div class="search-actions">
        <button class="btn btn-primary btn-lg" id="search-btn" onclick="SearchPage.doSearch()">
          🔍 Search Trains
        </button>
      </div>
    `;
  },

  _renderTrainSearch() {
    return `
      <div class="input-group" style="max-width: 500px;">
        <label>Train Number or Name</label>
        <input class="input input-with-icon" type="text" placeholder="e.g. 12951 or Rajdhani"
          id="train-query-input" autocomplete="off">
        <span class="input-icon">🚆</span>
      </div>
      <div style="margin-top: var(--space-4);">
        <button class="btn btn-primary btn-lg" id="train-search-btn">
          🔍 Search
        </button>
      </div>
    `;
  },

  init() {
    this._bindEvents();
    this._renderHistory();
  },

  _bindEvents() {
    // Mode tabs
    on(document, 'click', (e) => {
      const modeBtn = e.target.closest('[data-mode]');
      if (modeBtn) {
        this._searchMode = modeBtn.dataset.mode;
        this._rerender();
      }

      // Type filter tabs
      const typeBtn = e.target.closest('[data-type]');
      if (typeBtn) {
        this._typeFilter = typeBtn.dataset.type;
        $$('[data-type]').forEach(b => b.classList.remove('active'));
        typeBtn.classList.add('active');
        if (this._results.length) this._displayResults();
      }

      // Fare filter chips
      const fareBtn = e.target.closest('[data-fare]');
      if (fareBtn) {
        const fare = fareBtn.dataset.fare;
        if (this._fareFilter.includes(fare)) {
          this._fareFilter = this._fareFilter.filter(f => f !== fare);
          fareBtn.classList.remove('selected');
        } else {
          this._fareFilter.push(fare);
          fareBtn.classList.add('selected');
        }
      }

      // Date chips
      const dateBtn = e.target.closest('[data-date]');
      if (dateBtn) {
        const d = dateBtn.dataset.date;
        if (d === 'today') this._selectedDate = new Date();
        else if (d === 'tomorrow') {
          const t = new Date(); t.setDate(t.getDate() + 1);
          this._selectedDate = t;
        }
        this._rerender();
      }

      // Swap
      if (e.target.closest('#swap-btn')) {
        const temp = this._fromStation;
        this._fromStation = this._toStation;
        this._toStation = temp;
        this._rerender();
      }

      // Train card click → go to MAP-TRACK
      const trainCard = e.target.closest('.train-card[data-train]');
      if (trainCard) {
        const trainNum = trainCard.dataset.train;
        saveSelectedTrain(trainNum);
        // Save from/to so MAP-TRACK auto-populates
        if (this._fromStation && this._toStation) {
          saveMapRoute(this._fromStation.code, this._toStation.code);
        }
        window.location.hash = '#map';  // → MAP-TRACK
      }

      // Search history click
      const histItem = e.target.closest('.search-history-item');
      if (histItem) {
        const from = histItem.dataset.from;
        const to = histItem.dataset.to;
        if (from && to) {
          this._fromStation = findStation(from);
          this._toStation = findStation(to);
          this._searchMode = 'stations';
          this._rerender();
          this.doSearch();
        }
      }

      // Clear history
      if (e.target.closest('#clear-history')) {
        clearSearchHistory();
        this._renderHistory();
      }

      // Sort buttons
      const sortBtn = e.target.closest('[data-sort]');
      if (sortBtn) {
        this._sortBy = sortBtn.dataset.sort;
        $$('[data-sort]').forEach(b => b.classList.remove('active'));
        sortBtn.classList.add('active');
        if (this._results.length) this._displayResults();
      }
    });

    // Autocomplete inputs
    on(document, 'input', (e) => {
      if (e.target.id === 'from-input') {
        this._showAutocomplete('from', e.target.value);
      }
      if (e.target.id === 'to-input') {
        this._showAutocomplete('to', e.target.value);
      }
      if (e.target.id === 'train-query-input') {
        // Live search as user types
        const query = e.target.value;
        if (query.length >= 2) {
          this._results = searchTrainByNumberOrName(query);
          this._displayResults();
        }
      }
    });

    // Show all stations on focus (click into input)
    on(document, 'focus', (e) => {
      if (e.target.id === 'from-input') {
        this._showAutocomplete('from', e.target.value, true);
      }
      if (e.target.id === 'to-input') {
        this._showAutocomplete('to', e.target.value, true);
      }
    }, true);

    // Date picker
    on(document, 'change', (e) => {
      if (e.target.id === 'date-picker') {
        this._selectedDate = new Date(e.target.value);
        $$('[data-date]').forEach(b => b.classList.remove('selected'));
      }
    });

    // Close dropdowns on outside click
    on(document, 'click', (e) => {
      if (!e.target.closest('#from-autocomplete')) {
        const dd = $('#from-dropdown');
        if (dd) dd.style.display = 'none';
      }
      if (!e.target.closest('#to-autocomplete')) {
        const dd = $('#to-dropdown');
        if (dd) dd.style.display = 'none';
      }
    });

    // Search btn for train mode
    on(document, 'click', (e) => {
      if (e.target.closest('#train-search-btn')) {
        const input = $('#train-query-input');
        if (input && input.value.length >= 1) {
          this._results = searchTrainByNumberOrName(input.value);
          this._displayResults();
        }
      }
    });
  },

  _showAutocomplete(which, query, showAll = false) {
    const dropdown = $(`#${which}-dropdown`);
    if (!dropdown) return;

    let matches;
    if (query && query.trim()) {
      matches = searchStations(query);
    } else if (showAll) {
      // Show all stations when focused with empty input
      matches = STATIONS.slice(0, 40);
    } else {
      dropdown.style.display = 'none';
      return;
    }

    if (!matches.length) {
      dropdown.style.display = 'none';
      return;
    }

    dropdown.innerHTML = matches.map(s => `
      <div class="autocomplete-option" data-station-code="${s.code}" data-which="${which}">
        <span class="station-code">${s.code}</span>
        <span class="station-name">${s.name}</span>
        <span class="station-city">${s.city}</span>
      </div>
    `).join('');

    dropdown.style.display = 'block';
    dropdown.style.maxHeight = '300px';
    dropdown.style.overflowY = 'auto';

    // Bind clicks on options
    $$('.autocomplete-option', dropdown).forEach(opt => {
      opt.addEventListener('click', () => {
        const code = opt.dataset.stationCode;
        const station = findStation(code);
        if (which === 'from') {
          this._fromStation = station;
          const inp = $('#from-input');
          if (inp) inp.value = station.name;
        } else {
          this._toStation = station;
          const inp = $('#to-input');
          if (inp) inp.value = station.name;
        }
        dropdown.style.display = 'none';
      });
    });
  },

  doSearch() {
    if (this._searchMode === 'stations' && this._fromStation && this._toStation) {
      this._results = searchTrainsBetweenStations(this._fromStation.code, this._toStation.code);
      addToSearchHistory({
        from: this._fromStation.code,
        to: this._toStation.code,
        fromName: this._fromStation.name,
        toName: this._toStation.name,
        type: 'stations',
      });
      this._displayResults();
      this._renderHistory();
    }
  },

  _displayResults() {
    const container = $('#search-results');
    if (!container) return;

    let results = [...this._results];

    // Type filter
    if (this._typeFilter !== 'all') {
      results = results.filter(t => {
        if (this._typeFilter === 'express') return ['SF', 'EXP', 'RAJ', 'SHATABDI', 'DURONTO', 'MAIL'].includes(t.type);
        if (this._typeFilter === 'local') return t.type === 'LOCAL';
        if (this._typeFilter === 'metro') return t.type === 'METRO';
        return true;
      });
    }

    // Fare filter
    if (this._fareFilter.length > 0) {
      results = results.filter(t =>
        this._fareFilter.some(fc => t.fares[fc] !== undefined)
      );
    }

    // Sort
    if (this._searchMode === 'stations' && this._fromStation && this._toStation) {
      const nowMin = getCurrentSimMinutes();
      results.sort((a, b) => {
        const jA = getJourneyDetails(a, this._fromStation.code, this._toStation.code);
        const jB = getJourneyDetails(b, this._fromStation.code, this._toStation.code);
        if (!jA || !jB) return 0;
        if (this._sortBy === 'nearest') {
          // Show next train departing at or after now first; wrap overnight
          const diffA = (jA.departureMin - nowMin + 1440) % 1440;
          const diffB = (jB.departureMin - nowMin + 1440) % 1440;
          return diffA - diffB;
        }
        if (this._sortBy === 'departure') return jA.departureMin - jB.departureMin;
        if (this._sortBy === 'arrival')   return jA.arrivalMin   - jB.arrivalMin;
        if (this._sortBy === 'duration')  return jA.duration     - jB.duration;
        return 0;
      });
    }

    if (!results.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No trains found</div>
          <div class="empty-state-text">Try adjusting your search criteria or filters</div>
        </div>
      `;
      return;
    }

    const sortButtons = this._searchMode === 'stations' ? `
      <div class="search-results-header">
        <span style="color: var(--text-secondary); font-size: var(--fs-sm);">${results.length} train${results.length > 1 ? 's' : ''} found</span>
        <div class="search-sort-buttons">
          <button class="btn btn-sm ${this._sortBy === 'nearest' ? 'btn-primary' : 'btn-ghost'}" data-sort="nearest">🕐 Nearest</button>
          <button class="btn btn-sm ${this._sortBy === 'departure' ? 'btn-primary' : 'btn-ghost'}" data-sort="departure">Departure</button>
          <button class="btn btn-sm ${this._sortBy === 'arrival' ? 'btn-primary' : 'btn-ghost'}" data-sort="arrival">Arrival</button>
          <button class="btn btn-sm ${this._sortBy === 'duration' ? 'btn-primary' : 'btn-ghost'}" data-sort="duration">Duration</button>
        </div>
      </div>
    ` : `<div style="color: var(--text-secondary); font-size: var(--fs-sm); margin-bottom: var(--space-4);">${results.length} train${results.length > 1 ? 's' : ''} found</div>`;

    container.innerHTML = sortButtons + `
      <div class="search-results-list">
        ${results.map((t, idx) => this._renderTrainCard(t, idx)).join('')}
      </div>
    `;
  },

  _renderTrainCard(train, idx) {
    let depTime, arrTime, duration, fromName, toName;

    if (this._searchMode === 'stations' && this._fromStation && this._toStation) {
      const journey = getJourneyDetails(train, this._fromStation.code, this._toStation.code);
      if (journey) {
        depTime = formatTime(journey.departureMin);
        arrTime = formatTime(journey.arrivalMin);
        duration = formatDuration(journey.duration);
        fromName = this._fromStation.code;
        toName = this._toStation.code;
      }
    } else {
      const first = train.route[0];
      const last = train.route[train.route.length - 1];
      depTime = formatTime(first.departureMin);
      arrTime = formatTime(last.arrivalMin);
      const dur = (last.arrivalMin || last.departureMin) - (first.departureMin || first.arrivalMin);
      duration = formatDuration(dur);
      fromName = first.station;
      toName = last.station;
    }

    const fareEntries = Object.entries(train.fares);
    const lowestFare = Math.min(...fareEntries.map(([, v]) => v));

    // Live status badge based on real current time
    const nowMin = getCurrentSimMinutes();
    let liveBadge = '';
    if (this._searchMode === 'stations' && this._fromStation) {
      const journey = getJourneyDetails(train, this._fromStation.code, this._toStation?.code || this._fromStation.code);
      if (journey) {
        const depMin = journey.departureMin;
        const arrMin = journey.arrivalMin;
        const minsToDep = (depMin - nowMin + 1440) % 1440;
        if (nowMin >= depMin && nowMin <= arrMin) {
          liveBadge = `<span class="badge badge-ontime" style="animation:pulse 2s infinite;">🟢 Running Now</span>`;
        } else if (minsToDep <= 30) {
          liveBadge = `<span class="badge badge-minor-delay">⏱ in ${minsToDep}m</span>`;
        } else if (minsToDep > 1380) {
          liveBadge = `<span class="badge" style="background:rgba(100,116,139,0.15);color:var(--text-muted);">Departed</span>`;
        }
      }
    }

    return `
      <div class="train-card stagger-${Math.min(idx + 1, 8)}" data-train="${train.number}" style="animation: slideUp 0.4s ease both;" title="Click to track on MAP-TRACK">
        <div class="train-card-header">
          <div>
            <div class="train-card-name">${train.name}</div>
            <div class="train-card-number">#${train.number}</div>
          </div>
          <div style="display:flex; gap: var(--space-2); align-items:center; flex-wrap:wrap;">
            <span class="badge badge-type">${getTrainTypeLabel(train.type)}</span>
            ${liveBadge}
          </div>
        </div>
        <div class="train-card-route">
          <div class="train-card-station">
            <div class="time">${depTime}</div>
            <div class="name">${fromName}</div>
          </div>
          <div class="train-card-line">
            <span class="train-card-duration">${duration}</span>
          </div>
          <div class="train-card-station">
            <div class="time">${arrTime}</div>
            <div class="name">${toName}</div>
          </div>
        </div>
        <div class="train-card-footer">
          <div class="train-card-classes">
            ${fareEntries.map(([cls]) => `<span class="chip" style="cursor:default">${cls}</span>`).join('')}
          </div>
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <div class="train-card-fare">₹${lowestFare}+</div>
            <span style="font-size:var(--fs-xs); color:var(--accent-blue-light); opacity:0.8;">🗺️ MAP-TRACK →</span>
          </div>
        </div>
      </div>
    `;
  },

  _renderHistory() {
    const section = $('#search-history-section');
    if (!section) return;
    const history = getSearchHistory();
    if (!history.length) {
      section.innerHTML = '';
      return;
    }
    section.innerHTML = `
      <div class="search-history-section">
        <div class="flex-between" style="margin-bottom:var(--space-3)">
          <h4 style="color: var(--text-secondary);">🕓 Recent Searches</h4>
          <button class="btn btn-ghost btn-sm" id="clear-history">Clear All</button>
        </div>
        <div class="search-history-list">
          ${history.map(h => `
            <div class="search-history-item" data-from="${h.from}" data-to="${h.to}">
              <span class="search-history-icon">🔄</span>
              <span class="search-history-text">${h.fromName || h.from} → ${h.toName || h.to}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  _rerender() {
    const app = $('#app');
    if (app) {
      app.innerHTML = this.render();
      this.init();
    }
  },

  destroy() {
    // Cleanup if needed
  }
};
