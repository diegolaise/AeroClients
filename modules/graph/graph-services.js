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
			errorHandler(err);
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
			errorHandler(err);
		});

	};
	
	/**
	 * Load active data
	 */
	service.getEntry= function(filepath, lnk_dir, successHandler, errorHandler) {

		var myhttp = $resource(SERVER_URL + "/getEntry/:filepath/:lnkdir");
		myhttp.get({filepath: filepath, lnkdir:lnk_dir}, function(res) {
			console.log("getDataInfo success !");
			successHandler(res.data); //data.$promise);
			
		}, function(err) {
			console.log("getDataInfo failed !" + err.responseText);
			errorHandler(err);
		});

	};

	return service;
}]);
