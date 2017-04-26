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
	$scope._exportDir 	= "Exported/"; 

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
		$scope._exportDir += $scope._login + "/"; 
			
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
				initGraph($scope._activePath, jdata, bOnlyUpdate, function(entry) {
					
					$scope._oDataActive = entry;
					
					//Read all meta-data by version once and keep it for all
					if ($scope._oDataActive && $scope._oDataActive.isEntry()) {
		
						var dMetadataByVersion = $scope._oDataActive.get("metaByVersion");
		
						//Get all version for this data
						var tabVersions = $scope._oDataActive._allVersions;
		
						//Get current version
						var currentVersion = $scope._oDataActive._version;
						
						$scope._hActiveData["Version"] = tabVersions; 
						$.each(tabVersions, function(idx, v) {
							var dMeta;
							var ver = (""+v);
							if ( ver === currentVersion) {
								dMeta = $scope._oDataActive._metadata; 
								//tabVersions[idx] = ver + "    *";
								tabVersions[idx] = "* " + ver;
							}
							else {
								dMeta = dMetadataByVersion[ver];
							} 
		
							$.each(_TABKEY, function(label, name) { 
								var val = (dMeta ? dMeta[name] :  "");
								
								//var sep = "    (v"+ver+")";
								var sep = "v"+ver+": ";
								if (ver === $scope._oDataActive._version) {
									//sep = "    *"; 
									sep = "* ";
								} 
								val = sep + val;
								if (! (label in $scope._hActiveData) ) { 
									$scope._hActiveData[label] = [val];
								}
								else {
									$scope._hActiveData[label].push(val);
								}
							}); 
						}); 
						 
					}
				}); //end initGraph 
			}//if has data
			
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
		
		callback(true);
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
		GraphService.getEntry(path, lnkname, function(data) {
			callback(data[0]);
		});
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
			slide(false);
		});
	};

	/**---------------------------------
	 * Get list of exported files 
	 *--------------------------------- */
	var listExportedFile = function(callback) { 
		console.log("listExportedFile ...");
		
		GraphService.getListFiles($scope._exportDir, function(tExpFiles) {
				
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
		$scope._exported[skey] = $scope._exportDir + fname;		
	}

	/** Check if has exported */
	$scope.hasExported = function() {
		return (Object.keys($scope._exported).length>0);
	}
	
	/**
	 * Save exported file to json
	 * @param fileName
	 * @param jsData
	 * @param fdelegate
	 */
	$scope.saveExportedFile = function(fileName, jsData, fdelegate) {
		var filePath = $scope._exportDir + fileName;
		GraphService.saveFile(filePath, function(success, err) {
			if (success) { 
				bootbox.alert("Datas was Exported successfully !", function() {
					if (fdelegate) {
						fdelegate(filePath); 
					}
				} );
			}
			else {
				var errorMessage = showlog(err); 
				bootbox.alert("Failed to save file <br> " + fileName + "<br><br>" + errorMessage);;
				if (fdelegate) {
					fdelegate("");  
				}
			}
		});
	}

	/// BINDING /////////////////////////////////////////////////////////

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
		if ( $scope.isMultipleData() || !$scope._oDataActive) {
			return "";
		}
		if ( (""+val).indexOf("*")>=0) {
			return "selected";
		}
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
			if ($scope._oDataActive) {
				return $scope._oDataActive._label;
			}
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
	
	///
	/// EVENTS //////////////////////////////////////////////
	///
	
	/** Active data change */
	$scope.activeDataChange  = function(e) {
		slide(true);
		
		//Read checked version
		var version = $("#a_Version :selected").text(); 
		version = version.replace('*', '');

		//Reload with new parameter  
		var path = getPath($scope._activePath) + "?ver=" + version.trim(); 

		//Reload
		$scope.changeActiveData(path, true);

		$("#actdata").removeClass("ic-enabled");
		$("#actdata").addClass("ic-disabled");
	}
	
	/** Open/load the exported file */
	$scope.openExported = function(e, href) {
		e.preventDefault(); 
		e.stopPropagation();
		//---
		// This is Used instead of href, 
		// because : allow to stop propagation when click on delete icon
		//---
		window.open(href);
	};
	
	$scope.getExported = function(e, href) {
		var filename = href.substring(href.lastIndexOf("/") + 1);

		GraphService.download(href, function(data) {
			var url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}));
			var a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.target = '_blank';
			a.click();
		});
	}
	
	/** Remove exported file */
	$scope.delExported  = function(e, href) { 
		e.preventDefault(); 
		e.stopPropagation(); 
		
		var filename = href.substring(href.lastIndexOf("/") + 1);
		filename = filename.substring(0, filename.indexOf(".json"));

		bootbox.confirm({ size:"medium"
			, title   : "Remove following file from the server : <br/><b>" + filename + "</b>"
			, message : "Are you sure ?"
			, callback: function(bOk) {
					if (bOk) { 
						GraphService.removeExportedFile(href, function(success) {
							if (success) {
								e.currentTarget.closest("li").remove();
							}
							else {
								console.log("Failed to remove exported file !");
							}
 						}); 
					}
			}//end callback
		});
	};
	
	/** Reorder graph children */
	$scope.reorderChild = function(e) {	
		restorePosition(true);
		_SVG.redrawLines();
	}

	/** Reorder graph parents */
	$scope.reorderParent = function(e) {	
		restorePosition(false);
		_SVG.redrawLines();
	}

	/** Reorder graph entries */
	$scope.reorderAll = function(e) {
		initialPosition($scope._oDataActive);
		
		//Restore parent
		restorePosition(false);
		
		//Restore child
		restorePosition(true);
		
		//Redraw
		_SVG.redrawLines();
	}	

	/** Move graph up/down  */
	$scope.moveAll = function(bUp) {
		moveAll(bUp);
	}
	
	$scope.decaler = function(toLeft) {
		decaler(toLeft);
	}

}]); //--============================= END graph controller --=============================//
