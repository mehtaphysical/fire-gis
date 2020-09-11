#!/usr/bin/env node

const https = require('https');
const { MongoClient } = require('mongodb');

let client;
MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true, useNewUrlParser: true })
  .then(async(c) => {
    client = c;

    const db = client.db('fire-gis');
    const evacuations = db.collection('evacuations');
    const thermals = db.collection('thermals');

    const evacuationGIS = await fetchWithRetry('https://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/Fire_Evacuation_Areas_Public/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=Fire_Evacuation_Level%2CCounty%2CEvac_Area_Name&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson');
    const thermalsGIS = await fetchWithRetry('https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0/query?where=%28latitude+BETWEEN+42+AND+46%29+AND+%28longitude+BETWEEN+-124+AND+-117%29&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=frp%2Cconfidence&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=');

    return Promise.all([
      evacuations.insertOne(evacuationGIS),
      thermals.insertOne(thermalsGIS)
    ]);
  })
  .catch(console.error)
  .finally(() => {
    if(client) return client.close();
  });

function sleep(seconds) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

function fetchWithRetry(url) {
  return fetch(url)
    .catch(err => {
      if(err.code === 429) {
        return sleep(60)
          .then(() =>  fetchWithRetry(url));
      }
    });
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if(res.statusCode !== 200) return reject(`Request failed with status ${res.statusCode}`);

      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('error', err => reject(err));

      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if(json.error) reject(json.error);
          else resolve(json);
        } catch{
          reject('Unable to parse JSON');
        }
      });
    })
      .on('error', err => reject(err));
  });
}
