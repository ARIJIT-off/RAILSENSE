const https = require('https');
const fs = require('fs');

// ═══════════════════════════════════════════════
// Build track v6: POINT-LEVEL greedy walk.
// Uses ALL individual coordinates from all ways
// as a point pool, then walks from HWH to BDC
// picking nearest unvisited points that continue 
// in a consistent direction. Uses spatial grid
// for fast neighbor lookup.
// ═══════════════════════════════════════════════

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

const CACHE_FILE = 'js/data/overpass_cache.json';

const coordStr = STATIONS.map(s => `${s.lat},${s.lng}`).join(',');
const query = `[out:json][timeout:120];\nway["railway"="rail"](around:200,${coordStr});\nout body geom;`;

function fetchOverpass(q) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'overpass-api.de', port: 443, path: '/api/interpreter',
      method: 'POST', headers: { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(q) },
    };
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject); req.write(q); req.end();
  });
}

async function getData() {
  // Try cache first
  if (fs.existsSync(CACHE_FILE)) {
    console.log('Using cached Overpass data');
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  }
  console.log('Fetching from Overpass API...');
  const data = await fetchOverpass(query);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
  console.log('Cached to', CACHE_FILE);
  return data;
}

function sqDist(a, b) { return (a[0]-b[0])**2 + (a[1]-b[1])**2; }
function bearing(p1, p2) { return Math.atan2(p2[1]-p1[1], p2[0]-p1[0]); }
function bearingDiff(b1, b2) {
  let d = Math.abs(b2 - b1);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return d;
}

