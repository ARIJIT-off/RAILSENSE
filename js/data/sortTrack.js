const fs = require('fs');

// Read raw OSM geometry
const rawData = JSON.parse(fs.readFileSync('js/data/track.json', 'utf8'));
let points = [...rawData.track.coordinates]; // [lng, lat]

// The goal is to build a single ordered path from Howrah (South) to Bandel (North)
// 1. Find Howrah node (approx 22.58287, 88.34281)
let hwhIdx = -1;
let minHD = Infinity;
for (let i = 0; i < points.length; i++) {
  const d = (points[i][1] - 22.58287)**2 + (points[i][0] - 88.34281)**2;
  if (d < minHD) { minHD = d; hwhIdx = i; }
}

const ordered = [];
let current = points[hwhIdx];
ordered.push(current);
points.splice(hwhIdx, 1);

// Greedily pick the closest next point
while (points.length > 0) {
  let nextIdx = -1;
  let minD = Infinity;

  for (let i = 0; i < points.length; i++) {
    const d = (points[i][1] - current[1])**2 + (points[i][0] - current[0])**2;
    if (d < minD) {
      minD = d;
      nextIdx = i;
    }
  }

  // To prevent the line from jumping back on itself at junctions, 
  // if the closest point is too far (> 500m approx), and we're already far north, we might stop
  // For now, just continue building the chain
  current = points[nextIdx];
  ordered.push(current);
  points.splice(nextIdx, 1);
}

// Write to trackWaypoints.js ([lat, lng])
const outputArray = ordered.map(p => [(Math.round(p[1]*1e7)/1e7), (Math.round(p[0]*1e7)/1e7)]);
const content = `const TRACK_GEOMETRY = ${JSON.stringify(outputArray)};\n`;
fs.writeFileSync('js/data/trackWaypoints.js', content);

console.log('Path nodes: ' + outputArray.length);

// Check distances and indices of stations
const stsStr = fs.readFileSync('js/data/stations.js', 'utf8').replace('const STATIONS = ', '').replace(';', '');
const STATIONS = eval(stsStr);

const codes = ['HWH', 'LLH', 'BEQ', 'BLY', 'UPA', 'HMZ', 'KOG', 'RIS', 'SRP', 'SHE', 'BBAE', 'BHR', 'MUU', 'CGR', 'CNS', 'HGY', 'BDC'];

console.log('--- Station Indices along the track ---');
codes.forEach(c => {
  const s = STATIONS.find(x => x.code === c);
  let bestI = -1; let minD = Infinity;
  for(let i=0; i<outputArray.length; i++){
    const d = (outputArray[i][0] - s.lat)**2 + (outputArray[i][1] - s.lng)**2;
    if(d < minD){ minD = d; bestI = i; }
  }
  console.log(c + ': idx ' + bestI + ' (offset ' + Math.round(Math.sqrt(minD)*111000) + 'm)');
});

