/** ====================================================================
 *  
 * Tree view Main functions 
 * 
 * ====================================================================*/
'use strict';
/** ================================================================== */

angular.module('Tree')
.controller('TreeController', ['$scope', '$location', '$http', '$routeParams', '$rootScope', 'TreeService',
	function ($scope, $location, $http, $routeParams, $rootScope, TreeService) {


	/** INITIALIZE */
	$scope.initilizeTree = function() {  
		console.log("==> Starting Tree .... " );


	};


}]); //----- END tree controller -------
