const https = require('https');
const { MongoClient } = require('mongodb');

let client;
MongoClient.connect('mongodb://localhost:27017')
  .then(async(c) => {
    client = c;

    const db = client.db('gis');
    const evacuations = db.collection('evacuations');
    const thermals = db.collection('thermals');
    const wildfires = db.collection('wildfires');

    const [evacuationGIS, thermalGIS, wildfireGIS] = await Promise.all([
      fetch('https://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services/Fire_Evacuation_Areas_Public/FeatureServer/0?f=json'),
      fetch('https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0?f=json'),
      fetch('https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0?f=json')
    ]);

    return Promise.all([
      evacuations.insert(evacuationGIS),
      thermals.insert(thermalGIS),
      wildfires.insert(wildfireGIS)
    ]);
  })
  .catch(console.error)
  .finally(() => {
    if(client) return client.close();
  });

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if(res.statusCode !== 200) return reject(`Request failed with status ${res.statusCode}`);

      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('error', err => reject(err));

      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch{
          reject('Unable to parse JSON');
        }
      });
    })
      .on('error', err => reject(err));
  });
}
