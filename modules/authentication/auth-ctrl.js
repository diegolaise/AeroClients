'use strict';

angular.module('Authentication')
.controller('LoginController', ['$scope', '$rootScope', '$location', '$routeParams', 'AuthenticationService', //'beforeUnload',
	function ($scope, $rootScope, $location, $routeParams, AuthenticationService//, beforeUnload
			) {
	
		//Set default to graph
		$scope._project = $routeParams.project || "graph";
		$scope.dataLoading = false;
		$scope.username = $routeParams.login || "";
		$scope.error = "";
		
		// Reset login status
		AuthenticationService.ClearCredentials();
	
		$scope.login = function () {
			$scope.dataLoading = true;
			wait();
				
			AuthenticationService.Login($scope.username, $scope.password, function(response) {

				endwait();
				$scope.dataLoading = false;

				if (response && response._id) {
					
					//Save authentication
					AuthenticationService.SetCredentials($scope.username, $scope.password);
					
					var url = AuthenticationService.decode("");
					console.log("URL: " + url);
					
//					var p = encodeURIComponent('/Projects/A330_WV052/2-WORKSPACE/2-FORWARD_LOWER_SHELL/FRAMES_38-39.2/1-ExtractionResults/FR39_LHS_L1_U__90XXFR002001.cas?ver=3';
//					var p = '/Projects/A330_WV052/1-LOADS/INPUT/STATIC/COMBINED/load_combined_1.dat?ver=4';
//					var p = '/Projects/A330_WV052/1-LOADS/RESULTS/STATIC/COMBINED/load_combined_1.neut?ver=';
//					var p = '/Projects/A330_WV052/0-MODEL/modele_v2005_MOD_1.neut?ver=1';
					var p = '/Projects/A330_WV052/2-WORKSPACE/2-FORWARD_LOWER_SHELL/FRAMES_38-39.2/0-AnalysisPoints/FR39_LHS.dpsn3?ver=4';
					var spath = encodeURIComponent(p);
					
					//Redirect to selected project
					$location.path('/' + $scope._project + '/' + spath);;
				} 
				else {
					if (!response.message) 
						$scope.error = "Invalid user or password"; 
					else
						$scope.error = response.message;

					$scope.dataLoading = false;
					bootbox.alert($scope.error);
				}
			});
		};//end login
		
//	    $scope.$on('onBeforeUnload', function (e, confirmation) {
//	        confirmation.message = "All data willl be lost.";
//	        e.preventDefault();
//	    });
	    
//	    $scope.$on('onUnload', function (e) {
//			AuthenticationService.ClearCredentials();
//	        console.log('leaving page'); // Use 'Preserve Log' option in Console
//	    });
		

}]); ///-- End controller
