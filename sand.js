const https = require('https');

fetchThermals()
  .then(console.log);

function sleep(seconds) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

function fetchThermals() {
  return fetchWithRetry('https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0/query?where=%28latitude+BETWEEN+42+AND+46%29+AND+%28longitude+BETWEEN+-124+AND+-117%29&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=frp%2Cconfidence&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=');
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
