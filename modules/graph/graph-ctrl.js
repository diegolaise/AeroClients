/** ====================================================================
 *  
 * Graph  Main functions 
 * 
 * ====================================================================*/
'use strict';

/** ==================================================================== 
 * 
 * Angular AeroGraph 
 * call url : [url]/index.html#?login=XXX  => $location.search().login; 
 * 
 * ====================================================================*/
angular.module('Graph')
.controller('GraphController', ['$scope', '$location', '$http', '$routeParams', '$rootScope', '$cookieStore', 'GraphService',
	function ($scope, $location, $http, $routeParams, $rootScope, $cookieStore, GraphService) {

	$scope._revision 	= _REVISION;
	$scope._brandIcon   = "/assets/images/brand-icon.gif";

	//Exported files path
	$scope._tmp 		= "Exported/";
	$scope._ALUrl = location.protocol + "//" + location.host;

	//User parameters
	$scope._login = "";

	//Active data infos
	$scope._activePath = "";
	$scope._oDataActive = null;

	//Exported data
	$scope._exported  = {};  

	//Filters
	$scope._hVersion    = {};
	$scope._hExtension  = {};
	$scope._hActiveData = {};

	//-----------------------------
	$graphScope = $scope; //Init scope
	//----------------------------- 

	/** INITIALIZE */
	$scope.initilizeGraph = function() {  
		console.log("==> Starting Graph .... " );

		// keep user logged in after page refresh
		$rootScope.globals = $cookieStore.get('globals') || {};	
		$rootScope.$on('$locationChangeStart', function (event, next, current) {
			// Redirect to login page if not logged in
			if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
				$location.path('/login');
			}
		});
		
		//addSpin(); 
		spin();

		$scope._login 	    = $rootScope.globals.currentUser.username; 
		$scope._activePath  = $routeParams.activePath || $rootScope.globals.currentUser.active_path;

		//Initialize xhr log string  
		$scope._tmp += $scope._login + "/"; 
			
		//---------------------------------
		// Get list of exported files 
		//--------------------------------- 
		listExportedFile();

		//---------------------------------
		// Load active data
		//---------------------------------
		loadActiveData(false, hideSpin);
	};

	/** Load active data */
	var loadActiveData = function(bOnlyUpdate, callback) {
		
		if ( ! $scope._activePath ) {
			//TODO : propose to select a file
			//Show tree view here
			
			if (callback) {
				callback(false);
			}
			return;
		}
		
		// Store active data
		$scope.store();

		//Load many active data
		var tabDatas = $scope._activePath.split(","); 
		if (tabDatas.length>1) { 
			loadDatas(tabDatas, bOnlyUpdate, callback); 
			return;
		}; 

		//Clear metadatas
		$scope._hActiveData = {};
		
		//Read data info
		GraphService.getDataInfo($scope._activePath, 1,  function(jdata) { 	
			
			//console.log("Datas found: " +  JSON.stringify(jdata, null, 4) + " " + Object.keys(jdata));
			console.log("loadActiveData end ...");
			
			//Initialize sidebar
			if (jdata && Object.keys(jdata).length>0) {
				
				//Init graph and active data object
				$scope._oDataActive = initGraph($scope._activePath, jdata, bOnlyUpdate);
	
				//Read all meta-data by version once and keep it for all
				if ($scope._oDataActive && $scope._oDataActive.isEntry()) {
	
					var dMetadataByVersion = $scope._oDataActive.get("metaByVersion");
	
					//Get all version for this data
					var tabVersions = $scope._oDataActive._allVersions;
	
					$scope._hActiveData["Version"] = tabVersions; 
					$.each(tabVersions, function(idx, ver) {
						var dMeta = dMetadataByVersion[ver];
						if (dMeta) {
							if (ver === $scope._oDataActive._version) {
								tabVersions[idx] += " *";
							}
		
							$.each(_TABKEY, function(label, name) { 
								var val = dMeta[name];
								if (!val) {val = "";}
		
								if (ver === $scope._oDataActive._version) {
									val += " *";}
								else {
									val += " (v"+ver+")";
								}
								if (! (label in $scope._hActiveData) ) { 
									$scope._hActiveData[label] = [val];
								}
								else {
									$scope._hActiveData[label].push(val);
								}
							});
						}
					}); 
				}
			}
			//Call back
			if (callback) {
				callback(true);
			}
		}
		, function(err, status, headers, config) {
			bootbox.alert("Read active data Error <br>" + showlog(err));
			//Call back
			if (callback) {
				callback(false);
			}
		});
		
	};

	/** Load many active datas */
	var loadDatas = function(tabDatas, bOnlyUpdate, callback) { 

		var N = tabDatas.length; 
		
		bootbox.alert("TO DO");

//		//Path to handle
//		var showPath = (N==1 ? $scope._activePath : ""); 
//
//		var tDataRes = [];
//		var endLoading = function(jdata) {
//			if (jdata) {
//				tDataRes.push(jdata);
//			}
//
//			if (--N>0)  {
//				return;
//			}
//
//			//Init Graph
//			$scope._oDataActive = initGraph(showPath, tDataRes, bOnlyUpdate);
//
//			//console.log("Entry get: " + path);
//			if (callback) {
//				callback(tDataRes.length>0);
//			}
//		}
//
//		var sUrl = $scope.httpUrl() + "getEntry.jsp?children=both"+$scope.params("&")+"&path=";
//		for (var i=0; i<tabDatas.length; i++) {
//			//console.log( i + " : " + tabDatas[i]);
//			$http({ method	: "GET" 
//							, url		: sUrl + tabDatas[i]
//							, headers 	: $scope.xhrHeader() 
//							, dataType	: "json"
//							, async		: true //must true for parallels
//							//, data		: angular.toJson(tabDatas,4)
//
//			}).success(function(jdata) {  
//				endLoading(jdata);
//
//			}).error(function (err, status, headers, config) { 
//				console.log("Read active data ! "+ err); //JSON.stringify(err.responseText)); 
//				endLoading(null);
//			});  
//		}
	}
	
	/**
	 * Load entry for draw.js
	 */
	$scope.expandEntry = function(path, lnkname, callback) {
		GraphService.getEntry(path, lnkname, callback);
	}

	/** Change the active data */
	$scope.changeActiveData = function(path, bOnlyUpdate) {
		spin();

		//Change the active path
		$scope._activePath = path;

		//Reset menus
		$scope._hVersion   = {};
		$scope._hExtension = {}; 
		$scope._oDataActive = null;

		loadActiveData(bOnlyUpdate, function(bOk) {
			if (bOk) {
				$scope.store();//not working, because no cache
			}

			//Force to refresh views;
			if ( ! $scope.$$phase ) {
				$scope.$apply();
			}
			hideSpin();
			_SLIDE = false;
		});
	};

	/** Show log */
	var showlog = function(err) {
		var sErr = (""+err);
		if (typeof err === 'object') {
			sErr = err.responseText;
			if (!sErr) sErr = err.data.responseText;
			if (sErr) {
				var i = sErr.indexOf("<body");
				if (i>0) {
					j = sErr.indexOf("/body>");
					sErr = sErr.substring(i+6, j-1);
				} 
			}
			else {
				sErr = JSON.stringify(err, null, 4);
			}
		}
		console.log("ERROR: \n" + sErr.replace(/<\//g, "\n</") );
		return sErr;
	}

	/**---------------------------------
	 * Get list of exported files 
	 *--------------------------------- */
	var listExportedFile = function(callback) { 
		console.log("listExportedFile ...");
		
		GraphService.getListFiles($scope._tmp, function(tExpFiles) {
				
			for (var i=0; i<tExpFiles.length; i++) {
				var fileName = tExpFiles[i];
				fileName = fileName.replace(/[\n\t\r]/g,"").trim();
				$scope.addExported(fileName);
			}

			if (tExpFiles.length==0) { 
				if ( $("#exportedFiles").next().is(':visible') ) {
					$("#exportedFiles").trigger("click");
				}
			}
			else  if ( !$("#exportedFiles").next().is(':visible') ) {
				$("#exportedFiles").trigger("click");
			}

			if (callback) {
				callback(reponse);
			}
		}), function(err) {
			showlog(err);
			if (callback) {
				callback();
			}
		}
	};

	/** Add exported file */
	$scope.addExported = function(fname) {
		var skey = fname;
		var i = fname.lastIndexOf(".");
		if (i>0) {
			//Remove extension
			skey = fname.substring(0,i); 	
		}

		//Cut
		if (skey.length > 16) {
			skey = skey.substring(0, 8) + " ... " + skey.substring(skey.length - 9);
		}	
		$scope._exported[skey] = $scope._tmp + fname;		
	}

	$scope.hasExported = function() {
		return (Object.keys($scope._exported).length>0);
	}

	/** Check if exists exported file */
	$scope.exists = function(fname) {
		var b = false;
		$.each( $scope._exported, function(key,path) {
			if (path.indexOf("/"+fname)>0) {
				b = true;
				return false;
			}
		});
		return b;
	}

	/** Get Update list extensions and version */
	$scope.updateList = function(oEntry) {	
		if (!oEntry) return;

		//Extension
		var name = oEntry._label;
		if (!name) return;
		
		var i = name.lastIndexOf(".");
		if (i>0) {
			var ext = name.substring(i+1);  
			if (ext in $scope._hExtension)
				$scope._hExtension[ext] += 1;
			else
				$scope._hExtension[ext] = 1;
		}

		//Version
		var version = oEntry._version 
		if (version) { 
			version = "v"+ version; 
			if (version in $scope._hVersion){
				$scope._hVersion[version] += 1;
			}
			else {
				$scope._hVersion[version] = 1;
			}
		}
	};

	$scope.isMultipleData = function() {
		return ($scope._activePath.split(",").length > 1);
	}

	$scope.isEmpty = function(dic) {
		return (Object.keys(dic).length==0);
	};

	$scope.metaName = function(label) {
		var name = label;
		if (label in _TABKEY) 
			name = _TABKEY[label];
		return name;
	};

	$scope.isSelected = function(label, val) {
		if ( $scope.isMultipleData() || !$scope._oDataActive) return "";
		var name = $scope.metaName(label);

		var value = $scope._oDataActive.metadata(name) + " *"; 
		if (val == value) return "selected";
		return "";
	};

	$scope.getSelected = function(label, val) {
		if ( $scope.isSelected(label, val) == "selected") {
			return "active";
		}
		return "";
	}

	$scope.checkClass = function(label, val) {
		if ( $scope.isMultipleData() || !$scope._oDataActive) {
			return "fa fa-circle-o";
		}
		var name = $scope.metaName(label)
		if (val == $scope._oDataActive.metadata(name)){
			return "fa fa-check-circle-o text-primary";
		}
		return "fa fa-circle-o";
	};

	$scope.activeTag = function(label, val) {
		if ( $scope.isMultipleData() || !$scope._oDataActive) {
			return "";
		}
		var name = $scope.metaName(label)
		if (val == $scope._oDataActive.metadata(name)) {
			return "*";
		}
		return "";
	};

	$scope.getClass = function(label) { 
		if (label == "Version" ) {
			return "fa-code-fork";
		}
		if (label == "Process" ) {
			return "fa-cogs";
		}
		if (label.indexOf("Study")>=0 ) {
			return "fa-graduation-cap";
		}
		if (label == "Tool" ) {
			return "fa-wrench";
		}

		return "fa-gavel";
	}

	$scope.idOf  = function(metaLbl) {
		return toId(metaLbl);
	};

	$scope.store = function(param) {
		$rootScope.globals = $cookieStore.get('globals') || {};
		$rootScope.globals.currentUser.active_path = $scope._activePath;
	}

	/** Get short path */
	$scope.shortPath = function() { 

		if ($scope._activePath.indexOf(",")>0) {
			if ($scope._oDataActive)
				return $scope._oDataActive._label;
			return "";
		}

		var wdt = $(window).width();
		wdt -= 675;

		var lg = 7 * $scope._activePath.length;
		if (lg>wdt) {
			var path = $scope._activePath;
			var vers = "";
			var i = $scope._activePath.indexOf("/?"); 
			if (i>0) {
				vers = $scope._activePath.substring(i);
				path = $scope._activePath.substring(0, i); 
			}

			var tab = path.split("/"); 
			var n = tab.length - 1;

			if (i>0)
				vers = "/" + tab[n] + vers;
			else
				vers += "/" + tab[n];

			path = "/" + tab[1] + "/" + tab[2] + "/ ... ";
			for (var i=(n-3); i<n; i++){
				var p = tab[i];
				if (p.length>10) p = p.substring(0,11) + " ... ";
				path += "/" + p;
			}

			path += vers;
			return path;
		}

		return $scope._activePath;
	};
	
	/// EVENTS //////////////////////////////////////////////
	
	$scope.getExported = function($event, href) {
		$event.stopPropagation();
		//---
		// This is Used instead of href, 
		// because : allow to stop propagation when click on delete icon
		//---
		window.open(href);
	};
	 
	$scope.delExported  = function(e, href) { 
		e.preventDefault(); 
		e.stopPropagation(); 
		
		var filename = href.substring(href.lastIndexOf("/") + 1);
		filename = filename.substring(0, filename.indexOf(".json"));

		bootbox.confirm({ size:"medium"
			, title: "Remove file '<br/><b>" + filename + "</b><br/>' from the server"
			, message: "Are you sure ?"
				, callback: function(bOk) {
					if (bOk) { 
						GraphService.removeExportedFile(href, function(success) {
							if (success) {
								$this.closest("li").remove();
							}
							else {
								console.log("Failed to remove exported file !");
							}
 						}); 
					}
				} 
		});
	};

}]); //----- END graph controller -------
