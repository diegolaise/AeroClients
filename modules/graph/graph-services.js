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
			//console.log("getDataInfo success !");
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
			//console.log("getDatas success !");
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
		console.log("Call service.getEntry: " + filepath);
		var myhttp = $resource(SERVER_URL + "/getEntry/:path/:lnkdir");		
		
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
	
	service.getListFiles = function(tmp_path, successHandler, errorHandler) { 
		var myhttp = $resource(SERVER_URL + "/getListFiles/:path");	
		myhttp.get({path : tmp_path}, function(res) {
			successHandler(res.data); 
		}
		, function(err) { 
			if (errorHandler) {
				errorHandler(err);
			}
		});
	};
	
	/**
	 * Remove exported file
	 * @param filePath
	 * @param fdelegate
	 */
	service.removeExportedFile = function(filePath, fdelegate)  {
		var myhttp = $resource(SERVER_URL + "/removeFiles/:path");	
		myhttp.get( {path : filePath.split(",")}, function(success) {
				if (fdelegate) {
					fdelegate(success);
				}  
			} 
		);	
	}

	return service;
}]);
