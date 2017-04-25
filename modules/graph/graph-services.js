'use strict';

angular.module('Graph')
.factory('GraphService', ['$http', '$resource', 'SERVER_URL', function ($http, $resource, SERVER_URL) {

	var service = {};

	/** Get http url */
	service.GetHttpUrl = function() {
		return SERVER_URL;
	};

	/**
	 * Load active data
	 */
	service.getDataInfo = function(filepath, ilevel, successHandler, errorHandler) {

		var myhttp = $resource(SERVER_URL + "/getDatas/:level/:filepath");
		myhttp.get({filepath: filepath, level:ilevel}, function(res) { //encodeURIComponent(
			console.log("getDataInfo success !");
			successHandler(res.data); //data.$promise);
			
		}, function(err) {
			console.log("getDataInfo failed !" + err.responseText);
			if (errorHandler) errorHandler(err);
		});

	};
	
	/**
	 * List exported file
	 */
	service.getExportedFiles = function(successHandler, errorHandler) {

		var myhttp = $resource(SERVER_URL + "/getDatas/:level/:filepath");
		myhttp.get({filepath: filepath, level:ilevel}, function(res) { //encodeURIComponent(
			console.log("getDatas success !");
			successHandler(res.data); //data.$promise);
			
		}, function(err) {
			console.log("getDatas failed !" + err.responseText);
			if (errorHandler) errorHandler(err);
		});

	};
	
	/**
	 * Get entry informations
	 */
	service.getEntry= function(filepath, lnkname, successHandler, errorHandler) { 
		var myhttp = $resource(SERVER_URL + "/getEntry/:path/:lnkdir");		
		console.log("Call service.getEntry: " + filepath);
		myhttp.get({ path: filepath.split(","), lnkdir:lnkname }, function(res) {
			console.log("getEntry success ! " + path);
			successHandler(res.data); //data.$promise);
			
		}, function(err) {
			console.log("getEntry failed ! " + path + " " + err.responseText);
			if (errorHandler) {
				errorHandler(err);
			}
		});

	};

	return service;
}]);
