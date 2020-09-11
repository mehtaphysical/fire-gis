#!/usr/bin/env node

const https = require('https');
const { MongoClient } = require('mongodb');

let client;
MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true, useNewUrlParser: true })
  .then(async(c) => {
    client = c;

    const db = client.db('fire-gis');
    const evacuations = db.collection('evacuations');

    const evacuationGIS = await fetch('https://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/Fire_Evacuation_Areas_Public/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=Fire_Evacuation_Level%2CCounty%2CEvac_Area_Name&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson');

    return evacuations.insertOne(evacuationGIS);
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
