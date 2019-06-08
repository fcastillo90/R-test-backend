const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    'allowedHeaders': ['Content-Type'],
    'exposedHeaders': ['Content-Type'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}));
var redis = require("redis");
var request = require('request');
var bluebird = require("bluebird");
const EXPIRATION_TIME = 60

app.post('/external-api', function(req, res){
  bluebird.promisifyAll(redis);
  client = redis.createClient(process.env.REDIS_URL);
  var lon = req.body.lon;
  var lat = req.body.lat;
  if(!lat || !lon){
    res.send({data: {}, error: true});
    return;
  }
  //Get from redis
  client.getAsync(`${lat}_${lon}`).then(function(response) {
    if(response){
      res.send({data: JSON.parse(response), error: false});
      return;
    }
    else {
      request(`https://api.darksky.net/forecast/090a0b6cc056a114d6482411e288f319/${lat},${lon}`, function (error, response, body) {
        client.set(`${lat}_${lon}`, body , 'EX', EXPIRATION_TIME);
        res.send({data: JSON.parse(body), error: false});
        return;
      });
    }
  });
});

app.listen(port, () => {
 console.log(`Server ready on port ${port}`);
});
