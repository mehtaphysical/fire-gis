const http = require('http');
const { MongoClient } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true, useNewUrlParser: true })
  .then(client => {
    const evacuations = client.db('fire-gis').collection('evacuations');
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET OPTIONS');
      const index = req.url.split('/').slice(-1);
      evacuations.findOne({}, { limit: 1, skip: +index })
        .then(evacuation => res.end(JSON.stringify(evacuation)));
    });
    
    server.listen(9191);
  });
