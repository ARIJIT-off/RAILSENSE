// ═══════════════════════════════════════════════
// RailSmart — Personal Journey Highlight Page
// ═══════════════════════════════════════════════

const JourneyPage = {
  name: 'journey',
  _map: null,
  _selectedTrain: null,
  _liveData: null,
  _boardingCode: null,
  _destinationCode: null,
  _routeLine: null,
  _trainMarker: null,
  _markers: [],
  _animFrameId: null,
  _refreshInterval: null,
  _countdownInterval: null,

  render() {
    return `
      <div class="journey-page">
        <div class="journey-sidebar" id="journey-sidebar">
          <h3 style="margin-bottom:var(--space-4); background: linear-gradient(135deg, var(--accent-blue-light), var(--accent-cyan)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
            🎯 My Journey
          </h3>

          <!-- Train Selection -->
          <div class="journey-station-select">
            <label style="font-size:var(--fs-sm); color:var(--text-secondary); display:block; margin-bottom:var(--space-2);">Train</label>
            <select class="select" id="journey-train-select">
              <option value="">Select train...</option>
              ${TRAINS.map(t => `<option value="${t.number}">${t.number} — ${t.name}</option>`).join('')}
            </select>
          </div>

          <!-- Station Selectors (shown after train selected) -->
          <div id="journey-station-selectors" style="display:none;">
            <div class="journey-station-select">
              <label style="font-size:var(--fs-sm); color:var(--text-secondary); display:block; margin-bottom:var(--space-2);">🟡 Boarding Station</label>
              <select class="select" id="journey-boarding-select">
                <option value="">Select boarding...</option>
              </select>
            </div>
            <div class="journey-station-select">
              <label style="font-size:var(--fs-sm); color:var(--text-secondary); display:block; margin-bottom:var(--space-2);">🟢 Destination</label>
              <select class="select" id="journey-dest-select">
                <option value="">Select destination...</option>
              </select>
            </div>
          </div>

          <!-- Journey Info -->
          <div id="journey-info" style="margin-top:var(--space-4);"></div>
        </div>

        <div class="journey-map-container">
          <div id="journey-map"></div>
        </div>
      </div>
    `;
  },

  init() {
    setTimeout(() => {
      this._initMap();
      this._bindEvents();

      const savedTrain = getSelectedTrain();
      if (savedTrain) {
        const sel = $('#journey-train-select');
        if (sel) { sel.value = savedTrain; }
        this._onTrainSelect(savedTrain);
      }
    }, 100);
  },

  _initMap() {
    if (this._map) return;
    this._map = L.map('journey-map', {
      center: [22.5, 79.0],
      zoom: 5,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(this._map);
  },

  _bindEvents() {
    on(document, 'change', (e) => {
      if (e.target.id === 'journey-train-select') {
        this._onTrainSelect(e.target.value);
      }
      if (e.target.id === 'journey-boarding-select' || e.target.id === 'journey-dest-select') {
        this._boardingCode = $('#journey-boarding-select')?.value || null;
        this._destinationCode = $('#journey-dest-select')?.value || null;
        if (this._boardingCode && this._destinationCode) {
          saveJourneyPrefs({ boarding: this._boardingCode, destination: this._destinationCode });
          this._drawJourney();
        }
      }
    });
  },

  _onTrainSelect(trainNumber) {
    const train = TRAINS.find(t => t.number === trainNumber);
    if (!train) return;

    this._selectedTrain = train;
    this._liveData = generateLiveData(train);
    saveSelectedTrain(trainNumber);

    // Populate station selects
    const stationSelectors = $('#journey-station-selectors');
    if (stationSelectors) stationSelectors.style.display = 'block';

    const boardingSel = $('#journey-boarding-select');
    const destSel = $('#journey-dest-select');

    if (boardingSel) {
      boardingSel.innerHTML = '<option value="">Select boarding...</option>' +
        train.route.map(s => {
          const info = findStation(s.station);
          return `<option value="${s.station}">${s.station} — ${info?.name || s.station}</option>`;
        }).join('');
    }

    if (destSel) {
      destSel.innerHTML = '<option value="">Select destination...</option>' +
        train.route.map(s => {
          const info = findStation(s.station);
          return `<option value="${s.station}">${s.station} — ${info?.name || s.station}</option>`;
        }).join('');
    }

    // Load saved prefs
    const prefs = getJourneyPrefs();
    if (prefs.boarding && prefs.destination) {
      const hasBoarding = train.route.some(s => s.station === prefs.boarding);
      const hasDest = train.route.some(s => s.station === prefs.destination);
      if (hasBoarding && hasDest) {
        if (boardingSel) boardingSel.value = prefs.boarding;
        if (destSel) destSel.value = prefs.destination;
        this._boardingCode = prefs.boarding;
        this._destinationCode = prefs.destination;
        this._drawJourney();
        return;
      }
    }

    // Draw basic route
    this._drawRoute();
  },

  _drawRoute() {
    if (!this._map || !this._liveData) return;
    this._clearMap();

    const route = this._liveData.liveRoute;
    const coords = route.map(s => [s.stationInfo?.lat || 0, s.stationInfo?.lng || 0]).filter(c => c[0] !== 0);

    this._routeLine = L.polyline(coords, {
      color: '#475569',
      weight: 3,
      opacity: 0.5,
    }).addTo(this._map);

    route.forEach((stop) => {
      if (!stop.stationInfo) return;
      const marker = L.circleMarker([stop.stationInfo.lat, stop.stationInfo.lng], {
        radius: 5,
        fillColor: '#64748b',
        fillOpacity: 0.5,
        color: 'white',
        weight: 1,
      }).addTo(this._map);
      this._markers.push(marker);
    });

    this._map.fitBounds(this._routeLine.getBounds(), { padding: [50, 50] });
  },

  _drawJourney() {
    if (!this._map || !this._liveData || !this._boardingCode || !this._destinationCode) return;
    this._clearMap();

    const route = this._liveData.liveRoute;
    const boardingIdx = route.findIndex(s => s.station === this._boardingCode);
    const destIdx = route.findIndex(s => s.station === this._destinationCode);

    if (boardingIdx === -1 || destIdx === -1 || boardingIdx >= destIdx) return;

    const currentIdx = this._liveData.currentStationIdx;
    const allCoords = route.map(s => [s.stationInfo?.lat || 0, s.stationInfo?.lng || 0]);

    // Draw faded full route
    L.polyline(allCoords, {
      color: '#334155',
      weight: 2,
      opacity: 0.3,
      dashArray: '8,8',
    }).addTo(this._map);

    // Draw journey segment highlighted
    const journeyCoords = allCoords.slice(boardingIdx, destIdx + 1);
    this._routeLine = L.polyline(journeyCoords, {
      color: '#000000',
      weight: 5,
      opacity: 0.9,
    }).addTo(this._map);

    // Station markers with journey-specific styling
    route.forEach((stop, i) => {
      if (!stop.stationInfo) return;

      let color, radius, opacity, strokeColor, strokeWidth;
      const isBoarding = i === boardingIdx;
      const isDest = i === destIdx;
      const isInJourney = i > boardingIdx && i < destIdx;
      const isPassed = i < currentIdx;
      const isCurrent = i === currentIdx;

      if (isBoarding) {
        color = '#eab308'; radius = 12; opacity = 1; strokeColor = '#fef08a'; strokeWidth = 3;
      } else if (isDest) {
        color = '#10b981'; radius = 12; opacity = 1; strokeColor = '#6ee7b7'; strokeWidth = 3;
      } else if (isCurrent && i >= boardingIdx && i <= destIdx) {
        color = '#3b82f6'; radius = 10; opacity = 1; strokeColor = '#93c5fd'; strokeWidth = 3;
      } else if (isPassed) {
        color = '#475569'; radius = 4; opacity = 0.3; strokeColor = '#64748b'; strokeWidth = 1;
      } else if (isInJourney) {
        color = '#60a5fa'; radius = 7; opacity = 0.9; strokeColor = 'white'; strokeWidth = 2;
      } else {
        color = '#334155'; radius = 3; opacity = 0.2; strokeColor = '#475569'; strokeWidth = 1;
      }

      const marker = L.circleMarker([stop.stationInfo.lat, stop.stationInfo.lng], {
        radius, fillColor: color, fillOpacity: opacity,
        color: strokeColor, weight: strokeWidth, opacity: opacity,
      }).addTo(this._map);

      if (isBoarding || isDest || isInJourney || isCurrent) {
        const labelText = isBoarding ? '🟡 BOARDING' : isDest ? '🟢 DESTINATION' : isCurrent ? '● TRAIN HERE' : '';
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif; font-size:13px;">
            <strong>${stop.stationInfo.name}</strong> (${stop.station})
            ${labelText ? `<br>${labelText}` : ''}
            ${stop.arrivalMin ? `<br>Arr: ${formatTime(stop.actualArrival)}` : ''}
            ${stop.departureMin ? `<br>Dep: ${formatTime(stop.actualDeparture)}` : ''}
          </div>
        `);
      }

      this._markers.push(marker);
    });

    // Add train marker
    this._addTrainMarker();

    // Fit to journey bounds
    this._map.fitBounds(this._routeLine.getBounds(), { padding: [80, 80] });

    // Update journey info panel
    this._updateJourneyInfo(boardingIdx, destIdx, currentIdx);

    // Start countdown
    this._startCountdown(destIdx);
    this._startAnimation();
  },

  _addTrainMarker() {
    if (!this._liveData) return;
    const pos = this._getTrainPosition();
    if (!pos) return;

    const trainIcon = L.divIcon({
      html: `<div class="map-train-icon"><div class="map-train-pulse"></div><div class="map-train-svg">🚆</div></div>`,
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
    const cur = route[currentIdx];
    const nxt = route[nextIdx];
    if (!cur.stationInfo || !nxt.stationInfo) return null;
    if (currentIdx === nextIdx) return [cur.stationInfo.lat, cur.stationInfo.lng];

    const currentMin = getCurrentSimMinutes();
    const dep = cur.actualDeparture || cur.actualArrival;
    const arr = nxt.actualArrival || nxt.actualDeparture;
    if (!dep || !arr) return [cur.stationInfo.lat, cur.stationInfo.lng];

    let p = (currentMin - dep) / (arr - dep);
    p = Math.max(0, Math.min(1, p));
    return [
      cur.stationInfo.lat + (nxt.stationInfo.lat - cur.stationInfo.lat) * p,
      cur.stationInfo.lng + (nxt.stationInfo.lng - cur.stationInfo.lng) * p,
    ];
  },

  _startAnimation() {
    this._stopAnimation();
    const animate = () => {
      if (this._trainMarker && this._liveData) {
        const pos = this._getTrainPosition();
        if (pos) this._trainMarker.setLatLng(pos);
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

  _updateJourneyInfo(boardingIdx, destIdx, currentIdx) {
    const info = $('#journey-info');
    if (!info || !this._liveData) return;

    const route = this._liveData.liveRoute;
    const boardingStop = route[boardingIdx];
    const destStop = route[destIdx];
    const journey = getJourneyDetails(this._selectedTrain, this._boardingCode, this._destinationCode);

    // Progress calculation
    let progress = 0;
    if (currentIdx >= destIdx) progress = 100;
    else if (currentIdx >= boardingIdx) {
      progress = ((currentIdx - boardingIdx) / (destIdx - boardingIdx)) * 100;
    }

    const currentMin = getCurrentSimMinutes();
    const eta = destStop.actualArrival ? getCountdown(destStop.actualArrival, currentMin) : '--';

    info.innerHTML = `
      <div class="journey-info-card">
        <div style="font-size:var(--fs-sm); color:var(--text-tertiary); margin-bottom:var(--space-2);">Journey Details</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-3);">
          <div>
            <div style="font-size:var(--fs-xs); color:var(--journey-boarding);">BOARDING</div>
            <div style="font-weight:var(--fw-semibold);">${boardingStop.stationInfo?.name || boardingStop.station}</div>
            <div style="font-size:var(--fs-sm); color:var(--text-tertiary);">${formatTime(boardingStop.actualDeparture || boardingStop.departureMin)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:var(--fs-xs); color:var(--journey-destination);">DESTINATION</div>
            <div style="font-weight:var(--fw-semibold);">${destStop.stationInfo?.name || destStop.station}</div>
            <div style="font-size:var(--fs-sm); color:var(--text-tertiary);">${formatTime(destStop.actualArrival || destStop.arrivalMin)}</div>
          </div>
        </div>
        ${journey ? `<div style="font-size:var(--fs-sm); color:var(--text-muted);">${formatDuration(journey.duration)} · ${journey.distance} km · ${journey.stops} stops</div>` : ''}
      </div>

      <div class="journey-progress" style="margin:var(--space-4) 0;">
        <div class="journey-progress-fill" style="width:${progress}%;">
          <div class="journey-progress-indicator"></div>
        </div>
      </div>

      <div class="journey-countdown-card" id="journey-countdown">
        <div style="font-size:var(--fs-sm); color:var(--text-tertiary); margin-bottom:var(--space-2);">
          ${progress >= 100 ? '✅ Arrived at destination' : '🎯 Arriving in'}
        </div>
        <div class="countdown-value" id="countdown-value" style="font-size:var(--fs-4xl); font-weight:var(--fw-bold); color:var(--journey-destination);">
          ${eta}
        </div>
      </div>
    `;
  },

  _startCountdown(destIdx) {
    if (this._countdownInterval) clearInterval(this._countdownInterval);
    this._countdownInterval = setInterval(() => {
      if (!this._liveData) return;
      const destStop = this._liveData.liveRoute[destIdx];
      const currentMin = getCurrentSimMinutes();
      const eta = destStop.actualArrival ? getCountdown(destStop.actualArrival, currentMin) : '--';
      const el = $('#countdown-value');
      if (el) el.textContent = eta;
    }, 30000);
  },

  _clearMap() {
    if (this._routeLine) { this._map.removeLayer(this._routeLine); this._routeLine = null; }
    if (this._trainMarker) { this._map.removeLayer(this._trainMarker); this._trainMarker = null; }
    this._markers.forEach(m => this._map.removeLayer(m));
    this._markers = [];
    // Also remove any extra polylines
    this._map.eachLayer(layer => {
      if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        if (layer !== this._routeLine) this._map.removeLayer(layer);
      }
    });
  },

  destroy() {
    this._stopAnimation();
    if (this._refreshInterval) clearInterval(this._refreshInterval);
    if (this._countdownInterval) clearInterval(this._countdownInterval);
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }
};
