const fs = require('fs');

// ═══════════════════════════════════════════════
// Clean track by greedy walking: start at HWH,
// always pick the closest unused point that is
// reasonably close AND makes northward progress.
// This follows ONE track consistently.
// ═══════════════════════════════════════════════

const tw = fs.readFileSync('js/data/trackWaypoints.js', 'utf8');
const arr = JSON.parse('[' + tw.split('= [')[1].split('];')[0] + ']');

console.log('Input:', arr.length, 'points');

const STATIONS = [
  { code: 'HWH', lat: 22.5828709, lng: 88.3428112 },
  { code: 'LLH', lat: 22.6209027, lng: 88.3394035 },
  { code: 'BEQ', lat: 22.6357323, lng: 88.3398223 },
  { code: 'BLY', lat: 22.6550647, lng: 88.3403033 },
  { code: 'UPA', lat: 22.6670459, lng: 88.3411458 },
  { code: 'HMZ', lat: 22.6836507, lng: 88.3417989 },
  { code: 'KOG', lat: 22.7012600, lng: 88.3425107 },
  { code: 'RIS', lat: 22.7247059, lng: 88.3434353 },
  { code: 'SRP', lat: 22.7545791, lng: 88.3383079 },
  { code: 'SHE', lat: 22.7747220, lng: 88.3283330 },
  { code: 'BBAE', lat: 22.7949104, lng: 88.3317725 },
  { code: 'BHR', lat: 22.8282019, lng: 88.3414937 },
  { code: 'MUU', lat: 22.8473120, lng: 88.3471304 },
  { code: 'CGR', lat: 22.8670713, lng: 88.3540804 },
  { code: 'CNS', lat: 22.8909117, lng: 88.3702844 },
  { code: 'HGY', lat: 22.9052114, lng: 88.3760639 },
  { code: 'BDC', lat: 22.9236692, lng: 88.3782855 },
];

function sqDist(lat1, lng1, lat2, lng2) {
  return (lat1 - lat2) ** 2 + (lng1 - lng2) ** 2;
}

function dist(p1, p2) {
  return Math.sqrt(sqDist(p1[0], p1[1], p2[0], p2[1]));
}

// Strategy: For each station pair, collect raw points in the corridor,
// then do a greedy walk picking nearest-forward-neighbor consistently.

const finalTrack = [];

