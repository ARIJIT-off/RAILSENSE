// ═══════════════════════════════════════════════
// RailSmart — Live Map View Page
// Multi-Train Comparison: Main + 2 Alternatives
// ═══════════════════════════════════════════════

const TRAIN_COLORS = {
  main: { dot: '#10b981', emoji: '🔴🚆', label: 'Main', bg: 'rgba(16,185,129,0.15)', border: '#10b981' },
  alt1: { dot: '#3b82f6', emoji: '🔵🚆', label: 'Alt-1', bg: 'rgba(59,130,246,0.15)', border: '#3b82f6' },
  alt2: { dot: '#f59e0b', emoji: '🟠🚆', label: 'Alt-2', bg: 'rgba(245,158,11,0.15)', border: '#f59e0b' },
};

const MapPage = {
  name: 'map',
  _map: null,
  _tileLayer: null,
  _currentLayer: 'street',
  _animFrameId: null,
  _refreshInterval: null,

  // Station selection
  _fromStation: null,
  _toStation: null,

  // 3-train comparison
  _trainSlots: [],     // [{train, liveData, marker, stationMarkers}]
  _activeSlot: 'main', // 'main' | 'alt1' | 'alt2' | 'all'

  _tileLayers: {
    street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap' },
    satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
    hybrid: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenTopoMap' },
  },

  render() {
    return `
      <div class="map-page">
        <div class="map-container">
          <div id="map"></div>
        </div>

        <!-- Station Selector (top-left) -->
        <div class="map-train-selector" id="map-station-selector">
          <h4 style="margin-bottom:var(--space-2); color:var(--text-primary);">📍 Select Route</h4>
          <div class="map-station-inputs">
            <div class="autocomplete" id="map-from-ac" style="position:relative;">
              <input class="input" type="text" placeholder="From station..." id="map-from-input" autocomplete="off" style="font-size:13px; padding:8px 10px;">
              <div class="autocomplete-dropdown" id="map-from-dropdown" style="display:none; position:absolute; z-index:9999; width:100%; max-height:250px; overflow-y:auto; background:var(--bg-secondary); border:1px solid var(--border-primary); border-radius:8px; top:100%;"></div>
            </div>
            <span style="color:var(--text-muted); text-align:center; font-size:16px;">→</span>
            <div class="autocomplete" id="map-to-ac" style="position:relative;">
              <input class="input" type="text" placeholder="To station..." id="map-to-input" autocomplete="off" style="font-size:13px; padding:8px 10px;">
              <div class="autocomplete-dropdown" id="map-to-dropdown" style="display:none; position:absolute; z-index:9999; width:100%; max-height:250px; overflow-y:auto; background:var(--bg-secondary); border:1px solid var(--border-primary); border-radius:8px; top:100%;"></div>
            </div>
          </div>
        </div>

        <!-- Layer Toggle -->
        <div class="map-controls">
          <div class="map-layer-toggle">
            <button class="map-layer-btn active" data-layer="street" id="layer-street">Street</button>
            <button class="map-layer-btn" data-layer="satellite" id="layer-satellite">Satellite</button>
            <button class="map-layer-btn" data-layer="hybrid" id="layer-hybrid">Topo</button>
          </div>
        </div>

        <!-- Train Comparison Sidebar (bottom-left) -->
        <div id="map-train-sidebar" class="map-train-sidebar" style="display:none;"></div>

        <!-- Info Panel (bottom-right) -->
        <div class="map-info-panel" id="map-info-panel" style="display:none;"></div>
      </div>
    `;
  },

  init() {
    setTimeout(() => {
      this._initMap();
      this._bindEvents();
      // Auto-load saved route from Search page
      const savedRoute = getMapRoute();
      if (savedRoute && savedRoute.from && savedRoute.to) {
        this._fromStation = findStation(savedRoute.from);
        this._toStation = findStation(savedRoute.to);
        if (this._fromStation && this._toStation) {
          const fromInp = $('#map-from-input');
          const toInp = $('#map-to-input');
          if (fromInp) fromInp.value = `${this._fromStation.name} (${this._fromStation.code})`;
          if (toInp) toInp.value = `${this._toStation.name} (${this._toStation.code})`;
          this._findAndShowTrains();
        }
      }
    }, 100);
  },

  _initMap() {
    if (this._map) return;
    this._map = L.map('map', { center: [22.76, 88.37], zoom: 12, zoomControl: true, attributionControl: true });
    this._tileLayer = L.tileLayer(this._tileLayers.street.url, { attribution: this._tileLayers.street.attr, maxZoom: 18 }).addTo(this._map);
  },

  _bindEvents() {
    // Layer buttons
    on(document, 'click', (e) => {
      const layerBtn = e.target.closest('[data-layer]');
      if (layerBtn) {
        this._switchLayer(layerBtn.dataset.layer);
        $$('.map-layer-btn').forEach(b => b.classList.remove('active'));
        layerBtn.classList.add('active');
      }

      // Train slot selector
      const slotBtn = e.target.closest('[data-slot]');
      if (slotBtn) {
        this._activeSlot = slotBtn.dataset.slot;
        this._renderTrains();
        this._updateSidebarActive();
      }
    });

    // Autocomplete inputs
    const setupAC = (inputId, dropdownId, which) => {
      on(document, 'input', (e) => {
        if (e.target.id === inputId) this._showMapAutocomplete(which, e.target.value);
      });
      on(document, 'focus', (e) => {
        if (e.target.id === inputId) this._showMapAutocomplete(which, e.target.value, true);
      }, true);
      on(document, 'click', (e) => {
        if (!e.target.closest(`#${which === 'from' ? 'map-from-ac' : 'map-to-ac'}`)) {
          const dd = $(`#${dropdownId}`);
          if (dd) dd.style.display = 'none';
        }
      });
    };
    setupAC('map-from-input', 'map-from-dropdown', 'from');
    setupAC('map-to-input', 'map-to-dropdown', 'to');
  },

  _showMapAutocomplete(which, query, showAll = false) {
    const dropdown = $(`#map-${which}-dropdown`);
    if (!dropdown) return;

    let matches;
    if (query && query.trim()) {
      matches = searchStations(query);
    } else if (showAll) {
      matches = STATIONS.slice(0, 50);
    } else {
      dropdown.style.display = 'none';
      return;
    }

    if (!matches.length) { dropdown.style.display = 'none'; return; }

    dropdown.innerHTML = matches.map(s => `
      <div class="autocomplete-option" data-code="${s.code}" data-which="${which}" style="padding:8px 12px; cursor:pointer; display:flex; gap:8px; align-items:center; border-bottom:1px solid var(--border-subtle);">
        <span style="font-weight:600; color:var(--accent-cyan); min-width:45px; font-size:12px;">${s.code}</span>
        <span style="color:var(--text-primary); font-size:13px;">${s.name}</span>
        <span style="color:var(--text-muted); font-size:11px; margin-left:auto;">${s.city}</span>
      </div>
    `).join('');
    dropdown.style.display = 'block';

    $$('.autocomplete-option', dropdown).forEach(opt => {
      opt.onmouseenter = () => opt.style.background = 'var(--bg-tertiary)';
      opt.onmouseleave = () => opt.style.background = '';
      opt.onclick = () => {
        const code = opt.dataset.code;
        const station = findStation(code);
        if (which === 'from') {
          this._fromStation = station;
          const inp = $('#map-from-input');
          if (inp) inp.value = `${station.name} (${station.code})`;
        } else {
          this._toStation = station;
          const inp = $('#map-to-input');
          if (inp) inp.value = `${station.name} (${station.code})`;
        }
        dropdown.style.display = 'none';

        // If both selected, find trains
        if (this._fromStation && this._toStation) {
          this._findAndShowTrains();
        }
      };
    });
  },

  _findAndShowTrains() {
    const fromCode = this._fromStation.code;
    const toCode = this._toStation.code;

    // Find all trains passing through both stations
    const allTrains = searchTrainsBetweenStations(fromCode, toCode);
    if (!allTrains.length) {
      this._showNoTrains();
      return;
    }

    // Sort by nearest departure from `from` station
    const nowMin = getCurrentSimMinutes();
    allTrains.sort((a, b) => {
      const aStop = a.route.find(s => s.station === fromCode);
      const bStop = b.route.find(s => s.station === fromCode);
      const aDep = aStop ? aStop.departureMin : 9999;
      const bDep = bStop ? bStop.departureMin : 9999;
      const aDiff = (aDep - nowMin + 1440) % 1440;
      const bDiff = (bDep - nowMin + 1440) % 1440;
      return aDiff - bDiff;
    });

    // Pick top 3
    const top3 = allTrains.slice(0, 3);
    const slotKeys = ['main', 'alt1', 'alt2'];
    this._trainSlots = top3.map((train, i) => ({
      key: slotKeys[i],
      train,
      liveData: generateLiveData(train),
      marker: null,
      stationMarkers: [],
    }));

    this._activeSlot = 'main';
    this._renderSidebar();
    this._renderTrains();
    this._startAnimation();
    this._startAutoRefresh();
  },

  _showNoTrains() {
    const sidebar = $('#map-train-sidebar');
    if (sidebar) {
      sidebar.style.display = 'block';
      sidebar.innerHTML = `
        <div style="padding:16px; text-align:center; color:var(--text-muted);">
          <div style="font-size:24px; margin-bottom:8px;">🚫</div>
          <div>No trains found between<br><strong>${this._fromStation.name}</strong> → <strong>${this._toStation.name}</strong></div>
        </div>
      `;
    }
  },

  _renderSidebar() {
    const sidebar = $('#map-train-sidebar');
    if (!sidebar) return;

    const nowMin = getCurrentSimMinutes();
    let html = `<div class="train-sidebar-content">`;

    this._trainSlots.forEach((slot, i) => {
      const color = TRAIN_COLORS[slot.key];
      const depStop = slot.train.route.find(s => s.station === this._fromStation.code);
      const depMin = depStop ? depStop.departureMin : null;
      const depTime = depMin !== null ? formatTime(depMin) : '--:--';
      const minsAway = depMin !== null ? ((depMin - nowMin + 1440) % 1440) : null;
      const minsLabel = minsAway !== null ? (minsAway <= 0 ? 'Now' : `in ${minsAway}m`) : '';

      html += `
        <button class="train-slot-btn ${this._activeSlot === slot.key ? 'active' : ''}" data-slot="${slot.key}"
          style="border-left:4px solid ${color.border}; ${this._activeSlot === slot.key ? `background:${color.bg};` : ''}">
          <div class="slot-header">
            <span class="slot-emoji">${color.emoji}</span>
            <span class="slot-label">${color.label}</span>
            <span class="slot-time">${depTime}</span>
          </div>
          <div class="slot-details">
            <span class="slot-name">${slot.train.name}</span>
            <span class="slot-badge">#${slot.train.number}</span>
          </div>
          <div class="slot-eta">${minsLabel}</div>
        </button>
      `;
    });

    // ALL button
    html += `
      <button class="train-slot-btn train-slot-all ${this._activeSlot === 'all' ? 'active' : ''}" data-slot="all"
        style="border-left:4px solid var(--text-muted); ${this._activeSlot === 'all' ? 'background:rgba(148,163,184,0.15);' : ''}">
        <div class="slot-header">
          <span class="slot-emoji">🔷</span>
          <span class="slot-label">All Trains</span>
        </div>
        <div class="slot-details" style="color:var(--text-muted);">View all ${this._trainSlots.length} trains at once</div>
      </button>
    `;

    html += `</div>`;
    sidebar.style.display = 'block';
    sidebar.innerHTML = html;
  },

  _updateSidebarActive() {
    $$('.train-slot-btn').forEach(btn => {
      const slot = btn.dataset.slot;
      const isActive = slot === this._activeSlot;
      btn.classList.toggle('active', isActive);
      if (slot === 'all') {
        btn.style.background = isActive ? 'rgba(148,163,184,0.15)' : '';
      } else {
        const color = TRAIN_COLORS[slot];
        if (color) btn.style.background = isActive ? color.bg : '';
      }
    });
    this._updateInfoPanel();
  },

  _renderTrains() {
    this._clearMap();
    if (!this._trainSlots.length) return;

    const slotsToRender = this._activeSlot === 'all'
      ? this._trainSlots
      : this._trainSlots.filter(s => s.key === this._activeSlot);

    const allLatLngs = [];

    slotsToRender.forEach(slot => {
      const color = TRAIN_COLORS[slot.key];
      const route = slot.liveData.liveRoute;

      // Station markers — styled station pins with code labels
      route.forEach((stop, i) => {
        if (!stop.stationInfo) return;
        const isCurrent = i === slot.liveData.currentStationIdx;
        const isPassed = stop.hasPassed;
        const isFirst = i === 0;
        const isLast = i === route.length - 1;

        let dotColor = '#475569';
        let dotSize = 10;
        let labelBg = 'rgba(30,41,59,0.85)';
        if (isPassed) { dotColor = color.dot; }
        if (isCurrent) { dotColor = color.dot; dotSize = 14; labelBg = color.bg; }
        if (isFirst || isLast) { dotSize = 14; }

        const stationIcon = L.divIcon({
          html: `<div style="display:flex; align-items:center; gap:4px; white-space:nowrap;">
            <div style="width:${dotSize}px; height:${dotSize}px; border-radius:50%; background:${dotColor}; border:2px solid white; box-shadow:0 0 6px rgba(0,0,0,0.4); flex-shrink:0;"></div>
            <div style="background:${labelBg}; color:white; font-size:10px; font-weight:600; padding:2px 6px; border-radius:4px; font-family:monospace; letter-spacing:0.5px; backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.1);">${stop.station}</div>
          </div>`,
          className: 'station-pin-container',
          iconSize: [80, 20],
          iconAnchor: [dotSize / 2, dotSize / 2],
        });

        const marker = L.marker([stop.stationInfo.lat, stop.stationInfo.lng], { icon: stationIcon, zIndexOffset: isCurrent ? 500 : 0 }).addTo(this._map);

        const delayHtml = stop.delay > 0
          ? `<span style="color:#f59e0b; font-weight:600;">⚠ +${stop.delay}min late</span>`
          : `<span style="color:#10b981; font-weight:600;">✓ On Time</span>`;

        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif; font-size:13px; min-width:160px; line-height:1.6;">
            <div style="font-size:14px; font-weight:700; margin-bottom:4px;">${isFirst ? '🚉 ' : isLast ? '🏁 ' : '📍 '}${stop.stationInfo.name}</div>
            <div style="color:#94a3b8; font-size:11px; margin-bottom:6px;">${stop.station} · Platform ${stop.platform}</div>
            ${stop.arrivalMin ? `<div>Arr: <strong>${formatTime(stop.actualArrival || stop.arrivalMin)}</strong></div>` : ''}
            ${stop.departureMin ? `<div>Dep: <strong>${formatTime(stop.actualDeparture || stop.departureMin)}</strong></div>` : ''}
            <div style="margin-top:4px;">${delayHtml}</div>
          </div>
        `);

        slot.stationMarkers.push(marker);
        allLatLngs.push([stop.stationInfo.lat, stop.stationInfo.lng]);
      });

      // Train marker — realistic styled indicator
      const pos = this._getSlotTrainPosition(slot);
      if (pos) {
        const heading = this._getSlotHeading(slot);
        const trainIcon = L.divIcon({
          html: `<div style="position:relative; width:48px; height:48px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:48px; height:48px; border-radius:50%; border:2px solid ${color.border}; opacity:0.4; animation:pulse 2s infinite;"></div>
            <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, ${color.border}, ${color.dot}); display:flex; align-items:center; justify-content:center; box-shadow:0 2px 12px ${color.border}80; border:2px solid white; transform:rotate(${heading}deg);">
              <span style="font-size:18px; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">${color.emoji}</span>
            </div>
            <div style="position:absolute; bottom:-14px; left:50%; transform:translateX(-50%); font-size:9px; font-weight:700; color:white; background:${color.border}; padding:1px 5px; border-radius:3px; white-space:nowrap; font-family:monospace;">#${slot.train.number.slice(-4)}</div>
          </div>`,
          className: 'train-marker-container',
          iconSize: [48, 60], iconAnchor: [24, 24],
        });
        slot.marker = L.marker(pos, { icon: trainIcon, zIndexOffset: 1000 }).addTo(this._map);
      }
    });

    // Fit bounds
    if (allLatLngs.length > 1) {
      this._map.fitBounds(allLatLngs, { padding: [60, 60] });
    }

    this._updateInfoPanel();
  },

  _getSlotTrainPosition(slot) {
    const route = slot.liveData.liveRoute;
    const currentIdx = slot.liveData.currentStationIdx;
    const nextIdx = Math.min(currentIdx + 1, route.length - 1);
    const curr = route[currentIdx], next = route[nextIdx];
    if (!curr.stationInfo || !next.stationInfo) return null;

    if (currentIdx === nextIdx) {
      return [curr.stationInfo.lat, curr.stationInfo.lng];
    }

    const currentMin = getCurrentSimMinutes();
    const depTime = curr.actualDeparture || curr.actualArrival;
    const arrTime = next.actualArrival || next.actualDeparture;
    if (!depTime || !arrTime) return [curr.stationInfo.lat, curr.stationInfo.lng];

    let progress = (currentMin - depTime) / (arrTime - depTime);
    progress = Math.max(0, Math.min(1, progress));

    const lat = curr.stationInfo.lat + (next.stationInfo.lat - curr.stationInfo.lat) * progress;
    const lng = curr.stationInfo.lng + (next.stationInfo.lng - curr.stationInfo.lng) * progress;
    return [lat, lng];
  },

  _getSlotHeading(slot) {
    const route = slot.liveData.liveRoute;
    const idx = slot.liveData.currentStationIdx;
    const nxt = Math.min(idx + 1, route.length - 1);
    const c = route[idx], n = route[nxt];
    if (!c.stationInfo || !n.stationInfo || idx === nxt) return 0;
    return Math.atan2(n.stationInfo.lng - c.stationInfo.lng, n.stationInfo.lat - c.stationInfo.lat) * 180 / Math.PI;
  },

  _updateInfoPanel() {
    const panel = $('#map-info-panel');
    if (!panel || !this._trainSlots.length) return;

    if (this._activeSlot === 'all') {
      const currentMin = getCurrentSimMinutes();
      panel.style.display = 'block';
      panel.innerHTML = `
        <h4 style="margin-bottom:var(--space-2); color:var(--text-primary);">📍 ${this._fromStation.name} → ${this._toStation.name}</h4>
        <div style="font-size:var(--fs-sm); color:var(--text-muted); margin-bottom:var(--space-2);">${this._trainSlots.length} trains tracked</div>
        ${this._trainSlots.map(slot => {
        const color = TRAIN_COLORS[slot.key];
        const depStop = slot.train.route.find(s => s.station === this._fromStation.code);
        const depMin = depStop ? depStop.departureMin : null;
        return `<div style="display:flex; align-items:center; gap:8px; margin-top:6px; font-size:13px;">
            <span>${color.emoji}</span>
            <span style="color:var(--text-primary);">#${slot.train.number}</span>
            <span style="color:var(--text-muted);">${depMin ? formatTime(depMin) : ''}</span>
          </div>`;
      }).join('')}
      `;
      return;
    }

    const slot = this._trainSlots.find(s => s.key === this._activeSlot);
    if (!slot) { panel.style.display = 'none'; return; }

    const color = TRAIN_COLORS[slot.key];
    const data = slot.liveData;
    const delayInfo = getDelayInfo(data.overallDelay);
    const currStation = data.liveRoute[data.currentStationIdx];
    const currentMin = getCurrentSimMinutes();
    const depStop = slot.train.route.find(s => s.station === this._fromStation.code);
    const arrStop = slot.train.route.find(s => s.station === this._toStation.code);

    panel.style.display = 'block';
    panel.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:var(--space-2);">
        <span style="font-size:18px;">${color.emoji}</span>
        <h4 style="color:var(--text-primary); margin:0;">${slot.train.name}</h4>
      </div>
      <div style="font-size:var(--fs-sm); color:var(--text-tertiary); margin-bottom:var(--space-2);">#${slot.train.number} · ${color.label}</div>
      <div style="display:flex; gap:var(--space-3); flex-wrap:wrap; font-size:var(--fs-sm);">
        <span class="badge ${delayInfo.class}">${delayInfo.label}</span>
        <span style="color:var(--text-secondary);">📍 ${currStation.stationInfo?.name || currStation.station}</span>
      </div>
      <div style="margin-top:var(--space-2); font-size:var(--fs-sm); color:var(--text-secondary);">
        ${depStop ? `Dep ${this._fromStation.code}: <strong>${formatTime(depStop.departureMin)}</strong>` : ''}
        ${arrStop ? ` · Arr ${this._toStation.code}: <strong>${formatTime(arrStop.arrivalMin)}</strong>` : ''}
      </div>
    `;
  },

  _switchLayer(layerName) {
    if (!this._map || !this._tileLayers[layerName]) return;
    this._currentLayer = layerName;
    const layer = this._tileLayers[layerName];
    this._tileLayer.setUrl(layer.url);
  },

  _startAnimation() {
    this._stopAnimation();
    const animate = () => {
      this._trainSlots.forEach(slot => {
        if (!slot.marker) return;
        const show = this._activeSlot === 'all' || this._activeSlot === slot.key;
        if (!show) return;
        const pos = this._getSlotTrainPosition(slot);
        if (pos) slot.marker.setLatLng(pos);
      });
      this._animFrameId = requestAnimationFrame(animate);
    };
    this._animFrameId = requestAnimationFrame(animate);
  },

  _stopAnimation() {
    if (this._animFrameId) { cancelAnimationFrame(this._animFrameId); this._animFrameId = null; }
  },

  _startAutoRefresh() {
    if (this._refreshInterval) clearInterval(this._refreshInterval);
    this._refreshInterval = setInterval(() => {
      this._trainSlots.forEach(slot => { slot.liveData = generateLiveData(slot.train); });
      this._renderTrains();
      this._renderSidebar();
    }, 60000);
  },

  _clearMap() {
    this._trainSlots.forEach(slot => {
      if (slot.marker) { this._map.removeLayer(slot.marker); slot.marker = null; }
      if (slot.stationMarkers) { slot.stationMarkers.forEach(m => this._map.removeLayer(m)); slot.stationMarkers = []; }
    });
  },

  destroy() {
    this._stopAnimation();
    if (this._refreshInterval) clearInterval(this._refreshInterval);
    if (this._map) { this._map.remove(); this._map = null; }
  }
};
