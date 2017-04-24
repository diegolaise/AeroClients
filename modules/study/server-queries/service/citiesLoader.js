
angular.module('server-queries')
.factory('citiesLoader', ['$resource', 'SERVER_URL', function($resource, SERVER_URL){
	var resourcePath = '/api/cities';

	var load = function(successHandler, errorHandler)
	{
		var citiesResource = $resource(SERVER_URL + resourcePath);
		
		var cities = citiesResource.query(function() {
			successHandler(cities);
		}, function() {
			errorHandler();
		});
	};

	return load;

}]);
