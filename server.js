var express = require('express');

var server = express();
server.use(express.static(__dirname + '/ionic_rainapp/www'));

server.get('/test', function(req, res){
	res.writeHead(200, { 'Content-Type': 'text/plain' });
  	res.end('Hello World\n');
});


var port = process.env.PORT || 1337;
server.listen(port);

// server.listen(port, function() {
// 	console.log("server listening on port " + port);
// });



// var http = require('http')
// var port = process.env.PORT || 1337;
// http.createServer(function(req, res) {
//   res.writeHead(200, { 'Content-Type': 'text/plain' });
//   res.end('Hello World\n');
// }).listen(port);