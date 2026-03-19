// ═══════════════════════════════════════════════
// RailSmart — Live Map View Page
// ═══════════════════════════════════════════════

const MapPage = {
  name: 'map',
  _map: null,
  _selectedTrain: null,
  _liveData: null,
  _routeLine: null,
  _trainMarker: null,
  _stationMarkers: [],
  _animFrameId: null,
  _refreshInterval: null,
  _currentLayer: 'street',

  _tileLayers: {
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '© OpenStreetMap contributors',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: '© Esri',
    },
    hybrid: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attr: '© OpenTopoMap',
    },
  },

  render() {
    return `
      <div class="map-page">
        <div class="map-container">
          <div id="map"></div>
        </div>

        <!-- Train Selector -->
        <div class="map-train-selector" id="map-train-selector">
          <h4 style="margin-bottom:var(--space-3); color:var(--text-primary);">🚆 Select Train</h4>
          <select class="select" id="map-train-select">
            <option value="">Choose a train...</option>
            ${TRAINS.map(t => `<option value="${t.number}">${t.number} — ${t.name}</option>`).join('')}
          </select>
        </div>

        <!-- Layer Toggle -->
        <div class="map-controls">
          <div class="map-layer-toggle">
            <button class="map-layer-btn active" data-layer="street" id="layer-street">Street</button>
            <button class="map-layer-btn" data-layer="satellite" id="layer-satellite">Satellite</button>
            <button class="map-layer-btn" data-layer="hybrid" id="layer-hybrid">Topo</button>
          </div>
        </div>

        <!-- Info Panel -->
        <div class="map-info-panel" id="map-info-panel" style="display:none;"></div>
      </div>
    `;
  },

  init() {
    // Small delay to let DOM settle
    setTimeout(() => {
      this._initMap();
      this._bindEvents();

      // Load saved train
      const saved = getSelectedTrain();
      if (saved) {
        const sel = $('#map-train-select');
        if (sel) sel.value = saved;
        this._loadTrain(saved);
      }
    }, 100);
  },

  _initMap() {
    if (this._map) return;

    this._map = L.map('map', {
      center: [22.76, 88.37],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    this._tileLayer = L.tileLayer(this._tileLayers.street.url, {
      attribution: this._tileLayers.street.attr,
      maxZoom: 18,
    }).addTo(this._map);
  },

  _bindEvents() {
    on(document, 'change', (e) => {
      if (e.target.id === 'map-train-select') {
        const num = e.target.value;
        if (num) this._loadTrain(num);
      }
    });

    on(document, 'click', (e) => {
      const layerBtn = e.target.closest('[data-layer]');
      if (layerBtn) {
        this._switchLayer(layerBtn.dataset.layer);
        $$('.map-layer-btn').forEach(b => b.classList.remove('active'));
        layerBtn.classList.add('active');
      }
    });
  },

  _switchLayer(layerName) {
    if (!this._map || !this._tileLayers[layerName]) return;
    this._currentLayer = layerName;
    const layer = this._tileLayers[layerName];
    this._tileLayer.setUrl(layer.url);
    this._tileLayer.options.attribution = layer.attr;
  },

  _loadTrain(trainNumber) {
    const train = TRAINS.find(t => t.number === trainNumber);
    if (!train) return;

    this._selectedTrain = train;
    this._liveData = generateLiveData(train);
    this._drawRoute();
    this._updateInfoPanel();
    this._startAnimation();
    this._startAutoRefresh();
  },

  _drawRoute() {
    if (!this._map || !this._liveData) return;

    // Clear previous
    this._clearMap();

    const route = this._liveData.liveRoute;

    // Build track path using real railway waypoints (for train interpolation only)
    const stationCodes = route.map(s => s.station);
    const coords = getTrackPath(stationCodes);

    // Draw station markers
    route.forEach((stop, i) => {
      if (!stop.stationInfo) return;

      const isCurrent = i === this._liveData.currentStationIdx;
      const isPassed = stop.hasPassed;

      let markerColor = '#64748b'; // upcoming
      let radius = 6;
      let fillOpacity = 0.7;

      if (isPassed) {
        markerColor = '#10b981'; // green for passed
        fillOpacity = 0.9;
      }
      if (isCurrent) {
        markerColor = '#3b82f6'; // blue for current
        radius = 10;
        fillOpacity = 1;
      }

      const marker = L.circleMarker([stop.stationInfo.lat, stop.stationInfo.lng], {
        radius: radius,
        fillColor: markerColor,
        fillOpacity: fillOpacity,
        color: 'white',
        weight: 2,
        opacity: 0.9,
      }).addTo(this._map);

      // Popup
      const delayText = stop.delay > 0 ? `<br><span style="color:#f59e0b;">Delayed: +${stop.delay}min</span>` : '<br><span style="color:#10b981;">On Time</span>';
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif; font-size:13px; min-width:160px;">
          <strong>${stop.stationInfo.name}</strong> (${stop.station})
          <br>Platform: ${stop.platform}
          ${stop.arrivalMin ? `<br>Arr: ${formatTime(stop.arrivalMin)} → ${formatTime(stop.actualArrival)}` : ''}
          ${stop.departureMin ? `<br>Dep: ${formatTime(stop.departureMin)} → ${formatTime(stop.actualDeparture)}` : ''}
          ${delayText}
        </div>
      `);

      this._stationMarkers.push(marker);
    });

    // Add train icon
    this._addTrainMarker();

    // Fit bounds
    this._map.fitBounds(this._routeLine.getBounds(), { padding: [50, 50] });
  },

  _addTrainMarker() {
    if (!this._liveData) return;

    const pos = this._getTrainPosition();
    if (!pos) return;

    const heading = this._getTrainHeading();

    const trainIcon = L.divIcon({
      html: `
        <div class="map-train-icon" style="transform: rotate(${heading}deg);">
          <div class="map-train-pulse"></div>
          <div class="map-train-svg">🚆</div>
        </div>
      `,
      className: 'train-marker-container',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    this._trainMarker = L.marker(pos, { icon: trainIcon, zIndexOffset: 1000 }).addTo(this._map);
  },

  _getTrainPosition() {
    if (!this._liveData) return null;

    const route = this._liveData.liveRoute;
    const currentIdx = this._liveData.currentStationIdx;
    const nextIdx = Math.min(currentIdx + 1, route.length - 1);

    const currentStop = route[currentIdx];
    const nextStop    = route[nextIdx];

    if (!currentStop.stationInfo || !nextStop.stationInfo) return null;

    if (currentIdx === nextIdx) {
      // At last station — snap to nearest track point
      const idx = getClosestTrackIdx(currentStop.stationInfo.lat, currentStop.stationInfo.lng);
      return TRACK_GEOMETRY[idx] || [currentStop.stationInfo.lat, currentStop.stationInfo.lng];
    }

    // Time-based progress between the two stations
    const currentMin  = getCurrentSimMinutes();
    const departTime  = currentStop.actualDeparture || currentStop.actualArrival;
    const arriveTime  = nextStop.actualArrival      || nextStop.actualDeparture;

    if (!departTime || !arriveTime) {
      const idx = getClosestTrackIdx(currentStop.stationInfo.lat, currentStop.stationInfo.lng);
      return TRACK_GEOMETRY[idx] || [currentStop.stationInfo.lat, currentStop.stationInfo.lng];
    }

    let progress = (currentMin - departTime) / (arriveTime - departTime);
    progress = Math.max(0, Math.min(1, progress));

    // Interpolate ALONG the track geometry, not a straight line between stations
    if (typeof TRACK_GEOMETRY !== 'undefined' && TRACK_GEOMETRY.length) {
      const idx1 = getClosestTrackIdx(currentStop.stationInfo.lat, currentStop.stationInfo.lng);
      const idx2 = getClosestTrackIdx(nextStop.stationInfo.lat,    nextStop.stationInfo.lng);
      const targetIdx = Math.round(idx1 + (idx2 - idx1) * progress);
      const clamped   = Math.max(0, Math.min(TRACK_GEOMETRY.length - 1, targetIdx));
      return TRACK_GEOMETRY[clamped];
    }

    // Fallback: straight-line interpolation
    const lat = currentStop.stationInfo.lat + (nextStop.stationInfo.lat - currentStop.stationInfo.lat) * progress;
    const lng = currentStop.stationInfo.lng + (nextStop.stationInfo.lng - currentStop.stationInfo.lng) * progress;
    return [lat, lng];
  },

  _getTrainHeading() {
    if (!this._liveData) return 0;

    // Use TRACK_GEOMETRY to get accurate heading along the actual track curve
    if (typeof TRACK_GEOMETRY !== 'undefined' && TRACK_GEOMETRY.length > 1) {
      const pos = this._getTrainPosition();
      if (!pos) return 0;

      // Find the index of the current position in TRACK_GEOMETRY
      let minD = Infinity, idx = 0;
      for (let i = 0; i < TRACK_GEOMETRY.length; i++) {
        const [tLat, tLng] = TRACK_GEOMETRY[i];
        const d = (pos[0] - tLat) * (pos[0] - tLat) + (pos[1] - tLng) * (pos[1] - tLng);
        if (d < minD) { minD = d; idx = i; }
      }

      // Use next point for direction
      const nextIdx = Math.min(idx + 1, TRACK_GEOMETRY.length - 1);
      const dLat = TRACK_GEOMETRY[nextIdx][0] - TRACK_GEOMETRY[idx][0];
      const dLng = TRACK_GEOMETRY[nextIdx][1] - TRACK_GEOMETRY[idx][1];
      return (Math.atan2(dLng, dLat) * 180 / Math.PI);
    }

    // Fallback
    const route = this._liveData.liveRoute;
    const currentIdx = this._liveData.currentStationIdx;
    const nextIdx = Math.min(currentIdx + 1, route.length - 1);
    const curr = route[currentIdx];
    const next = route[nextIdx];
    if (!curr.stationInfo || !next.stationInfo || currentIdx === nextIdx) return 0;
    const dLat = next.stationInfo.lat - curr.stationInfo.lat;
    const dLng = next.stationInfo.lng - curr.stationInfo.lng;
    return (Math.atan2(dLng, dLat) * 180 / Math.PI);
  },

  _startAnimation() {
    this._stopAnimation();

    const animate = () => {
      if (this._trainMarker && this._liveData) {
        const pos = this._getTrainPosition();
        if (pos) {
          this._trainMarker.setLatLng(pos);
        }
      }
      this._animFrameId = requestAnimationFrame(animate);
    };

    this._animFrameId = requestAnimationFrame(animate);
  },

  _stopAnimation() {
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
  },

  _startAutoRefresh() {
    if (this._refreshInterval) clearInterval(this._refreshInterval);
    this._refreshInterval = setInterval(() => {
      if (this._selectedTrain) {
        this._liveData = generateLiveData(this._selectedTrain);
        this._drawRoute();
        this._updateInfoPanel();
      }
    }, 60000);
  },

  _updateInfoPanel() {
    const panel = $('#map-info-panel');
    if (!panel || !this._liveData) return;

    const data = this._liveData;
    const delayInfo = getDelayInfo(data.overallDelay);
    const currentStation = data.liveRoute[data.currentStationIdx];
    const finalStation = data.liveRoute[data.liveRoute.length - 1];
    const currentMin = getCurrentSimMinutes();
    const eta = finalStation.actualArrival ? getCountdown(finalStation.actualArrival, currentMin) : '--';

    panel.style.display = 'block';
    panel.innerHTML = `
      <h4 style="margin-bottom:var(--space-2); color:var(--text-primary);">${data.name}</h4>
      <div style="font-size:var(--fs-sm); color:var(--text-tertiary); margin-bottom:var(--space-3);">#${data.number}</div>
      <div style="display:flex; gap:var(--space-3); flex-wrap:wrap; font-size:var(--fs-sm);">
        <span class="badge ${delayInfo.class}">${delayInfo.label}</span>
        <span style="color:var(--text-secondary);">📍 ${currentStation.stationInfo?.name || currentStation.station}</span>
      </div>
      <div style="margin-top:var(--space-3); font-size:var(--fs-sm); color:var(--text-secondary);">
        🏁 ${finalStation.stationInfo?.name || finalStation.station}: <strong style="color:var(--accent-cyan);">${eta}</strong>
      </div>
    `;
  },

  _clearMap() {
    if (this._routeLine) {
      this._map.removeLayer(this._routeLine);
      this._routeLine = null;
    }
    if (this._trainMarker) {
      this._map.removeLayer(this._trainMarker);
      this._trainMarker = null;
    }
    this._stationMarkers.forEach(m => this._map.removeLayer(m));
    this._stationMarkers = [];
  },

  destroy() {
    this._stopAnimation();
    if (this._refreshInterval) clearInterval(this._refreshInterval);
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }
};