async function main() {
  const data = await getData();
  const ways = data.elements.filter(e => e.type === 'way' && e.geometry);
  console.log(`Got ${ways.length} ways`);

  // Extract ALL points from all ways, tagged with their way ID
  // Within a way, consecutive points are on the same track
  const allPoints = [];
  ways.forEach(w => {
    const coords = w.geometry.map(g => [g.lat, g.lon]);
    coords.forEach((c, i) => {
      allPoints.push({
        lat: c[0], lng: c[1],
        wayId: w.id,
        posInWay: i,
        wayLen: coords.length,
        idx: allPoints.length,
      });
    });
  });
  console.log(`Total points: ${allPoints.length}`);

  // Build spatial grid for fast neighbor lookup
  const CELL = 0.001; // ~100m cells
  const grid = {};
  allPoints.forEach(p => {
    const key = `${Math.floor(p.lat/CELL)},${Math.floor(p.lng/CELL)}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(p);
  });

  function nearbyPoints(lat, lng, radius) {
    const results = [];
    const cx = Math.floor(lat / CELL);
    const cy = Math.floor(lng / CELL);
    const r = Math.ceil(radius / CELL) + 1;
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const cell = grid[`${cx+dx},${cy+dy}`];
        if (!cell) continue;
        for (const p of cell) {
          const d = Math.sqrt(sqDist([p.lat, p.lng], [lat, lng]));
          if (d <= radius) results.push({ ...p, dist: d });
        }
      }
    }
    return results.sort((a, b) => a.dist - b.dist);
  }

  // ═══════════════════════════════════════════════
  // GREEDY WALK: For each station pair, walk from
  // one station to the next by picking nearby
  // unvisited points. Prefer points on the SAME WAY
  // to avoid jumping between parallel tracks.
  // ═══════════════════════════════════════════════

  const used = new Set(); // global set of used point indices
  const fullTrack = [];
  const MAX_HOP = 0.002; // ~200m max hop between consecutive points

  for (let s = 0; s < STATIONS.length - 1; s++) {
    const from = STATIONS[s];
    const to = STATIONS[s + 1];

    // Find starting point: nearest to 'from' station
    const starts = nearbyPoints(from.lat, from.lng, 0.005);
    let current = null;
    for (const p of starts) {
      if (!used.has(p.idx)) { current = p; break; }
    }
    if (!current && starts.length > 0) current = starts[0];
    if (!current) {
      console.log(`  ${from.code}→${to.code}: NO START POINT`);
      continue;
    }

    const segPoints = [[current.lat, current.lng]];
    used.add(current.idx);
    let currentBearing = bearing([from.lat, from.lng], [to.lat, to.lng]);

    for (let step = 0; step < 2000; step++) {
      // Check if we've reached close to target
      const dTarget = Math.sqrt(sqDist([current.lat, current.lng], [to.lat, to.lng]));
      if (dTarget < 0.001) break; // within ~100m

      // Find nearby unvisited points
      const nearby = nearbyPoints(current.lat, current.lng, MAX_HOP)
        .filter(p => !used.has(p.idx) && p.idx !== current.idx);

      if (nearby.length === 0) break;

      // Score candidates
      let bestScore = -Infinity;
      let bestCandidate = null;

      for (const cand of nearby) {
        const candBearing = bearing([current.lat, current.lng], [cand.lat, cand.lng]);
        const bDiff = bearingDiff(currentBearing, candBearing);

        // Reject U-turns (>120°)
        if (bDiff > 2.1) continue;

        // Score: bearing continuity + same-way bonus + progress toward target
        let score = 0;

        // Bearing continuity (closer to current bearing = better)
        score += (Math.PI - bDiff) * 10;

        // Same-way bonus: strongly prefer staying on the same way
        if (cand.wayId === current.wayId) {
          // Extra bonus if it's the NEXT point in the way
          const posDiff = Math.abs(cand.posInWay - current.posInWay);
          if (posDiff === 1) {
            score += 50; // BIG bonus for consecutive same-way point
          } else if (posDiff <= 3) {
            score += 20;
          } else {
            score += 5;
          }
        }

        // Progress toward target
        const dCandTarget = Math.sqrt(sqDist([cand.lat, cand.lng], [to.lat, to.lng]));
        score += (dTarget - dCandTarget) * 100; // closer to target = more points

        // Distance penalty (closer = better)
        score -= cand.dist * 50;

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = cand;
        }
      }

      if (!bestCandidate) break;

      // Update bearing (smooth with previous)
      const newBearing = bearing([current.lat, current.lng], [bestCandidate.lat, bestCandidate.lng]);
      currentBearing = newBearing; // follow the track's actual direction

      current = bestCandidate;
      used.add(current.idx);
      segPoints.push([current.lat, current.lng]);
    }

    console.log(`  ${from.code}→${to.code}: ${segPoints.length} pts`);

    // Add to full track
    if (fullTrack.length === 0) {
      fullTrack.push(...segPoints);
    } else {
      fullTrack.push(...segPoints.slice(1));
    }
  }

  console.log(`\nFull track: ${fullTrack.length} points`);

  // Remove near-duplicates
  const deduped = [fullTrack[0]];
  for (let i = 1; i < fullTrack.length; i++) {
    if (Math.sqrt(sqDist(fullTrack[i], fullTrack[i-1])) > 0.00003) {
      deduped.push(fullTrack[i]);
    }
  }

  // Round
  const output = deduped.map(c => [Math.round(c[0]*1e7)/1e7, Math.round(c[1]*1e7)/1e7]);
  console.log(`Output: ${output.length} points`);

  // Verify
  console.log('\n--- Station proximity check ---');
  const sIdxs = [];
  STATIONS.forEach(st => {
    let minD = Infinity, bestI = 0;
    for (let i = 0; i < output.length; i++) {
      const d = sqDist([st.lat, st.lng], output[i]);
      if (d < minD) { minD = d; bestI = i; }
    }
    sIdxs.push(bestI);
    console.log(`  ${st.code}: idx ${bestI}, ~${Math.round(Math.sqrt(minD)*111000)}m`);
  });
  console.log(`Monotonic: ${sIdxs.every((v,i)=>i===0||v>=sIdxs[i-1])}`);

  let jumps = 0;
  for (let i = 1; i < output.length; i++) {
    const d = Math.sqrt(sqDist(output[i], output[i-1]));
    if (d > 0.003) { jumps++; console.log(`  ⚠ Jump@${i}: ${(d*111000).toFixed(0)}m`); }
  }
  console.log(jumps === 0 ? '✅ No big jumps!' : `${jumps} jumps > 300m`);

  fs.writeFileSync('js/data/trackWaypoints.js',
    '// Auto-generated: Bandel–Howrah main line\n// Built with point-level greedy walk + same-way preference\n' +
    `const TRACK_GEOMETRY = ${JSON.stringify(output)};\n`);
  console.log('\n✅ Saved!');
}

main().catch(e => console.error('Error:', e.message));
