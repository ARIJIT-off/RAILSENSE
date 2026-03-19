const fs = require('fs');

// ═══════════════════════════════════════════════
// Station-guided corridor track extraction v2
// For each station pair, collect ALL raw points within
// a corridor, sort them by progress along the segment,
// and chain them together.
// ═══════════════════════════════════════════════

const rawData = JSON.parse(fs.readFileSync('js/data/track.json', 'utf8'));
const allPoints = rawData.track.coordinates; // [lng, lat]

// Station coordinates in order: HWH (south) → BDC (north)
const STATIONS = [
  { code: 'HWH', lat: 22.58287, lng: 88.34281 },
  { code: 'LLH', lat: 22.62106, lng: 88.33941 },
  { code: 'BEQ', lat: 22.63740, lng: 88.33994 },
  { code: 'BLY', lat: 22.65000, lng: 88.34000 },
  { code: 'UPA', lat: 22.66549, lng: 88.34108 },
  { code: 'HMZ', lat: 22.68365, lng: 88.34180 },
  { code: 'KOG', lat: 22.70125, lng: 88.34250 },
  { code: 'RIS', lat: 22.72471, lng: 88.34344 },
  { code: 'SRP', lat: 22.74833, lng: 88.34167 },
  { code: 'SHE', lat: 22.76917, lng: 88.32833 },
  { code: 'BBAE', lat: 22.79694, lng: 88.33253 },
  { code: 'BHR', lat: 22.82820, lng: 88.34149 },
  { code: 'MUU', lat: 22.84731, lng: 88.34713 },
  { code: 'CGR', lat: 22.88265, lng: 88.36476 },
  { code: 'CNS', lat: 22.89093, lng: 88.37034 },
  { code: 'HGY', lat: 22.90521, lng: 88.37606 },
  { code: 'BDC', lat: 22.92363, lng: 88.37833 },
];

function sqDist(lat1, lng1, lat2, lng2) {
  return (lat1 - lat2) ** 2 + (lng1 - lng2) ** 2;
}

// Distance from point P to line segment AB, and projection t along AB
function pointToSegment(pLat, pLng, aLat, aLng, bLat, bLng) {
  const abLat = bLat - aLat;
  const abLng = bLng - aLng;
  const abLen2 = abLat * abLat + abLng * abLng;
  
  if (abLen2 === 0) return { dist: Math.sqrt(sqDist(pLat, pLng, aLat, aLng)), t: 0 };
  
  let t = ((pLat - aLat) * abLat + (pLng - aLng) * abLng) / abLen2;
  
  // Allow slight overshoot to capture points near stations
  const tClamped = Math.max(-0.05, Math.min(1.05, t));
  
  const projLat = aLat + tClamped * abLat;
  const projLng = aLng + tClamped * abLng;
  
  const dist = Math.sqrt(sqDist(pLat, pLng, projLat, projLng));
  return { dist, t };
}

console.log('Building station-guided track path (v2 corridor filter)...');
console.log(`Raw points available: ${allPoints.length}`);

const fullPath = []; // [lat, lng] output

for (let i = 0; i < STATIONS.length - 1; i++) {
  const from = STATIONS[i];
  const to = STATIONS[i + 1];
  
  const segDist = Math.sqrt(sqDist(from.lat, from.lng, to.lat, to.lng));
  
  // Corridor width in degrees — ~300m which is about 0.003 degrees
  // Wider for longer segments, narrower for shorter ones  
  const corridorWidth = Math.max(0.003, segDist * 0.15);
  
  // Collect all raw points within the corridor
  const candidates = [];
  for (let j = 0; j < allPoints.length; j++) {
    const ptLat = allPoints[j][1];
    const ptLng = allPoints[j][0];
    
    const { dist, t } = pointToSegment(ptLat, ptLng, from.lat, from.lng, to.lat, to.lng);
    
    if (dist <= corridorWidth && t >= -0.05 && t <= 1.05) {
      candidates.push({ lat: ptLat, lng: ptLng, t, dist });
    }
  }
  
  // Sort candidates by their projection along the segment
  candidates.sort((a, b) => a.t - b.t);
  
  // Remove duplicates that are too close together
  const filtered = [];
  for (const c of candidates) {
    if (filtered.length === 0 || 
        sqDist(c.lat, c.lng, filtered[filtered.length - 1].lat, filtered[filtered.length - 1].lng) > 0.000001) {
      filtered.push(c);
    }
  }
  
  // When we have overlapping tracks (parallel lines), pick the one closest
  // to the station-to-station line by grouping candidates at similar t values
  const dedupedByT = [];
  for (const c of filtered) {
    // If the last point has a very similar t value, keep the one closer to the line
    if (dedupedByT.length > 0) {
      const last = dedupedByT[dedupedByT.length - 1];
      if (Math.abs(c.t - last.t) < 0.005) {
        // Same position along segment — keep the closer one
        if (c.dist < last.dist) {
          dedupedByT[dedupedByT.length - 1] = c;
        }
        continue;
      }
    }
    dedupedByT.push(c);
  }
  
  console.log(`  ${from.code} → ${to.code}: ${dedupedByT.length} points (from ${candidates.length} candidates)`);
  
  // Add points to the full path
  const startJ = (i === 0) ? 0 : 1; // skip first to avoid duplicates
  for (let j = startJ; j < dedupedByT.length; j++) {
    fullPath.push([
      Math.round(dedupedByT[j].lat * 1e7) / 1e7,
      Math.round(dedupedByT[j].lng * 1e7) / 1e7,
    ]);
  }
}

console.log(`\nTotal track points: ${fullPath.length}`);

// Verify station proximity
console.log('\n--- Station proximity check ---');
STATIONS.forEach(st => {
  let minD = Infinity, bestI = 0;
  for (let i = 0; i < fullPath.length; i++) {
    const d = sqDist(st.lat, st.lng, fullPath[i][0], fullPath[i][1]);
    if (d < minD) { minD = d; bestI = i; }
  }
  const meters = Math.round(Math.sqrt(minD) * 111000);
  console.log(`  ${st.code}: idx ${bestI}, offset ~${meters}m`);
});

// Write output
const header = '// Auto-generated track geometry: Bandel–Howrah main line\n// Generated by sortTrack.js using station-guided corridor extraction\n';
const content = header + `const TRACK_GEOMETRY = ${JSON.stringify(fullPath)};\n`;
fs.writeFileSync('js/data/trackWaypoints.js', content);

console.log('\n✅ Saved trackWaypoints.js');
