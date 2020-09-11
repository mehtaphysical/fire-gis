const http = require('http');
const { MongoClient } = require('mongodb');

const getCount = (evacuations) => {
  return evacuations.countDocuments()
    .then(count => ({ count }));
};

const getEvacuation = (evacuations, index) => {
  return evacuations.findOne({}, { limit: 1, skip: +index });
};

const handleRequest = evacuations => async(req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET OPTIONS');
  const [index] = req.url.split('/').slice(-1);

  const responseBody = await (index === 'count' ? getCount(evacuations) : getEvacuation(evacuations, index));

  res.end(JSON.stringify(responseBody));
};

MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true, useNewUrlParser: true })
  .then(client => {
    const evacuations = client.db('fire-gis').collection('evacuations');
    const server = http.createServer(handleRequest(evacuations));
    server.listen(9191);
  });
