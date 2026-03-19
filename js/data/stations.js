// ═══════════════════════════════════════════════
// RailSmart — Station Data
// Coverage: HWH–BWN Main Line, HWH–BWN Chord Line, HWH–Goghat Line
// ═══════════════════════════════════════════════

const STATIONS = [
  // ── SHARED: Howrah Junction (all routes start here) ──
  { code: 'HWH',  name: 'Howrah Jn',         city: 'Howrah',       state: 'West Bengal', lat: 22.583271, lng: 88.342811, zone: 'ER', platforms: 23, routes: ['main','chord','goghat'] },

  // ── SHARED: HWH–BLY section (Main + Chord) ──
  { code: 'LLH',  name: 'Liluah',            city: 'Liluah',       state: 'West Bengal', lat: 22.620903, lng: 88.339403, zone: 'ER', platforms: 4,  routes: ['main','chord'] },
  { code: 'BEQ',  name: 'Belur',             city: 'Belur',        state: 'West Bengal', lat: 22.635732, lng: 88.339822, zone: 'ER', platforms: 4,  routes: ['main','chord'] },
  { code: 'BLY',  name: 'Bally',             city: 'Bally',        state: 'West Bengal', lat: 22.655065, lng: 88.340303, zone: 'ER', platforms: 4,  routes: ['main','chord'] },

  // ── MAIN LINE ONLY: Bally → Bandel ──
  { code: 'UPA',  name: 'Uttarpara',         city: 'Uttarpara',    state: 'West Bengal', lat: 22.667046, lng: 88.341146, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'HMZ',  name: 'Hind Motor',        city: 'Hind Motor',   state: 'West Bengal', lat: 22.683651, lng: 88.341799, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'KOG',  name: 'Konnagar',          city: 'Konnagar',     state: 'West Bengal', lat: 22.701260, lng: 88.342511, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'RIS',  name: 'Rishra',            city: 'Rishra',       state: 'West Bengal', lat: 22.724706, lng: 88.343435, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'SRP',  name: 'Shrirampur',        city: 'Serampore',    state: 'West Bengal', lat: 22.754579, lng: 88.338308, zone: 'ER', platforms: 4,  routes: ['main','goghat'] },
  { code: 'SHE',  name: 'Seoraphuli Jn',     city: 'Seoraphuli',   state: 'West Bengal', lat: 22.774722, lng: 88.328333, zone: 'ER', platforms: 6,  routes: ['main','goghat'] },
  { code: 'BBAE', name: 'Baidyabati',        city: 'Baidyabati',   state: 'West Bengal', lat: 22.794910, lng: 88.331773, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'BHR',  name: 'Bhadreshwar',       city: 'Bhadreswar',   state: 'West Bengal', lat: 22.828202, lng: 88.341494, zone: 'ER', platforms: 4,  routes: ['main'] },
  { code: 'MUU',  name: 'Mankundu',          city: 'Mankundu',     state: 'West Bengal', lat: 22.847312, lng: 88.347130, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'CGR',  name: 'Chandannagar',      city: 'Chandannagar', state: 'West Bengal', lat: 22.867071, lng: 88.354080, zone: 'ER', platforms: 4,  routes: ['main'] },
  { code: 'CNS',  name: 'Chinsurah',         city: 'Chinsurah',    state: 'West Bengal', lat: 22.890912, lng: 88.370284, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'HGY',  name: 'Hooghly',           city: 'Hooghly',      state: 'West Bengal', lat: 22.905211, lng: 88.376064, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'BDC',  name: 'Bandel Jn',         city: 'Bandel',       state: 'West Bengal', lat: 22.923669, lng: 88.378286, zone: 'ER', platforms: 6,  routes: ['main'] },

  // ── MAIN LINE: Bandel → Burdwan ──
  { code: 'ADST', name: 'Adi Saptagram',     city: 'Saptagram',    state: 'West Bengal', lat: 22.954722, lng: 88.379167, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'MUG',  name: 'Magra',             city: 'Magra',        state: 'West Bengal', lat: 22.984167, lng: 88.368056, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'TLO',  name: 'Talandu',           city: 'Talandu',      state: 'West Bengal', lat: 23.010556, lng: 88.345556, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'KHN',  name: 'Khanyan',           city: 'Khanyan',      state: 'West Bengal', lat: 23.046389, lng: 88.315278, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'PDA',  name: 'Pundooah',          city: 'Pundooah',     state: 'West Bengal', lat: 23.070694, lng: 88.269694, zone: 'ER', platforms: 3,  routes: ['main'] },
  { code: 'SLG',  name: 'Simlagarh',         city: 'Simlagarh',    state: 'West Bengal', lat: 23.096111, lng: 88.231667, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'BCGM', name: 'Bainchigram',       city: 'Bainchigram',  state: 'West Bengal', lat: 23.110000, lng: 88.210000, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'BOI',  name: 'Bainchi',           city: 'Bainchi',      state: 'West Bengal', lat: 23.119444, lng: 88.196667, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'DBP',  name: 'Debipur',           city: 'Debipur',      state: 'West Bengal', lat: 23.140000, lng: 88.165000, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'BGF',  name: 'Bagila',            city: 'Bagila',       state: 'West Bengal', lat: 23.158333, lng: 88.125833, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'MYM',  name: 'Memari',            city: 'Memari',       state: 'West Bengal', lat: 23.172778, lng: 88.095000, zone: 'ER', platforms: 3,  routes: ['main'] },
  { code: 'NMF',  name: 'Nimo',              city: 'Nimo',         state: 'West Bengal', lat: 23.180556, lng: 88.068889, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'RSLR', name: 'Rasulpur',          city: 'Rasulpur',     state: 'West Bengal', lat: 23.187500, lng: 88.040833, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'PLAE', name: 'Palsit',            city: 'Palsit',       state: 'West Bengal', lat: 23.196667, lng: 88.003056, zone: 'ER', platforms: 2,  routes: ['main'] },
  { code: 'SKG',  name: 'Saktigarh',         city: 'Saktigarh',    state: 'West Bengal', lat: 23.207222, lng: 87.969444, zone: 'ER', platforms: 3,  routes: ['main','chord'] },
  { code: 'GRP',  name: 'Gangpur',           city: 'Gangpur',      state: 'West Bengal', lat: 23.225000, lng: 87.910000, zone: 'ER', platforms: 2,  routes: ['main','chord'] },
  { code: 'BWN',  name: 'Barddhaman Jn',     city: 'Burdwan',      state: 'West Bengal', lat: 23.249910, lng: 87.869840, zone: 'ER', platforms: 10, routes: ['main','chord'] },

  // ── CHORD LINE: Bally → Dankuni → Burdwan ──
  { code: 'BZL',  name: 'Belanagar',         city: 'Belanagar',    state: 'West Bengal', lat: 22.661205, lng: 88.317647, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'DKAE', name: 'Dankuni Jn',        city: 'Dankuni',      state: 'West Bengal', lat: 22.678300, lng: 88.290800, zone: 'ER', platforms: 4,  routes: ['chord'] },
  { code: 'GBRA', name: 'Gobra',             city: 'Gobra',        state: 'West Bengal', lat: 22.696070, lng: 88.279389, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'JOX',  name: 'Janai Road',        city: 'Janai',        state: 'West Bengal', lat: 22.720873, lng: 88.265695, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'BPAE', name: 'Begampur',          city: 'Begampur',     state: 'West Bengal', lat: 22.745000, lng: 88.248000, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'BRPA', name: 'Baruipara',         city: 'Baruipara',    state: 'West Bengal', lat: 22.768000, lng: 88.235000, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'MBE',  name: 'Mirzapur Bankipur', city: 'Mirzapur',     state: 'West Bengal', lat: 22.790742, lng: 88.222182, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'BLAE', name: 'Balarambati',       city: 'Balarambati',  state: 'West Bengal', lat: 22.808031, lng: 88.211622, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'KQU',  name: 'Kamarkundu',        city: 'Kamarkundu',   state: 'West Bengal', lat: 22.821698, lng: 88.204736, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'MDSE', name: 'Madhusudanpur',     city: 'Madhusudanpur',state: 'West Bengal', lat: 22.845825, lng: 88.192505, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'CDAE', name: 'Chandanpur',        city: 'Chandanpur',   state: 'West Bengal', lat: 22.880406, lng: 88.176387, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'PBZ',  name: 'Porabazar',         city: 'Porabazar',    state: 'West Bengal', lat: 22.917350, lng: 88.159262, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'BMAE', name: 'Belmuri',           city: 'Belmuri',      state: 'West Bengal', lat: 22.932824, lng: 88.152207, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'DNHL', name: 'Dhaniakhali H',     city: 'Dhaniakhali',  state: 'West Bengal', lat: 22.960000, lng: 88.140000, zone: 'ER', platforms: 1,  routes: ['chord'] },
  { code: 'SHBC', name: 'Sibaichandi',       city: 'Sibaichandi',  state: 'West Bengal', lat: 22.980000, lng: 88.132000, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'HIH',  name: 'Hajigarh',          city: 'Hajigarh',     state: 'West Bengal', lat: 23.000000, lng: 88.122000, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'GRAE', name: 'Gurap',             city: 'Gurap',        state: 'West Bengal', lat: 23.025021, lng: 88.112232, zone: 'ER', platforms: 3,  routes: ['chord'] },
  { code: 'JPQ',  name: 'Jhapandanga',       city: 'Jhapandanga',  state: 'West Bengal', lat: 23.052000, lng: 88.095000, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'JRAE', name: 'Jaugram',           city: 'Jaugram',      state: 'West Bengal', lat: 23.079613, lng: 88.080023, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'NBAE', name: 'Nabagram',          city: 'Nabagram',     state: 'West Bengal', lat: 23.105000, lng: 88.060000, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'MSAE', name: 'Masagram',          city: 'Masagram',     state: 'West Bengal', lat: 23.130000, lng: 88.035000, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'CHC',  name: 'Chanchai',          city: 'Chanchai',     state: 'West Bengal', lat: 23.155000, lng: 88.005000, zone: 'ER', platforms: 2,  routes: ['chord'] },
  { code: 'PRAE', name: 'Pallaroad',         city: 'Pallaroad',    state: 'West Bengal', lat: 23.180000, lng: 87.970000, zone: 'ER', platforms: 2,  routes: ['chord'] },
  // SKG, GRP, BWN already defined above with routes: ['main','chord']

  // ── GOGHAT LINE: Seoraphuli → Tarakeswar → Goghat ──
  { code: 'DEA',  name: 'Diara',             city: 'Diara',        state: 'West Bengal', lat: 22.798358, lng: 88.281483, zone: 'ER', platforms: 2,  routes: ['goghat'] },
  { code: 'NSF',  name: 'Nasibpur',          city: 'Nasibpur',     state: 'West Bengal', lat: 22.804985, lng: 88.262608, zone: 'ER', platforms: 2,  routes: ['goghat'] },
  { code: 'SIU',  name: 'Singur',            city: 'Singur',       state: 'West Bengal', lat: 22.814835, lng: 88.227696, zone: 'ER', platforms: 2,  routes: ['goghat'] },
  { code: 'KQLS', name: 'Kamarkundu Lr',     city: 'Kamarkundu',   state: 'West Bengal', lat: 22.825829, lng: 88.205940, zone: 'ER', platforms: 2,  routes: ['goghat'] },
  { code: 'NKL',  name: 'Nalikul',           city: 'Nalikul',      state: 'West Bengal', lat: 22.830301, lng: 88.166773, zone: 'ER', platforms: 2,  routes: ['goghat'] },
  { code: 'MLYA', name: 'Maliya H',          city: 'Maliya',       state: 'West Bengal', lat: 22.837000, lng: 88.142000, zone: 'ER', platforms: 1,  routes: ['goghat'] },
  { code: 'HPL',  name: 'Haripal',           city: 'Haripal',      state: 'West Bengal', lat: 22.831547, lng: 88.119163, zone: 'ER', platforms: 2,  routes: ['goghat'] },
  { code: 'KKAE', name: 'Kaikala',           city: 'Kaikala',      state: 'West Bengal', lat: 22.845000, lng: 88.090000, zone: 'ER', platforms: 2,  routes: ['goghat'] },
  { code: 'BAHW', name: 'Bahir Khanda',      city: 'Bahir Khanda', state: 'West Bengal', lat: 22.852647, lng: 88.069119, zone: 'ER', platforms: 2,  routes: ['goghat'] },
  { code: 'LOK',  name: 'Loknath',           city: 'Loknath',      state: 'West Bengal', lat: 22.871608, lng: 88.034151, zone: 'ER', platforms: 2,  routes: ['goghat'] },
  { code: 'TAK',  name: 'Tarakeswar',        city: 'Tarakeswar',   state: 'West Bengal', lat: 22.882219, lng: 88.014420, zone: 'ER', platforms: 3,  routes: ['goghat'] },
  { code: 'TLPH', name: 'Talpur H',          city: 'Talpur',       state: 'West Bengal', lat: 22.874822, lng: 87.974433, zone: 'ER', platforms: 1,  routes: ['goghat'] },
  { code: 'TKPH', name: 'Takipur H',         city: 'Takipur',      state: 'West Bengal', lat: 22.865500, lng: 87.927817, zone: 'ER', platforms: 1,  routes: ['goghat'] },
  { code: 'MAYP', name: 'Mayapur',           city: 'Mayapur',      state: 'West Bengal', lat: 22.878000, lng: 87.870000, zone: 'ER', platforms: 2,  routes: ['goghat'] },
  { code: 'AMBG', name: 'Arambagh',          city: 'Arambagh',     state: 'West Bengal', lat: 22.880000, lng: 87.780000, zone: 'ER', platforms: 3,  routes: ['goghat'] },
  { code: 'GOGT', name: 'Goghat',            city: 'Goghat',       state: 'West Bengal', lat: 22.898720, lng: 87.707950, zone: 'ER', platforms: 2,  routes: ['goghat'] },
];

// ── Real railway track waypoints between stations ──
const TRACK_WAYPOINTS = {};

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
  ).slice(0, 15);
}

// Helper: Get stations on a specific route
function getStationsOnRoute(routeId) {
  return STATIONS.filter(s => s.routes && s.routes.includes(routeId));
}
