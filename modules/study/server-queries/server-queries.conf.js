// Use only one of the following
//var host = '10.226.201.151'; // VeloToulouse production server
var host = 'localhost'; // Working with local host and not willing to be reached from network
//var host = '<your PC network name or your PC network ip>'; // Working with local host and using it through network

// Default ports
angular.module("server-queries.conf", [])
.constant('SERVER_URL', 'http://' + host + ':3000')
.constant('CLIENT_URL', 'http://' + host + ':1664');
