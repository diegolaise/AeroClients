'use strict';
 
angular.module('Tree')
.factory('TreeService', ['$http', '$resource', 'SERVER_URL', function ($http, $resource, SERVER_URL) {

	var service = {};

	service.Login = function(username, pass, callback) {


	};

	service.EncodeCredentials = function (password) {
		return Base64.encode(password);
	};

	return service;
}]
);

