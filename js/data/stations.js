// ═══════════════════════════════════════════════
// RailSmart — Indian Railway Stations Dataset
// Bandel–Howrah Main Line (accurate coordinates)
// ═══════════════════════════════════════════════

const STATIONS = [
  { code: 'BDC',  name: 'Bandel Junction',  city: 'Bandel',       state: 'West Bengal', lat: 22.92363, lng: 88.37833, zone: 'ER', platforms: 7  },
  { code: 'HGY',  name: 'Hooghly',          city: 'Hooghly',      state: 'West Bengal', lat: 22.905211, lng: 88.376064, zone: 'ER', platforms: 2  },
  { code: 'CNS',  name: 'Chuchura',         city: 'Chinsurah',    state: 'West Bengal', lat: 22.890925, lng: 88.370343, zone: 'ER', platforms: 2  },
  { code: 'CGR',  name: 'Chandan Nagar',    city: 'Chandannagar', state: 'West Bengal', lat: 22.882652, lng: 88.364755, zone: 'ER', platforms: 3  },
  { code: 'MUU',  name: 'Mankundu',         city: 'Mankundu',     state: 'West Bengal', lat: 22.847312, lng: 88.347130, zone: 'ER', platforms: 2  },
  { code: 'BHR',  name: 'Bhadreshwar',      city: 'Bhadreswar',   state: 'West Bengal', lat: 22.828202, lng: 88.341494, zone: 'ER', platforms: 4  },
  { code: 'BBAE', name: 'Baidyabati',       city: 'Baidyabati',   state: 'West Bengal', lat: 22.796936, lng: 88.332525, zone: 'ER', platforms: 2  },
  { code: 'SHE',  name: 'Seoraphuli',       city: 'Seoraphuli',   state: 'West Bengal', lat: 22.76917, lng: 88.32833, zone: 'ER', platforms: 6  },
  { code: 'SRP',  name: 'Shrirampur',       city: 'Serampore',    state: 'West Bengal', lat: 22.74833, lng: 88.34167, zone: 'ER', platforms: 4  },
  { code: 'RIS',  name: 'Rishra',           city: 'Rishra',       state: 'West Bengal', lat: 22.724706, lng: 88.343435, zone: 'ER', platforms: 2  },
  { code: 'KOG',  name: 'Konnagar',         city: 'Konnagar',     state: 'West Bengal', lat: 22.70125, lng: 88.34250, zone: 'ER', platforms: 2  },
  { code: 'HMZ',  name: 'Hind Motor',       city: 'Hindmotor',    state: 'West Bengal', lat: 22.683651, lng: 88.341799, zone: 'ER', platforms: 2  },
  { code: 'UPA',  name: 'Uttarpara',        city: 'Uttarpara',    state: 'West Bengal', lat: 22.665489, lng: 88.341080, zone: 'ER', platforms: 2  },
  { code: 'BLY',  name: 'Bally',            city: 'Bally',        state: 'West Bengal', lat: 22.65000, lng: 88.34000, zone: 'ER', platforms: 5  },
  { code: 'BEQ',  name: 'Belur',            city: 'Belur',        state: 'West Bengal', lat: 22.637402, lng: 88.339935, zone: 'ER', platforms: 4  },
  { code: 'LLH',  name: 'Liluah',           city: 'Liluah',       state: 'West Bengal', lat: 22.62106, lng: 88.33941, zone: 'ER', platforms: 3  },
  { code: 'HWH',  name: 'Howrah Junction',  city: 'Kolkata',      state: 'West Bengal', lat: 22.58287, lng: 88.34281, zone: 'ER', platforms: 23 },
];

// ── Real railway track waypoints between stations ──
// These intermediate points trace the actual railway line
// so the map polyline follows the real track curvature
const TRACK_WAYPOINTS = {
  // DOWN direction: BDC → HWH
  'BDC-HGY': [[22.9280, 88.3925], [22.9210, 88.3950]],
  'HGY-CNS': [[22.9070, 88.3960]],
  'CNS-CGR': [[22.8920, 88.3940], [22.8850, 88.3880]],
  'CGR-MUU': [[22.8610, 88.3785]],
  'MUU-BHR': [[22.8420, 88.3700], [22.8340, 88.3640]],
  'BHR-BBAE': [[22.8130, 88.3510], [22.8040, 88.3450]],
  'BBAE-SHE': [[22.7860, 88.3400], [22.7790, 88.3395]],
  'SHE-SRP': [[22.7630, 88.3395]],
  'SRP-RIS': [[22.7440, 88.3420], [22.7360, 88.3460]],
  'RIS-KOG': [[22.7160, 88.3520]],
  'KOG-HMZ': [[22.6960, 88.3545]],
  'HMZ-UPA': [[22.6780, 88.3530]],
  'UPA-BLY': [[22.6620, 88.3495]],
  'BLY-BEQ': [[22.6430, 88.3460]],
  'BEQ-LLH': [[22.6230, 88.3420]],
  'LLH-HWH': [[22.6030, 88.3410], [22.5940, 88.3415]],
};

// Find the index of the closest point in TRACK_GEOMETRY to a given lat/lng
function getClosestTrackIdx(lat, lng) {
  if (typeof TRACK_GEOMETRY === 'undefined') return 0;
  let minD = Infinity, idx = 0;
  for (let i = 0; i < TRACK_GEOMETRY.length; i++) {
    const [tLat, tLng] = TRACK_GEOMETRY[i];
    const d = (lat - tLat) * (lat - tLat) + (lng - tLng) * (lng - tLng);
    if (d < minD) { minD = d; idx = i; }
  }
  return idx;
}

// Build the full track path — ONLY using TRACK_GEOMETRY points (never station coords)
// This prevents diagonal spikes where platform coords diverge from the rail centreline
function getTrackPath(stationCodes) {
  if (typeof TRACK_GEOMETRY === 'undefined' || !TRACK_GEOMETRY.length) {
    return stationCodes.map(code => {
      const s = findStation(code);
      return s ? [s.lat, s.lng] : null;
    }).filter(Boolean);
  }

  // Get the track index for each station
  const indices = stationCodes.map(code => {
    const s = findStation(code);
    return s ? getClosestTrackIdx(s.lat, s.lng) : null;
  }).filter(idx => idx !== null);

  if (indices.length < 2) return [];

  // Determine overall direction (ascending or descending through TRACK_GEOMETRY)
  const step = indices[0] <= indices[indices.length - 1] ? 1 : -1;
  const iStart = indices[0];
  const iEnd   = indices[indices.length - 1];

  // Slice the TRACK_GEOMETRY — all points, no station coords inserted
  const path = [];
  for (let i = iStart; step > 0 ? i <= iEnd : i >= iEnd; i += step) {
    path.push(TRACK_GEOMETRY[i]);
  }
  return path;
}

// Helper: Find station by code
function findStation(code) {
  return STATIONS.find(s => s.code === code);
}

// Helper: Search stations by name/code
function searchStations(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return STATIONS.filter(s =>
    s.code.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.city.toLowerCase().includes(q)
  ).slice(0, 10);
}
