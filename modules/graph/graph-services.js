'use strict';

angular.module('Graph')
.factory('GraphService', ['$http', '$resource', 'SERVER_URL', function ($http, $resource, SERVER_URL) {

	var service = {};

	/** Get http url */
	service.GetHttpUrl = function() {
		return SERVER_URL;
	};

	/**
	 * Load data
	 */
	service.getDatas = function(filepath, ilevel, successHandler, errorHandler) {

		var http = $resource(SERVER_URL + "/getDatas/:level/:filepath");
		http.get({filepath: filepath, level:ilevel}, function(res) { //encodeURIComponent(
			console.log("getDatas success !");
			successHandler(res.data); //data.$promise);
			
		}, function(err) {
			console.log("getDatas failed !" + err.responseText);
			errorHandler(err);
		});

		/*//OK : with app.get('/getDatas', api.getDatas); on sever
		$.get(SERVER_URL + "/getDatas?level="+ilevel+"&path="+encodeURIComponent(filepath), function(data) { 
			console.log("getDatas success !");
			sucessHandler(data);
			
		}).fail(function(err) {
			console.log("getDatas failed !" + err.responseText);
			if (errorHandler) errorHandler(err);
		});
		*/
	};

	service.SetCredentials = function (username, password) {
		var authdata = Base64.encode(username + ':' + password);

		$rootScope.globals = {
				currentUser: {
					username: username,
					authdata: authdata
				}
		};

		$http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;
		//$cookieStore.put('globals', $rootScope.globals);
	};

	service.ClearCredentials = function () {
	};

	
	return service;
}]);
