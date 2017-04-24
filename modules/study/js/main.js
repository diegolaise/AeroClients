//====================================================== 
// 
//  Angular Viewer Application 
//    
//   Version 2.4
// 
//====================================================== 
  
/** Controller for parameter settings */ 
var FemApp = angular.module('SdmaApp', []); 
FemApp.controller('paramController', function ($scope, $location, $http){ 
 
	$scope._project  = "viewer"; 
	$scope._home	 = "/sdma/index.jsp?project=viewer";
	$scope._revision = _REVISION;
	 
	//The empty widget Id, for html 
	$scope._emptyWdgtId = _EMPTY_WDT_ID; 
	$scope._ALUrl = location.protocol + "//" + location.host;
 
	$scope._sessionId = ""; 
	$scope._login 	  = "";  
	$scope._logStr	  = ""; 
	 
	$scope._profile = {}; 
	
	$scope._oSelectedView = "";  //The selected view
	
	$scope._personalViews	= {}; 
	$scope._sharedViews  	= {}; 
 
	$scope._commonWidgets 	= {}; //Common widgets  
	$scope._personalWidgets	= {}; //Personal widgets   
 
	$scope._lStudies = new Array(); /* list of all studies */ 
	$scope._lFolders = new Array(); /* list of all studies */ 
	 
	$scope._allImages = null; /* All images */ 
	 
	$scope._businessMetadata = null;/* Medatadas dictionary */ 
	
	$scope._dSettingConfig = { "Small menu" 		: "collapsemenu"
							   , "Fixed footer"		: "fixedfooter" 
							   , "Scrolled sidebar" : "fixedsidebar" 
							 }
	//----------------------------------------------- 
	_oAppScope = $scope;  
	//----------------------------------------------- 
	  
 	/** LOG IN */ 
	$scope.loggIn  = function(mess) {  
		if (mess) {
			bootbox.alert(mess, function() {
				window.location.href = $scope._home; 
			});
		} else {
			window.location.href = $scope._home; 
		}
	};
	 
	/** INITIALIZE */ 
	$scope.initialize = function() { 
		 
		$("body").css({opacity: 0});  
		console.log("Initialize main viewer ..."); 
		 
		//----------------------------------- 
		// Read parameters 
		//----------------------------------- 
		var dConfig = parseParameters($location.path());
		
		$scope._sessionId = dConfig[_SESSION_ID];
		
		var tParam 	= dConfig[_PARAMETER]; 
		if (tParam.length>0) $scope._logStr = tParam[0];  

		if (!$scope._logStr) {  
			$scope.loggIn("Initialization failed : <br>Unknown Connection String !");
			return;
		} 
   
		//----------------------
		// 	CONNECT HERE
		//-----------------------
		//console.log("-> Connect ...");
		var sURL = "/sdma/libs/connect.jsp?" + $scope.params("&");
		$http({ method	: "GET" 
			, url		: sURL
			, dataType	: "text"   
			, headers 	: $scope.xhrHeader()  
			
		}).success(function(jdata) { 
			
			//Init login
			$scope._login = jdata["login"];
		  
			//- Read all images to Log-In and launch page init 
			console.log("\n-> Load Images  ...");
			$scope.loadImageFiles($scope.initPage); 
		 
			//- Read all BusinessMetadata.xml 
			console.log("\n-> Load BusinessMetadata  ...");
			$scope.loadBusinessMetadata(); 
			
		}).error(function (err, status, headers, config) { 
			console.log("Connection failed ! "+ err); //JSON.stringify(err.responseText)); 
			$scope.loggIn("Connection failed ! : <br>" + err.responseText);  
		});  
		 
	};//End initialize 
	 
	/** Get additional parameter of requests */ 
	$scope.params  = function(sep) { 
		if (!sep) sep = ""; 
		if (!$scope._sessionId) return "";  
		
		var urlP = sep + "sessionId=" + $scope._sessionId;
		urlP += "&logStr=" + $scope._logStr;  
		return urlP;
	};
	 
	/** Get xhrHeader log string */ 
	$scope.xhrHeader = function() { 
		return { "Content-Type"		: "application/json" 
			    , "WWW-authenticate": "database" 
				, "Authorization"   : "Basic " + $scope._logStr 
				}; 
	}; 
	
	//------------------------------------------------------ 
	//	Login && read Images 
	//------------------------------------------------------ 
	$scope.loadImageFiles = function(callback) { 
		if ($scope._allImages) { 
			if (callback) callback(); 
			return; 
		} 
		 
		var rootPath = "/sdma/" + $scope._project 
		var paths = ""; var sep =""; 
		$.each(_IMG_PATH, function(i, p){ 
			paths += sep + rootPath + p; 
			sep= ","; 
		}); 
  
		var sURL = PATH_URL() + "?action=listPaths"+ $scope.params("&") + "&path="+paths;
		$http({ method		: "GET" 
				, url		: sURL
				, dataType	: "json"   
				, data		: {}   
				, headers 	: $scope.xhrHeader()  
				
		}).success(function(dImages) { 
  
			var nb = 0; 
			$scope._allImages = {};  
			$.each(dImages, function(pk, dic) {  
 				var key = pk;  
				$.each(_IMG_PATH, function(i, k){ 
					if (pk.indexOf(k)>0) { 
						key = k; 
						return false; //break 
					} 
				});  
				$scope._allImages[key] = dic; 
				//console.log("  Images Of: "+ key + " => " + JSON.stringify(dic)); 
				nb += Object.keys(dic).length; 
			}); 
			console.log("  -> Images Loaded! " + nb); 
			 
			//------------- INIT PAGES -------------------------- 
			if (callback) callback(); 
			 
		}).error(function (err, status, headers, config) { 
			console.log("!! ERROR loadImageFiles: \n"+ err);
			$scope.loggIn("Initialization failed : <br>" + err);
		});  
	}; 
	 
	/** Initialize pages */ 
	$scope.initPage  = function() {	  
		console.log("\n------- Login : " + $scope._project + " --------"); 
		
		//------------ WELCOME ---- 
		toastr.success("<h4>Welcome to SDMA "+ $scope._project.toUpperCase() + " Viewer</h4>" 
											, "" ,{"positionClass": "toast-top-center"});  
		  
		//------------------------ 
		// Request Options 
		//------------------------ 
		var request = { method	: "GET" 
						, url		: "" 
						, dataType	: "json"   
						, data		: {}  
						, xhrFields	: { withCredentials: true } 
						, headers 	: $scope.xhrHeader() 
						};  
		 
		//Load profile first 
		var projectUri		= _DATA_URI + $scope._project + "/"; 
		var userProfileUri 	= projectUri + $scope._login + "/";  
		request.url = userProfileUri + _PROFILE_FILE; 
		$scope.loadProfile(request); 
		 
		//- All http url loader  
		var dSettings = {};  
		
		//Load studies
		var stdParam = "?action=ALchildFolders&path=/Projects" + $scope.params("&"); 
		dSettings[PATH_URL() + stdParam] = $scope.loadStudies; 	// STUDIES  
		 
		//Direct loading 
		dSettings[userProfileUri + _SETTING_FILE] 	= $scope.loadSetting; 	//USER SETTINGS	 
 
		dSettings[projectUri + _SHARED_WDT_FILE]	= $scope.loadSharedWidget; 	//SHARED WIDGET  
		dSettings[projectUri + _SHARED_VIEW_FILE]	= $scope.loadSharedView; //SHARED View  
		 
		dSettings[userProfileUri + _WIDGET_FILE]	= $scope.loadWidget	;  	//USER WIDGET 
		dSettings[userProfileUri + _VIEW_FILE] 		= $scope.loadView; 		//USER VIEW 
		 
		 
		var nbRequest = Object.keys(dSettings).length; 
		$.each(dSettings, function(sUrl, funct) { 
			var bStop = false;
			
			var endRequestCallBack = function(bStopRun) {  
				if (bStopRun) { 
					bStop = true; 
					$scope.loggIn(errMess);  
					return false; //break;
				} 
				 
				nbRequest --;
				if (nbRequest<=0) { 
					$scope.ready(); 
				} 
			} 
			
			if (!bStop) {
				//Launch Request 
				request.url = sUrl;
				funct(request, endRequestCallBack); 
			}
		});  
	}//end initPage 
	 
 
	//-------------------------------------- 
	// Load all STUDIES Folders from AL 
	//-------------------------------------- 
	$scope.loadStudies = function(request, callBack) {   
		console.log("Load Studies ... " + request.url);  
		$http(request).success(function(data, status, headers, config) {   	 
			$scope._lStudies = data;  
			console.log("  -> Studies Loaded!  " + $scope._lStudies); 
			if (callBack) callBack(); 
		}) 
		.error(function (err, status, headers, config) { 
			var errMess = "Couldn't load Studies list <br>" + err.responseText;
			console.log(errMess); 
			if (callBack) callBack(errMess);  
		});  
	};//end loadStudies 
 
	// --------------------------------- 
	// Load user PROFILE.json 
	// --------------------------------- 
	$scope.loadProfile = function(request, callBack) { 
		//console.log("Load profile ... " + request.url); 
		 
		$http(request).success(function(data, status) {  
			console.log("-> data Profile : " + data.login + " vs " + $scope._login);  
			if (data.login !== $scope._login) { 
				data.login = $scope._login;  
				 
				//save new profile json 
				SaveToProfile(_PROFILE_FILE, data);  
				console.log("!! UPDATE profile : " + data.login);  
			}  
			$scope._profile = data; 
			 
			console.log("  -> Profile : " +JSON.stringify($scope._profile)); 
			if (callBack) callBack(); 
		}) 
		.error(function (err, status, headers, config) { 
			console.log("Couldn't load the user profile, from: " + request.url + "\n error # " + err);  
			$scope.loggIn( "<h3>Sorry, failed to load your profile !" 
					    +  "<br><br>Please try to re-log or contact your adminstrator</h3>" 
					    +  "<br>" + err.responseText
					    );
		});
		 
	}//End loadProfile 
 
	// --------------------------------- 
	// Load owner SETTINGS 
	// --------------------------------- 
	$scope.loadSetting = function(request, callBack) { 
		//console.log("Load setting ... " + request.url); 
 
		$http(request).success(function(dSetting, status) {  
 
			if (dSetting.login !== $scope._login) { 
				dSetting.login = $scope._login;  
				console.log("  !! UPDATE settings to: " + dSetting.login);  
				SaveToProfile(_SETTING_FILE, dSetting);   
			} 
     
			//Auto refresh 
			var refreshAuto = getStorage("ontimer"); 
			if (!refreshAuto) refreshAuto = dSetting["ontimer"]; 
			_B_REFRESH_AUTO = (refreshAuto === "on"); 
			 
			console.log("  -> Setting Loaded! ");	 
			 
			//Init settings 
			initSettings(dSetting); 
			 
			//--------- END  -------- 
			if (callBack) callBack(); 
		}) 
		.error(function (xhr, status, headers, config) {  
			var errMess = "Couldn't load Setting <br>" + xhr.responseText;
			console.log(errMess); 
			toastr.warning(errMess);
			if (callBack) callBack();  
		}); 
	} //END loasSetting 
	 
	// --------------------------------- 
	// Load personal VIEWS 
	// --------------------------------- 
	$scope.loadView = function(request, callBack) {  
		//console.log("Load Personal views ..." + request.url); 
 
		$http(request).success(function(data, status) {  
			$scope._personalViews = data; 
			 
			console.log("  -> Personal View Loaded!" ); 
			if (callBack) callBack(); 
		}) 
		.error(function (xhr, status, headers, config) { 
			var errMess = "Couldn't load Views <br>" + xhr.responseText;
			console.log(errMess); 
			toastr.warning(errMess);
			if (callBack) callBack(); 
		}); 
	};//END loadView 
		   
	// --------------------------------- 
	// Load shared WIDGETS 
	// ---------------------------------  
	$scope.loadSharedWidget = function(request, callBack) {  
		//console.log("Load Shared widgets ..." + request.url); 
		 
		$http(request).success(function(data, status) { 
			$scope._commonWidgets = data; 
			console.log("  -> Shared widgets Loaded!");  
			if (callBack) callBack(); 
		}) 
		.error(function (xhr, status, headers, config) {  
			var errMess = "Couldn't load Shared widgets <br>" + xhr.responseText;
			console.log(errMess); 
			toastr.warning(errMess);
			if (callBack) callBack(); 
		});  
	};//END loadSharedWidget 
  
	// --------------------------------- 
	// Load Personal Widgets 
	// --------------------------------- 
	$scope.loadWidget = function(request, callBack) {  
		//console.log("Load Personal widgets ..." + request.url); 
 
		$http(request).success(function(data, status) { 
			 
			$scope._personalWidgets = data; 
			$scope._personalWidgets.login = $scope._login;  
 
			console.log("  -> Personal widgets Loaded!");  
			if (callBack) callBack(); 
		}) 
		.error(function (xhr, status, headers, config) {  
			var errMess = "Couldn't load Personal widgets <br>" + xhr.responseText;
			console.log(errMess);  
			toastr.warning(errMess);
			if (callBack) callBack(); 
		}); 
	};//END refreshWidget 
	 
	// --------------------------------- 
	// Load Shared View 
	// --------------------------------- 
	$scope.loadSharedView = function(request, callBack) {  
		//console.log("Load shared view ..." + request.url); 
		 
		$http(request).success(function(data, status) {	  
			$scope._sharedViews = data; 
			console.log("  -> Shared view Loaded!"); 
			//--------- END -------- 
			if (callBack) callBack(); 
		}) 
		.error(function (xhr, status, headers, config) {  
			var errMess = "Couldn't load Shared view <br>" + xhr.responseText;
			console.log(errMess);  
			toastr.warning(errMess);
			if (callBack) callBack(); 
		}); 
 
	}; //End loadSharedView 
	 
	// --------------------------------- 
	// READY 
	// --------------------------------- 
	$scope.ready = function() {  
		//End wait 
		$('html').removeClass('wait');  
		$("body").css({opacity: 1}); 
	 
		//Load selected view 
		var viewId = _SETTINGS.SelectedView; 
		
		var oView = $scope.createView(viewId); 
		if (oView) { 
			loadSelectedView(oView, true); 
		} 
		else { 
			console.log("-> NO View to start! " +  viewId); 
 
			$("#column-1").html('<br/><br/>' 
				+ '<h2>HowTo :</h2>' 
				+ '<ul style="font-size:16px;line-height:30px;">' 
					+'<li>Create your own configuration (PERSONAL VIEW), using : <a href="javascript:viewCreateNew()"> ' 
						+'<i class="fa fa-file-text-o"></i> VIEW or PERSONAL&emsp;<i class="fa fa-plus-square-o newView"></i></a>'
					+ '</li>'  
					+'<li>Update your view by creating, updating, dropping widgets on it</li>' 
					+'<li>Remember to "Save" the view <i class="fa fa fa-floppy-o"></i> after each changes</li>' 
					+ '<li>You can copy an existing view by using VIEW -> Save As<br>&nbsp;</li>'
					+ '<li>Or share components (view or widget) with other people</li>' 
				+ '</ul>' 
				+ '<h2>Check Help Info ' 
				   + '<a href="javascript:openHelp()">' 
					+'<span class="glyphicon glyphicon-info-sign"></span>' 
				    +'</a> for more details</h2>' 
			); 
		}  
		 
		if (_B_REFRESH_AUTO) 
			setTimeout(function(){ $scope.refreshMenus(); }, (15 * 1000) );  
	}; //end ready 

	/** Get selected view */ 
	$scope.isNotOwner = function(viewOwner) { 
		$(".views").css("background", "none"); 
		if (isUserAdmin()) return false; 
		return (viewOwner.indexOf("_"+$scope._login+"_")<0); 
	}; 

	 
	$scope.getAvatar = function() { 
		var avatar = _ROOT + "img/default/avatar.jpg"; 
		 
		if ($scope._login && $scope._profile.avatar) { 
			var projectUri = _DATA_URI + $scope._project + "/"; 
			avatar 	= projectUri + $scope._login + "/" + $scope._profile.avatar;  
		}  
		return avatar; 
	}; 
  
	$scope.isNotMyWidget  = function(wdId) { 
		if (isUserAdmin()) return false; 
		return (wdId.indexOf("_" + $scope._login + "_")<0); 
	} 
	 
	$scope.addWidget = function(wdt) { 
		$scope._commonWidgets.widgets.push(wdt); 
		$scope.$apply(); 
	} 
	 
	/** Create a new view */ 
	$scope.createView = function(viewId) { 
		if (!viewId) return null; 

		var idx = -1;
		var dView = null; 
		var type = ""; 
		
		var tViews = $scope._personalViews.views; 
		if (tViews) { 
			for (var i=0; i<tViews.length; i++) { 
				if  (tViews[i].id == viewId) { 
					dView = tViews[i]; 
					idx = i;
					break; 
				} 
			} 
		} 
		 
		//Search in shared 
		
		if (!dView) {  
			$.each($scope._sharedViews.views, function(iz, ddv) { 
				if (ddv.id == viewId) { 
					dView = ddv; 
					idx = iz;
					return false; //break 
				} 
			}); 
			//SET VIEW TYPE TO SHARED 
			type = _SHARED_VIEW; 
		}  
	  
		if (!dView)  return null; 
		
		//--------------------------------------
		//	NEW VIEW
		//--------------------------------------
		var oView = new View(dView, type); 
		return oView;
		
	};
	
	/** Select a view */
	$scope.selectView = function(oView) {
		//Activate Menu Item by angular
		_oSelectedView = oView;
		$scope._oSelectedView = _oSelectedView; 
		
		if ( ! ($scope.$$phase) ) 
			$scope.$apply();
		
		//Securite
		var name ="", study ="";
		if (_oSelectedView) {
			name  = _oSelectedView.name();
			study = _oSelectedView.study();
		}
		
		$("#study").text(study);
		$("#viewLabel").text(name); 
		$("#footView").text(name);
	}
 
	/** Read and parse : BusinessMetadata.xml file */ 
	$scope.loadBusinessMetadata = function (callback) { 
		 
		if ($scope._businessMetadata!=null) { 
			if (callback) callback($scope._businessMetadata); 
			return; 
		}  
		//console.log(" -> load BusinessMetadata ..."); 
		 
		//Start 
		$scope._businessMetadata = {}; 
		 
		//Get AL URL 
		var url = location.protocol + "//" + location.host; 
		$.ajax({ 
			url			: url + "/content/files/Conf/BusinessMetadata.xml", 
			async		: false,  
			method      : "GET", 
			beforeSend	: function( xhr ) { 
				xhr.setRequestHeader("Authorization", "Basic " + $scope._logStr);  
				xhr.setRequestHeader("WWW-authenticate", "database");  
			} 
			, dataType : "xml" 
		}) 
		.done(function( xmldata ) {   
			/** Construct :  { "namespace" : [ {"name":name, "value":[Value]}, {}, ... ], [], ...} */ 
			var jDictionary = {}; 
			 
	 		var $properties = $(xmldata).find("Properties"); 
	 		$properties.find("Property").each(function() { 
		    	var nameSpace = $(this).attr("namespace");  
		    	var name 	  = $(this).attr("name"); 
		    	 
			    var tabNamespace = jDictionary[nameSpace]; 
			    if (!tabNamespace) {  
			    	tabNamespace = new Array(); 
		    		jDictionary[nameSpace] = tabNamespace; 
		    	} 
		    	  
		    	var tabVal = []; 
		    	$(this).find("Value").each(function() { 
		    		tabVal.push($(this).text()); 
		    	}); 
	  
		    	var jName = { "name" : name , "value": tabVal };  
		    	tabNamespace.push(jName); 			 
	 		}); 
			 
	 		$scope._businessMetadata  = jDictionary;  
	 		console.log("  -> BusinessMetadata Loaded!");  
	 		 
			if (callback) callback($scope._businessMetadata);  
			 
		}).fail(function (err) { 
			console.log("!! ERROR: failed to load BusinessMetadata : " + err); 
			if (callback) callback(); 
		}); 
 
	};//End loadBusinessMetadata 
	  
	/** 
	 * Get personal widget from its id 
	 */ 
	$scope.getPersonalWidget = function(wdgtId) { 
 		//Append to all widgets 
		var wdg  = null; 
		$.each($scope._personalWidgets.widgets, function(id, oWdt) {  
			if (oWdt.id == wdgtId) { 
				wdg = oWdt; 
				return false; //break 
			}  
		}); 
		return wdg; 
	} 
	 
	$scope.getCommonWidget = function(wdgtId) { 
 		//Append to all widgets 
		var wdg  = null; 
		$.each($scope._commonWidgets.widgets, function(id, oWdt) {  
			if (oWdt.id == wdgtId) { 
				wdg = oWdt; 
				return false; //break 
			}  
		});

		return wdg; 
	} 
	
	$scope.iconOf = function(type) {
		var icodefault = "fa fa-list-alt";
		 
		if (type == "bar") return "fa fa-bar-chart";
		if (type == "line") return "fa fa-line-chart";
		
		if (type == "grid") return "fa fa-th";
		if (type == "list") return "fa fa-list";
		if (type == "link") return "fa fa-file-text-o";
	}
	 
	/** Refresh left Menu : for push **/ 
	$scope.refreshMenus  = function() {	  
		 
		var request = { method	: "GET" 
						, url		: "" 
						, dataType	: "json"   
						, data		: {}  
						, xhrFields	: { withCredentials: true } 
						, headers 	: $scope.xhrHeader() 
						};  
 
		var projectUri		= _DATA_URI + $scope._project + "/"; 
		var userProfileUri 	= projectUri + $scope._login + "/";  
		 
		//- All http url loader  
		var dSettings = {};   
		dSettings[projectUri + _SHARED_WDT_FILE]	= $scope.loadSharedWidget; 	//SHARED WIDGET  
		dSettings[projectUri + _SHARED_VIEW_FILE]	= $scope.loadSharedView;	//SHARED View  
		dSettings[userProfileUri + _WIDGET_FILE]	= $scope.loadWidget	;  		//USER WIDGET 
		dSettings[userProfileUri + _VIEW_FILE] 		= $scope.loadView; 			//USER VIEW 
		var n = 4; 
		$.each(dSettings, function(sUrl, funct) {  
			request.url = sUrl; 
			funct(request, function() { 
				try { 
					if (!$scope.$$phase) 
						$scope.$apply(); 
				} catch(err) {} 
				n--; 
				if (n==0 && _B_REFRESH_AUTO) { 
					setTimeout(function(){ $scope.refreshMenus(); }, (15 * 1000) );  
				} 
			}); 
		}); 
	}//end load Menu 
  
}); ///=============================End Angular Module================================ 
 
