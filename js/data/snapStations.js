const fs = require('fs');
const path = require('path');

const trackData = JSON.parse(fs.readFileSync(path.join(__dirname, 'track.json'), 'utf8'));
const track = trackData.track.coordinates; // [lng, lat]

const stations = [
  { code:'CNS', lat:22.89778, lng:88.39500 },
  { code:'CGR', lat:22.86972, lng:88.38194 },
  { code:'BHR', lat:22.83778, lng:88.37306 },
  { code:'HMZ', lat:22.68306, lng:88.35028 },
  { code:'UPA', lat:22.66472, lng:88.34750 },
];

for (const s of stations) {
  let minD = Infinity, best = null;
  for (const [lng, lat] of track) {
    const d = (lat - s.lat) * (lat - s.lat) + (lng - s.lng) * (lng - s.lng);
    if (d < minD) { minD = d; best = { lat, lng }; }
  }
  const distM = Math.round(Math.sqrt(minD) * 111000);
  console.log(s.code + ' -> ' + best.lat.toFixed(6) + ', ' + best.lng.toFixed(6) + '  (' + distM + 'm snapped)');
}
