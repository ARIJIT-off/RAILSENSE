const axios = require('axios');
const fs = require('fs');

const BBOX = '22.55,88.28,22.95,88.42';

// Known station codes for matching
const STATION_CODE_MAP = {
  'Bandel Junction': 'BDC',
  'Bandel': 'BDC',
  'Hooghly': 'HGY',
  'Chuchura': 'CNS',
  'Chinsurah': 'CNS',
  'Chandannagar': 'CGR',
  'Chandernagore': 'CGR',
  'Mankundu': 'MUU',
  'Bhadreswar': 'BHR',
  'Bhadreshwar': 'BHR',
  'Baidyabati': 'BBAE',
  'Seoraphuli': 'SHE',
  'Serampore': 'SRP',
  'Shrirampur': 'SRP',
  'Rishra': 'RIS',
  'Konnagar': 'KOG',
  'Hind Motor': 'HMZ',
  'Hindmotor': 'HMZ',
  'Uttarpara': 'UPA',
  'Bally': 'BLY',
  'Belur': 'BEQ',
  'Liluah': 'LLH',
  'Howrah': 'HWH',
  'Howrah Junction': 'HWH',
};

// Station order BDC → HWH
const STATION_ORDER = ['BDC','HGY','CNS','CGR','MUU','BHR','BBAE','SHE','SRP','RIS','KOG','HMZ','UPA','BLY','BEQ','LLH','HWH'];

async function fetchData() {
  console.log('Fetching track ways and station nodes from Overpass API...');

  // Fetch both track ways and station/halt nodes in one request
  const query = `
    [out:json][timeout:60];
    (
      way["railway"="rail"](${BBOX});
      node["railway"="station"](${BBOX});
      node["railway"="halt"](${BBOX});
    );
    out geom;
  `;

  const resp = await axios.post(
    'https://overpass-api.de/api/interpreter',
    query,
    { headers: { 'Content-Type': 'text/plain' } }
  );

  const elements = resp.data.elements;
  console.log(`Got ${elements.length} elements`);

  // ─── 1. Process Station Nodes ───────────────────────────────────────────
  const stationNodes = elements.filter(e => e.type === 'node' && e.tags && (e.tags.railway === 'station' || e.tags.railway === 'halt'));
  
  const stations = [];
  stationNodes.forEach(node => {
    const name = node.tags['name'] || node.tags['name:en'] || '';
    const code = STATION_CODE_MAP[name];
    if (!code) return; // not one of our 17 stations

    // Avoid duplicates
    if (stations.find(s => s.code === code)) return;

    stations.push({
      code,
      name: node.tags['name'] || name,
      lat: node.lat,
      lng: node.lon,
      platforms: parseInt(node.tags['platforms'] || node.tags['railway:platform_count'] || '2'),
    });
  });

  // Sort by corridor order
  stations.sort((a, b) => STATION_ORDER.indexOf(a.code) - STATION_ORDER.indexOf(b.code));
  console.log(`Found ${stations.length} matching stations:`, stations.map(s => s.code).join(', '));

  // ─── 2. Process Track Ways ────────────────────────────────────────────
  const ways = elements.filter(e => e.type === 'way' && e.geometry);

  // Collect all segments (arrays of [lng, lat] coordinate pairs)
  const segments = ways.map(way =>
    way.geometry.map(node => [node.lon, node.lat])
  );

  // Chain segments into one continuous LineString
  // Strategy: start from the northernmost point (near BDC), greedily connect nearest segment ends
  function dist2(a, b) {
    return Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2);
  }

  function chainSegments(segs) {
    if (!segs.length) return [];
    
    let result = segs[0].slice();
    let remaining = segs.slice(1);

    while (remaining.length > 0) {
      const lastPt = result[result.length - 1];
      let bestIdx = -1;
      let bestDist = Infinity;
      let bestReverse = false;

      remaining.forEach((seg, i) => {
        const dHead = dist2(lastPt, seg[0]);
        const dTail = dist2(lastPt, seg[seg.length - 1]);
        if (dHead < bestDist) { bestDist = dHead; bestIdx = i; bestReverse = false; }
        if (dTail < bestDist) { bestDist = dTail; bestIdx = i; bestReverse = true; }
      });

      if (bestIdx === -1 || bestDist > 0.001) break; // Gap too large — stop chaining

      const seg = remaining.splice(bestIdx, 1)[0];
      const toAdd = bestReverse ? seg.slice().reverse() : seg;
      result = result.concat(toAdd.slice(1)); // Skip first point (same as last of result)
    }

    return result;
  }

  let trackCoords = chainSegments(segments);

  // Ensure direction is BDC (north) → HWH (south): southernmost point should be at the end
  if (trackCoords.length > 1) {
    const firstLat = trackCoords[0][1];
    const lastLat  = trackCoords[trackCoords.length - 1][1];
    if (firstLat < lastLat) {
      trackCoords = trackCoords.reverse();
    }
  }

  console.log(`Track has ${trackCoords.length} coordinate nodes`);

  // ─── 3. Save track.json ───────────────────────────────────────────────
  const output = {
    stations,
    track: {
      type: 'LineString',
      coordinates: trackCoords,
    },
  };

  fs.writeFileSync(
    'c:\\Users\\aleri\\OneDrive\\Desktop\\railsmart\\js\\data\\track.json',
    JSON.stringify(output, null, 2)
  );

  console.log('✅ Saved track.json');
  console.log(`   Stations: ${stations.length}`);
  console.log(`   Track nodes: ${trackCoords.length}`);
}

fetchData().catch(err => console.error('Error:', err.message));
