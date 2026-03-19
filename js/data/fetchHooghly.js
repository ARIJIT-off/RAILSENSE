const axios = require('axios');
const query = `
[out:json][timeout:10];
(
  node["railway"="station"]["name"~"Hooghly"](22.88,88.35,22.92,88.40);
);
out body;
`;
axios.post('https://overpass-api.de/api/interpreter', query, {headers: {'Content-Type': 'text/plain'}})
.then(r => r.data.elements.forEach(e => console.log(e.tags.name + ' | lat:'+e.lat+' lng:'+e.lon)))
.catch(e => console.error(e));
