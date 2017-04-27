/**
 * AERO Client APP
 */
'use strict';

// common modules
angular.module('Authentication', ['ngResource']);
angular.module('Tree', []);

// app modules
angular.module('Graph', ['Tree']);

// <your PC network name or your PC network ip>'
// Add external ip o th server, Working with local host and not willing to be reached from network
var host = '127.0.0.1'; //TODO : set ip of the server
var port = 3000;

angular.module('aero-app', ['Authentication', 'ngRoute',  'ngCookies', 'Tree', 'Graph'])
.constant('SERVER_URL', 'http://' + host + ':' + port)
.config(['$routeProvider', function ($routeProvider) {

    $routeProvider	
        .when('/login', {
            controller : 'LoginController',
            templateUrl: 'modules/authentication/views/login.html',
            hideMenus: true
        })
        .when('/logout/:login/:project', {
            controller : 'LoginController',
            templateUrl: 'modules/authentication/views/login.html',
            hideMenus: true
        })
	    .when('/graph/:activePath?', {
	    	controller : 'GraphController',
	    	templateUrl: 'modules/graph/views/graph.html'
	    })
        .otherwise({ redirectTo: '/login' });
	} //end function
])
 
.run(['$rootScope', '$location', '$cookieStore', '$http', function ($rootScope, $location, $cookieStore, $http) {
	
        // keep user logged in after page refresh
        $rootScope.globals = $cookieStore.get('globals') || {};
        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
        }
 
        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in
            if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
                $location.path('/login');
            }
        });
    } //end function
]);