const axios = require('axios');

// Fetch exact station nodes from OSM for Chinsurah and Bhadreswar on HWH-Bandel line
const query = `
[out:json][timeout:30];
(
  node["railway"="station"]["name"~"Chinsurah|Chuchura|Bhadreswar|Bhadreshwar|Mankundu"](22.82,88.33,22.92,88.41);
  node["railway"="halt"]["name"~"Chinsurah|Chuchura|Bhadreswar|Bhadreshwar|Mankundu"](22.82,88.33,22.92,88.41);
);
out body;
`;

axios.post('https://overpass-api.de/api/interpreter', query, {
  headers: { 'Content-Type': 'text/plain' }
}).then(r => {
  r.data.elements.forEach(e => {
    console.log(`${e.tags.name} | lat:${e.lat} lng:${e.lon}`);
  });
}).catch(e => console.error(e.message));