for (let s = 0; s < STATIONS.length - 1; s++) {
  const from = STATIONS[s];
  const to = STATIONS[s + 1];
  
  // Collect candidate points in the corridor between stations
  const segLat1 = Math.min(from.lat, to.lat) - 0.003;
  const segLat2 = Math.max(from.lat, to.lat) + 0.003;
  const segLng1 = Math.min(from.lng, to.lng) - 0.005;
  const segLng2 = Math.max(from.lng, to.lng) + 0.005;
  
  const candidates = [];
  for (let i = 0; i < arr.length; i++) {
    const lat = arr[i][0], lng = arr[i][1];
    if (lat >= segLat1 && lat <= segLat2 && lng >= segLng1 && lng <= segLng2) {
      candidates.push({ lat, lng, idx: i });
    }
  }
  
  if (candidates.length === 0) {
    console.log(`  ${from.code}→${to.code}: no candidates, using direct`);
    if (finalTrack.length === 0 || dist(finalTrack[finalTrack.length-1], [from.lat, from.lng]) > 0.0001) {
      finalTrack.push([from.lat, from.lng]);
    }
    finalTrack.push([to.lat, to.lng]);
    continue;
  }
  
  // Greedy nearest-neighbor walk from 'from' station to 'to' station
  // Start at the candidate closest to 'from'
  const used = new Set();
  
  let current = null;
  let bestStartD = Infinity;
  for (const c of candidates) {
    const d = sqDist(c.lat, c.lng, from.lat, from.lng);
    if (d < bestStartD) { bestStartD = d; current = c; }
  }
  
  const path = [[current.lat, current.lng]];
  used.add(current.idx);
  
  const targetDist = Math.sqrt(sqDist(from.lat, from.lng, to.lat, to.lng));
  const maxHop = Math.max(0.002, targetDist * 0.15); // max hop distance ~15% of segment
  
  // Walk toward 'to' by picking nearest unused candidate that makes progress
  for (let step = 0; step < 1000; step++) {
    // Check if we're close enough to target
    const dToTarget = Math.sqrt(sqDist(current.lat, current.lng, to.lat, to.lng));
    if (dToTarget < 0.001) break; // within ~100m of target
    
    // Find nearest unused candidate that:
    // 1. Is within maxHop
    // 2. Is closer to 'to' than current (making progress)
    let bestNext = null;
    let bestDist = Infinity;
    
    for (const c of candidates) {
      if (used.has(c.idx)) continue;
      
      const d = Math.sqrt(sqDist(c.lat, c.lng, current.lat, current.lng));
      if (d > maxHop) continue; // too far away
      
      // Must make progress toward target
      const dCandToTarget = Math.sqrt(sqDist(c.lat, c.lng, to.lat, to.lng));
      if (dCandToTarget >= dToTarget + 0.0005) continue; // going backwards
      
      if (d < bestDist) {
        bestDist = d;
        bestNext = c;
      }
    }
    
    if (!bestNext) break; // stuck
    
    current = bestNext;
    used.add(current.idx);
    path.push([current.lat, current.lng]);
  }
  
  console.log(`  ${from.code}→${to.code}: ${path.length} pts (from ${candidates.length} candidates)`);
  
  // Add to final track (skip first point if not first segment to avoid duplicates)
  const startI = (finalTrack.length === 0) ? 0 : 1;
  for (let i = startI; i < path.length; i++) {
    finalTrack.push(path[i]);
  }
}

console.log(`\nFinal track: ${finalTrack.length} points`);

// Verify
console.log('\n--- Station proximity check ---');
STATIONS.forEach(st => {
  let minD = Infinity, bestI = 0;
  for (let i = 0; i < finalTrack.length; i++) {
    const d = sqDist(st.lat, st.lng, finalTrack[i][0], finalTrack[i][1]);
    if (d < minD) { minD = d; bestI = i; }
  }
  const meters = Math.round(Math.sqrt(minD) * 111000);
  console.log(`  ${st.code}: idx ${bestI}, offset ~${meters}m`);
});

// Check monotonicity
const stationIndices = STATIONS.map(st => {
  let minD = Infinity, bestI = 0;
  for (let i = 0; i < finalTrack.length; i++) {
    const d = sqDist(st.lat, st.lng, finalTrack[i][0], finalTrack[i][1]);
    if (d < minD) { minD = d; bestI = i; }
  }
  return bestI;
});
const isMonotonic = stationIndices.every((v, i) => i === 0 || v >= stationIndices[i-1]);
console.log(`Station indices monotonic: ${isMonotonic}`);

// Check for big jumps
let bigJumps = 0;
for (let i = 1; i < finalTrack.length; i++) {
  const d = dist(finalTrack[i], finalTrack[i-1]);
  if (d > 0.005) { // ~500m
    bigJumps++;
    console.log(`  ⚠ Jump at idx ${i}: ${(d * 111000).toFixed(0)}m`);
  }
}
if (bigJumps === 0) console.log('✅ No big jumps');

// Round and save
const output = finalTrack.map(c => [
  Math.round(c[0] * 1e7) / 1e7,
  Math.round(c[1] * 1e7) / 1e7,
]);

const header = '// Auto-generated track geometry: Bandel–Howrah main line\n// Cleaned with greedy nearest-forward-neighbor walk\n';
const content = header + `const TRACK_GEOMETRY = ${JSON.stringify(output)};\n`;
fs.writeFileSync('js/data/trackWaypoints.js', content);
console.log('\n✅ Saved trackWaypoints.js');
