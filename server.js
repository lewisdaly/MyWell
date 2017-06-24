var express = require('express');
var server = express();
var router = express.Router();
var qs = require('qs'); // to read query string params and stringify them

//To fix routing issues with Angular and Auth0
server.get('/register', function(req, res, next) {
  var route = req.query.route; // retrieve the route param that contains the SPA client side route user needs to be redirected to.

  delete req.query.route; // remove it from query params.
  res.redirect('http://docker.local:8080/#/' + route + '?' +  qs.stringify(req.query)); // Send a 302 redirect for the expected route
});

module.exports = router;

server.use(express.static(__dirname + '/src/www'));

server.get('/test', function(req, res){
	res.writeHead(200, { 'Content-Type': 'text/plain' });
  	res.end('Hello World\n');
});


var port = process.env.PORT || 1337;
server.listen(port, function() {
	console.log("server listening on port " + port);
});



// var http = require('http')
// var port = process.env.PORT || 1337;
// http.createServer(function(req, res) {
//   res.writeHead(200, { 'Content-Type': 'text/plain' });
//   res.end('Hello World\n');
// }).listen(port);
