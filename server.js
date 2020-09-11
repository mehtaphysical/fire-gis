const http = require('http');
const { MongoClient } = require('mongodb');

const getCount = collection => {
  return collection.countDocuments()
    .then(count => ({ count }));
};

const getDocuments = (collection, index) => {
  return collection.findOne({}, { limit: 1, skip: +index });
};

const handleRequest = db => async(req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET OPTIONS');

  const [collection, index] = req.url.split('/').slice(-2);
  const responseBody = (index === 'count'
    ? await getCount(db.collection(collection))
    : await getDocuments(db.collection(collection), index));
    
  res.end(JSON.stringify(responseBody));
};

MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true, useNewUrlParser: true })
  .then(client => {
    const db = client.db('fire-gis');
    const server = http.createServer(handleRequest(db));
    server.listen(9191);
  });
