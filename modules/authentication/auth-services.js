'use strict';
 
angular.module('Authentication')
.factory('AuthenticationService',  ['Base64', '$http', '$cookieStore', '$rootScope', '$resource', 'SERVER_URL'
    , function (Base64, $http, $cookieStore, $rootScope, $resource, SERVER_URL) { 
	
        var service = {};

        //$("body").css({opacity: 0}); 
        
        service.Login = function(username, pass, callback) {
        	
        	var resourcePath = '/api/authenticate';      	
        	var epassword = Base64.encode(pass);

            var http = $resource(SERVER_URL + resourcePath, {userid:'@userid', password:'@password'});            
            http.get({'userid': username, 'password': epassword}, function(user) {
            	callback(user);
            	
    		}, function(err) {
            	var error  = {message : err, success : false};
            	callback(error);
    		});

            /* Use this for real authentication
             ----------------------------------------------*/
//            $http.get(resourcePath + '/:'+username+ '/:' + epassword, {userid: username, password: epassword})
//            .success(function (response) {
//            	response.success = true;
//            	callback(response);
//            })
//            .error(function (err) {
//            	callback({message : err, success : false});
//            });

        };
 
        service.SetCredentials = function (username, password) {
            var authdata = Base64.encode(username + ':' + password);        
            var sesId    = Math.random().toString(36).substr(2, 9);
 
            $rootScope.globals = {
                currentUser: {
                    username: username,
                    authdata: authdata
                    , sessionId : sesId
                }
            };
 
            $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;
            $cookieStore.put('globals', $rootScope.globals);
        };
 
        service.ClearCredentials = function () {
            $rootScope.globals = {};
            $cookieStore.remove('globals');
            $http.defaults.headers.common.Authorization = 'Basic ';
        };
        
        service.EncodeCredentials = function (password) {
            return Base64.encode(password);
        };
 
        return service;
    }])
 
.factory('Base64', function () {
    /* jshint ignore:start */
 
    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
 
    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;
 
            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
 
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
 
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
 
                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);
 
            return output;
        },
 
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;
 
            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                window.alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));
 
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
 
                output = output + String.fromCharCode(chr1);
 
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
 
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
 
            } while (i < input.length);
 
            return output;
        }
    };
 
})
//.factory('beforeUnload', function ($rootScope, $window) {
//    // Events are broadcast outside the Scope Lifecycle
//    
//    $window.onbeforeunload = function (e) {
//        var confirmation = {};
//        var event = $rootScope.$broadcast('onBeforeUnload', confirmation);
//        if (event.defaultPrevented) {
//            return confirmation.message;
//        }
//    };
//    
//    $window.onunload = function () {
//        $rootScope.$broadcast('onUnload');
//    };
//    return {};
//})
//.run(function (beforeUnload) {
//    // Must invoke the service at least once
//	console.log("Run beforeUnload");
//})
;

