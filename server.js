var express = require('express');

var server = express();
server.use(express.static(__dirname + '/ionic_rainapp/www'));

var port = 80;
server.listen(port, function() {
	console.log("server listening on port " + port);
});