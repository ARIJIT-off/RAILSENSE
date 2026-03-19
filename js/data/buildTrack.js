const https = require('https');
const fs = require('fs');

// ═══════════════════════════════════════════════
// Build accurate Bandel–Howrah track geometry v3
// Uses Overpass API + station-guided way walking.
// For each station pair, finds connected ways that
// make progress toward the next station.
// ═══════════════════════════════════════════════

// Station coordinates (verified from OSM) — order: HWH → BDC
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

// Build Overpass polyline from stations
const coordStr = STATIONS.map(s => `${s.lat},${s.lng}`).join(',');

const query = `
[out:json][timeout:120];
way["railway"="rail"](around:200,${coordStr});
out body geom;
`;

function fetchOverpass(queryStr) {
  return new Promise((resolve, reject) => {
    const postData = queryStr;
    const options = {
      hostname: 'overpass-api.de',
      port: 443,
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Parse error')); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function sqDist(lat1, lng1, lat2, lng2) {
  return (lat1 - lat2) ** 2 + (lng1 - lng2) ** 2;
}

async function main() {
  console.log('Fetching railway data from Overpass API...');
  const data = await fetchOverpass(query);

  const ways = data.elements.filter(e => e.type === 'way' && e.geometry && e.nodes);
  console.log(`Got ${ways.length} railway ways`);

  // Build segments
  const segments = ways.map(way => ({
    id: way.id,
    nodeIds: way.nodes,
    coords: way.geometry.map(n => [n.lat, n.lon]),
    firstNodeId: way.nodes[0],
    lastNodeId: way.nodes[way.nodes.length - 1],
  }));

  // Node ID → segment indices
  const nodeToSegs = {};
  segments.forEach((seg, i) => {
    [seg.firstNodeId, seg.lastNodeId].forEach(nid => {
      if (!nodeToSegs[nid]) nodeToSegs[nid] = [];
      if (!nodeToSegs[nid].includes(i)) nodeToSegs[nid].push(i);
    });
  });

  // ═══════════════════════════════════════════════
  // Station-guided walk: for each station pair,
  // find connected ways that lead from station A to B
  // ═══════════════════════════════════════════════

  function closestSegAndPoint(lat, lng) {
    let bestD = Infinity, bestSeg = -1, bestPt = -1;
    segments.forEach((seg, i) => {
      seg.coords.forEach((c, j) => {
        const d = sqDist(c[0], c[1], lat, lng);
        if (d < bestD) { bestD = d; bestSeg = i; bestPt = j; }
      });
    });
    return { segIdx: bestSeg, ptIdx: bestPt, dist: Math.sqrt(bestD) * 111000 };
  }

  // For a station pair, find the shortest path through way segments
  function findPath(fromLat, fromLng, toLat, toLng, maxSteps) {
    const startInfo = closestSegAndPoint(fromLat, fromLng);
    const endInfo = closestSegAndPoint(toLat, toLng);

    if (startInfo.segIdx === endInfo.segIdx) return [startInfo.segIdx];

    // BFS with distance-to-target priority
    const visited = new Set();
    visited.add(startInfo.segIdx);
    let queue = [{ segIdx: startInfo.segIdx, path: [startInfo.segIdx] }];

    const targetDist = sqDist(fromLat, fromLng, toLat, toLng);
    let bestPath = null;
    let bestEndDist = Infinity;

    for (let step = 0; step < (maxSteps || 200); step++) {
      if (queue.length === 0) break;

      // Priority: pick segment whose endpoint is closest to target
      queue.sort((a, b) => {
        const segA = segments[a.segIdx];
        const segB = segments[b.segIdx];
        const dA = Math.min(
          sqDist(segA.coords[0][0], segA.coords[0][1], toLat, toLng),
          sqDist(segA.coords[segA.coords.length-1][0], segA.coords[segA.coords.length-1][1], toLat, toLng)
        );
        const dB = Math.min(
          sqDist(segB.coords[0][0], segB.coords[0][1], toLat, toLng),
          sqDist(segB.coords[segB.coords.length-1][0], segB.coords[segB.coords.length-1][1], toLat, toLng)
        );
        return dA - dB;
      });

      const { segIdx, path } = queue.shift();

      if (segIdx === endInfo.segIdx) {
        return path;
      }

      // Check if this segment is close enough to target
      const seg = segments[segIdx];
      for (const c of seg.coords) {
        const d = sqDist(c[0], c[1], toLat, toLng);
        if (d < bestEndDist) {
          bestEndDist = d;
          bestPath = path;
        }
      }

      // Explore connected ways
      const endpoints = [seg.firstNodeId, seg.lastNodeId];
      for (const nodeId of endpoints) {
        for (const nextIdx of (nodeToSegs[nodeId] || [])) {
          if (visited.has(nextIdx)) continue;

          // Reject ways that go too far from the corridor
          const nextSeg = segments[nextIdx];
          const midLat = (fromLat + toLat) / 2;
          const midLng = (fromLng + toLng) / 2;
          const maxCorridorDist = targetDist * 4; // generous corridor

          let tooFar = true;
          for (const c of nextSeg.coords) {
            if (sqDist(c[0], c[1], midLat, midLng) < maxCorridorDist) {
              tooFar = false;
              break;
            }
          }
          if (tooFar) continue;

          visited.add(nextIdx);
          queue.push({ segIdx: nextIdx, path: [...path, nextIdx] });
        }
      }
    }

    return bestPath || [startInfo.segIdx, endInfo.segIdx];
  }

  // Build the full track by walking station-to-station
  const allWayIndices = [];

  for (let i = 0; i < STATIONS.length - 1; i++) {
    const from = STATIONS[i];
    const to = STATIONS[i + 1];

    const path = findPath(from.lat, from.lng, to.lat, to.lng, 500);
    console.log(`  ${from.code} → ${to.code}: ${path.length} ways`);

    // Add only new ways (avoid duplicates at segment boundaries)
    for (const segIdx of path) {
      if (!allWayIndices.includes(segIdx)) {
        allWayIndices.push(segIdx);
      }
    }
  }

  console.log(`Total unique ways used: ${allWayIndices.length}`);

  // Chain the way geometries in correct order
  const trackCoords = [];

  for (let i = 0; i < allWayIndices.length; i++) {
    const seg = segments[allWayIndices[i]];
    let coords = [...seg.coords];

    if (trackCoords.length === 0) {
      // First segment — orient from HWH (south) northward
      const dHead = sqDist(coords[0][0], coords[0][1], STATIONS[0].lat, STATIONS[0].lng);
      const dTail = sqDist(coords[coords.length-1][0], coords[coords.length-1][1], STATIONS[0].lat, STATIONS[0].lng);
      if (dTail < dHead) coords.reverse();
      trackCoords.push(...coords);
    } else {
      // Connect to previous endpoint
      const prevEnd = trackCoords[trackCoords.length - 1];
      const dHead = sqDist(coords[0][0], coords[0][1], prevEnd[0], prevEnd[1]);
      const dTail = sqDist(coords[coords.length-1][0], coords[coords.length-1][1], prevEnd[0], prevEnd[1]);
      if (dTail < dHead) coords.reverse();
      trackCoords.push(...coords.slice(1));
    }
  }

  console.log(`Chained track: ${trackCoords.length} points`);

  // Trim to latitude range
  const minLat = STATIONS[0].lat - 0.002;
  const maxLat = STATIONS[STATIONS.length - 1].lat + 0.002;
  const trimmed = trackCoords.filter(c => c[0] >= minLat && c[0] <= maxLat);

  // Smooth: remove sharp zigzag points
  function bearingAngle(p1, p2) {
    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  }

  let smoothed = [...trimmed];
  let changed = true;
  let passes = 0;
  while (changed && passes < 10) {
    changed = false;
    passes++;
    const next = [smoothed[0]];
    for (let i = 1; i < smoothed.length - 1; i++) {
      const b1 = bearingAngle(smoothed[i-1], smoothed[i]);
      const b2 = bearingAngle(smoothed[i], smoothed[i+1]);
      let diff = Math.abs(b2 - b1);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff > 2.0) { // ~115 degrees
        changed = true;
        continue;
      }
      next.push(smoothed[i]);
    }
    next.push(smoothed[smoothed.length - 1]);
    smoothed = next;
  }
  console.log(`After smoothing (${passes} passes): ${smoothed.length} points`);

  // Downsample if too many points (keep every Nth to reduce to ~300-500)
  let final = smoothed;
  if (final.length > 500) {
    const keepEvery = Math.ceil(final.length / 400);
    const downsampled = [final[0]];
    for (let i = keepEvery; i < final.length - 1; i += keepEvery) {
      downsampled.push(final[i]);
    }
    downsampled.push(final[final.length - 1]);
    final = downsampled;
    console.log(`Downsampled to ${final.length} points`);
  }

  // Round
  const output = final.map(c => [
    Math.round(c[0] * 1e7) / 1e7,
    Math.round(c[1] * 1e7) / 1e7,
  ]);

  // Verify
  console.log('\n--- Station proximity check ---');
  STATIONS.forEach(st => {
    let minD = Infinity, bestI = 0;
    for (let i = 0; i < output.length; i++) {
      const d = sqDist(st.lat, st.lng, output[i][0], output[i][1]);
      if (d < minD) { minD = d; bestI = i; }
    }
    const meters = Math.round(Math.sqrt(minD) * 111000);
    console.log(`  ${st.code}: idx ${bestI}, offset ~${meters}m`);
  });

  // Check monotonicity (indices should increase)
  const stationIndices = STATIONS.map(st => {
    let minD = Infinity, bestI = 0;
    for (let i = 0; i < output.length; i++) {
      const d = sqDist(st.lat, st.lng, output[i][0], output[i][1]);
      if (d < minD) { minD = d; bestI = i; }
    }
    return bestI;
  });
  const isMonotonic = stationIndices.every((v, i) => i === 0 || v > stationIndices[i-1]);
  console.log(`Station indices monotonic: ${isMonotonic}`);
  if (!isMonotonic) {
    console.log('Station indices:', stationIndices.join(', '));
  }

  // Save
  const header = '// Auto-generated track geometry: Bandel–Howrah main line\n// Built using Overpass API station-guided way walking\n';
  const content = header + `const TRACK_GEOMETRY = ${JSON.stringify(output)};\n`;
  fs.writeFileSync('js/data/trackWaypoints.js', content);
  console.log('\n✅ Saved trackWaypoints.js');
}

main().catch(err => console.error('Error:', err.message));
