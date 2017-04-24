//======================================================
//
//  Viewer Utilities
//   
//   Version 2.1
//
//======================================================

var _ROOT  = "./"; 
var _INDEX = "./index.html";
 
//--------------------------
// Servers URL
//--------------------------
var _SERV_PATH = _ROOT + "src/";	//SERVERS (JSP) PATH

//Dynamic Url
var PATH_URL  	= function() {return (_SERV_PATH + "path.jsp");} 
var PROFILE_URL = function() {return (_SERV_PATH + "profile.jsp");} 
var SEARCH_URL 	= function() {return (_SERV_PATH + "search.jsp"); }

//--------------------------
//	Default data filenames
//--------------------------
var _SHARED_VIEW_FILE 	= "shared-view.json"; 	// DEFAULT VIEW
var _VIEW_FILE 			= "view.json";     		// USER VIEW

var _WIDGET_FILE 		= 'widget.json'    		// USER WIDGET
var _SHARED_WDT_FILE 	= "shared-widget.json";	//	DEFAULT WIDGET

var _SETTING_FILE 		= 'setting.json';   	// SETTINGS
var _PROFILE_FILE 		= 'profile.json';		// PROFILE

var _IMG_PATH			= ["/img/dfem/", "/img/default/"];

var _DATA_URI			= "/datas/"; 			//datas uri after ROOT context
var _PROFILE_ROOT_URI	= "/"; 					//Uri after project : ROOT/[_DATA_URI]/[project]

var _VIEW_TYPE  = ["grid", "list", "link"];
var _CHART_TYPE = ["bar", "line"]; //, "area", "pie"];

// --------------------------
// CONSTANTS
// --------------------------
var _AL_LOGIN 	= "login";
var _AL_PASS 	= "password";
var _HOME_PAGE	= "homepage";
var _PARAMS		= "params";
 
var _EMPTY_WDT_ID 	= "wdt"; 		//The initial widget ID  

var _SHARED_VIEW	= "shared"; 

var _COMMON_WDT		= "common"; 
var _PERSONAL_WDT 	= "personal";
var _DEFAULT_WDT 	= "default"; 

var IDX_CSS 	= 4;    // Index of css link declaration
var C_MAX_CAR 	= 80; 	// Default Max number of character by line

var _NO_DATA_MESS = "<span class='centered' title='No data found'>[No data]</span>"; // fa fa-ban

//======================================================
//	Global variables
//====================================================== 
var _B_REFRESH_AUTO = false; 
var _oAppScope	   	= null; // Angular object 

//Current selected object view
var _oSelectedView = null;

//=======================SETTINGS ================= 
//-- Default settings
var _SETTINGS = {
		"login" : "" 
		, "RefreshInterval" : "10"
		, "HyperviewPath" 	: ""
		, "SelectedView"  	: ""		
		, "skin"		 : "s-skin-1"
		, "ontimer" 	 : "on"
		, "collapse_menu": "off"
		, "fixedsidebar" : "on"
		, "fixednavbar"  : "off"
		, "fixedfooter"  : "off"
};

//-- Toastr settings
toastr.options = {
		  "closeButton"	: true,
		  "debug"		: false,
		  "newestOnTop"	: false,
		  "progressBar"	: true,
		  "positionClass": "toast-top-right",
		  "preventDuplicates": true,
		  "onclick"		: null,
		  "showDuration": "300",
		  "hideDuration": "1000",
		  "timeOut": "3000",
		  "extendedTimeOut": "1000",
		  "showEasing": "swing",
		  "hideEasing": "linear",
		  "showMethod": "fadeIn",
		  "hideMethod": "fadeOut"
};

var _fixedOption = {
	  "closeButton"	: true, 
	  "newestOnTop"	: false,  
	  "positionClass": "toast-top-center",
	  "preventDuplicates": true,
	  "onclick"		: null,  
	  "timeOut": "0",
	  "extendedTimeOut": "0"
}; 

var XXX = "";
function mouseUp(e) {
	if (!XXX) return;
	var caller = e.target || e.srcElement; 
	setTimeout( function() {
		var yyy = $(caller).closest(".sortable-item").prev().attr("id");
		if ( yyy != XXX && _oSelectedView) _oSelectedView.posChange();
		XXX = "";
	}, 600);
}

function mouseDown(e) { 
	var caller = e.target || e.srcElement;
	if ( $(caller).get(0).tagName == "DIV") {
		XXX = $(caller).closest(".sortable-item").prev().attr("id");
	}
}

//==================================================================
//			FUNCTIONS
//==================================================================

/**
 * Escape rexExp
 * @param string
 * @returns
 */
function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

/**
 * Clean text from special car
 * @param sTxt
 * @returns
 */
function cleanText(sTxt) {
	if (sTxt==null) return "";
	return sTxt.replace(/[\n\t\r]/g,"").trim();
}

/**
 * Show short text < 25 char
 * @param sTxt
 * @returns
 */
function shortText(sTxt) {	
	if (sTxt.length>25) 
		return sTxt.substring(0, 20) + " ...";

	return sTxt;
}

/** Check if object is an Array */
function isArray(obj) {
	return (obj && obj.constructor.toString().indexOf("Array")>0);
}

/** Check if object is an Array */
function isStr(obj) {
	return (typeof obj === "string");
}

/** Check if object is an Dictionary */
function isObject(obj) {
	return (obj && obj.constructor === Object);
}

/** Check if an object has value */
function hasValue(obj) {
	if (!obj) return false;
	if (isStr(obj))
		return (obj.trim()!="");
	
	if (isArray(obj)) {
		if (obj.length === 0)
			return false;
		
		for (var i=0; i<obj.length; i++) {
			if ( hasValue(obj[i]) )
				return true;
		}
	}	
	else if (obj.constructor === Object) {
		var bHasVal = false;
		$.each(obj, function(key, val) {
			if (hasValue(val)) {
				bHasVal = true;
			    return false;
			}
		});
		return bHasVal;
	}
	return (typeof obj !== undefined);
}

/** Check if 2 objects are same */
function isSame(obj1, obj2) {
	
	//Check if not null or empty value
	if ( !hasValue(obj1) && !hasValue(obj2))
		return true;
	
	if (isStr(obj1)) {
		return (obj1 === cleanText(""+obj2));
	}
	
	var bIsEq = true;
	if (isArray(obj1)) {

		if (!isArray(obj2))
			return false;
		
		if ( $(obj1).length !== $(obj2).length )
			return false;

		//Compare array
		if (   $(obj1).not(obj2).length === 0
			&& $(obj2).not(obj1).length === 0 ){
			return true;
		}
		
		if ( !hasValue(obj1) ) {
			return !hasValue(obj2);
		}
		else if ( !hasValue(obj2) ) //obj1 has value
			return false;
			 
		for (var i=0; i<obj1.length; i++) {
    		var elt   = obj1[i];
    		var other = obj2[i];
    		if (! isSame(elt, other) )
    			return false;
	    }			
	}
	else if ( !isObject(obj2) )
		bIsEq = false;
			
	else {
		$.each(obj1, function(key, val) {			
			bIsEq = isSame(val, obj2[key]);
			if (!bIsEq) {
				return false;
			}
		});
	}
	return  bIsEq;
}

/**Format parameters to string value before submitting*/
function stringValues(params) {
	if (!params) return "";

	if (isStr(params))
		return cleanText(params);
	
	var sValueFormatted = "";
	if (isArray(params)) {
		var sep = "";
		for (var i=0; i<params.length; i++) {
			sValueFormatted += sep + stringValues(params[i]);
			sep = ",";
		}
	}
	else if (Object.keys(params).length >= 0) {
		sValueFormatted = JSON.stringify(params);
	}
	return sValueFormatted;
}

/**
 * Full height of sidebar
 */
function full_height() {
	if (screenfull.isFullscreen) {
		$('#page-wrapper').css("min-height",  "100%");
	}
	else { 
		var navbarHeigh  = $('nav.navbar-default').height();
		var wrapperHeigh = $('#page-wrapper').height();
	
		if (navbarHeigh > wrapperHeigh) {
			$('#page-wrapper').css("min-height", navbarHeigh + "px");
			//console.log("navbarHeigh: " + navbarHeigh);
		} 
		else if (navbarHeigh < wrapperHeigh) {
			$('#page-wrapper').css("min-height", $(window).height() + "px"); 
		}
	}
}
 
// --------------------------
// SETTINGS
// -------------------------- 
/**
 * Initialize settings
 * @param dSettings
 */
function initSettings(dSettings) {  	
	if (dSettings) _SETTINGS = dSettings;
	
	//Read item from setting
	var getItem = function(skey) {
		var lVal 	= getStorage(skey);
		if (lVal) return lVal;
		
		var val 	= dSettings[skey];
		if (!val) return "";
		return val;	
	}
	 
	var collapse 		= getItem("collapsemenu");
	var fixedsidebar 	= getItem("fixedsidebar");
	var fixednavbar 	= getItem("fixednavbar");
	var fixedfooter 	= getItem("fixedfooter");
	var ontimer 		= getItem("ontimer");

	var body = $('body');

	if (fixedsidebar == 'on') { //Always add scrolled sidebar
		body.addClass('fixed-sidebar');
		$('.sidebar-collapse').slimScroll({
			height : '100%',
			railOpacity : 0.9
		});
		$('#fixedsidebar').prop('checked', 'checked');
	}

	if (collapse == 'on') { 
		if (!body.hasClass('body-small')) {
			body.addClass('mini-navbar');
		} 
		$('#collapsemenu').prop('checked', 'checked');	
	}
	else {
		sideSlimScroll();
	}

	if (fixednavbar == 'on') {
		$(".navbar-static-top").removeClass('navbar-static-top').addClass('navbar-fixed-top');
		body.addClass('fixed-nav');
		$('#fixednavbar').prop('checked', 'checked');
	}

	if (fixedfooter == 'on') {
		$(".footer").addClass('fixed');
		$('#fixedfooter').prop('checked', 'checked');
	}

	//Check/unchek timer
	if (ontimer == 'on') {
		$('#ontimer').prop('checked', 'checked');
		$(".fa.fa-cogs").addClass("fa-spin");
	}
	
	//Timer seconds
	var msec = getItem("RefreshInterval");
	$('#timertime').val(msec);
	 
	var theme = getItem("skin");
	if (theme) {
		applySkin(theme);
	}
	 
	//Close spin settings 
	setTimeout( function() {
		if ($(".theme-config-box"))
			$(".theme-config-box").toggleClass("show"); 
	}, 1000); 
}

/**
 * Update settings json 
 * @param skey
 * @param val
 * @param bDontSave : if true not save
 */
function updateSettings(skey, val, bDontSave) {
	_SETTINGS[skey] = val;
	setStorage(skey, val);
	//By default save
	if (!bDontSave) {
		SaveToProfile("setting.json", _SETTINGS);
	}
}

/**
 * Save data JSON From datas/[project]/[login]/jsonfile.json
 */
function SaveToProfile(jsName, jsData, fdelegate) { 
	var fileUri = _oAppScope._login + "/" + jsName;
	SaveFile(fileUri, jsData, fdelegate);
}

/**
 * Save Json file without the data path (WARNING)
 * @param fileUri : give the file Uri after  project [/datas/project/]XXXXX
 * @param jsData
 * @param fdelegate
 */
function SaveFile(fileUri, jsData, fdelegate) {
	if (!jsData || !jsData) return;
	
	console.log("  SaveFile to: " + fileUri);
	 
	var label = ""; 
	if (fileUri.indexOf("view")>0)
		label = "View"; //"View";
	else if (fileUri.indexOf("setting")>0)
		label = "Setting"; //"Setting";
	else if (fileUri.indexOf("profile")>0)
		label = "Profile"; 
	else if (fileUri.indexOf("default-")>0)
		label = "Default widget";
	else if (fileUri.indexOf("widget")>0)
		label = "Personal widget";
	
	var bToast = (label == "Setting" || label == "View");
	
	delete jsData["$$hashKey"]; 
	
	$.ajax({  	type 		: "POST" 
				, dataType 	: 'text'
				, async 	: false
				, url   	: PROFILE_URL() + "?action=save&path="+fileUri + _oAppScope.params("&")
				, beforeSend	: function( xhr ) {
					xhr.setRequestHeader("Authorization", "Basic " + _oAppScope._logStr); 
					xhr.setRequestHeader("WWW-authenticate", "database"); 
				}
				, data: { "data" : angular.toJson(jsData, 4) } 
	
		, success: function(res) {
			console.log( " -> "+ label + " was saved successfully !"); 
			 
			if (fdelegate) { 
				if (bToast) {
					toastr.remove();
					//toastr.success(label + " saved successfully !");
				}
				fdelegate(true);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("ERROR ! Failed to save " + fileUri + " : "+ jqXHR.responseText + "<br>");

			if (fdelegate) {// //+ JSON.stringify(jqXHR.responseText)
				toastr.error("Failed to save " + label + " !<br><br>" +jqXHR.errorMessage, "Save data Error" );
				fdelegate(false); 
			}
		}
	});	
}

/**
 * Load all sub-folders of a study (rootFolder)
 * @param rootFolder
 * @param callBack
 */
function FoldersContent(path, callBack) { 
	
	$.ajax({ type		: "GET"
		, url			: PATH_URL() + "?action=listFiles&path="+path + _oAppScope.params("&")
		, beforeSend	: function(xhr) {
			xhr.setRequestHeader("Authorization", "Basic " + _oAppScope._logStr); 
			xhr.setRequestHeader("WWW-authenticate", "database");
		},   
		async		: false,
		dataType	: "json",
	
		success		: function (jtab) {  
			console.log("Folders:  " + jtab);
			if (callBack) callBack(jtab);

		},
		error: function (xhrError) {  
			//var errorMessage = JSON.stringify(xhrError.responseText);
			console.log("!!ERROR FoldersContent of: " + path + "<br>"
						+ xhrError.status + ":" + xhrError.statusText 
						+ " Reponse:" + xhrError.responseText);
			toastr.error(""+ xhrError.responseText, "Error when FoldersContent");
			if (callBack) callBack(); 
		}
	});	
	
}
/**
 * Get list of user folder on data path
 * @param callBack
 */
function getUserLists(callBack) { 
	
	//User list login is after /datas/project
	var projectUri		= _DATA_URI + _oAppScope._project;
	
	$.ajax({ type		: "GET"
		, url			: PATH_URL() + "?action=listFiles&folder=true&path="+projectUri + _oAppScope.params("&")
		, beforeSend	: function(xhr) {
			xhr.setRequestHeader("Authorization", "Basic " + _oAppScope._logStr); 
			xhr.setRequestHeader("WWW-authenticate", "database");
		},   
		async		: false,
		dataType	: "json",
	
		success		: function (jtab) {  
			console.log("UserList:  " + jtab);
			//if (callBack) callBack(jtab); 
			handleSharing(jtab, callBack); 
		},
		error: function (xhrError) {   
			console.log("!!ERROR FoldersContent of: " + path + "<br>"
						+ xhrError.status + ":" + xhrError.statusText 
						+ " Reponse:" + xhrError.responseText);
			toastr.error(""+ xhrError.responseText, "Error when FoldersContent");
			//if (callBack) callBack(); 
		}
	});	
	
}

/**
 * Share with multiple
 * @param tabUsers
 * @param shareCallback
 */
var ALL = "All"; //Label for all user (SHARED)
var _BSHOWED = false;
function handleSharing(tabUsers, shareCallback) {
	//!! Only launch ONCE
	if ( !_BSHOWED) {
		(function($) { 
			var _org = $.fn['show']; 
			$.fn['show'] = function() {  
				var obj = _org.apply(this, arguments);
				try {
					this.trigger('show'); 
				}
				catch (err) {}
				return obj; //Must has return, because othe element use this
			};   
		})(jQuery); 
		_BSHOWED = true;
	}
	
	var editBox = '<form id="shareboxFrm" class="form-horizontal">' +
		'<div class="input-group-btn" id="shareBox">'
					+ '<button tabindex="-1" class="btn" type="button">Share with who ? </button>'
					+ '<button tabindex="-1" data-toggle="dropdown" class="btn btn-default dropdown-toggle" type="button">'
					+ '<span class="caret"></span>'
					+ '</button>'
					
					+ '<ul role="menu" class="dropdown-menu" style="padding:0px;">'
			
						for (var i=0; i<tabUsers.length; i++) { 
							var usr = tabUsers[i];
							if (usr.indexOf(".")<0 
									&& usr.toLowerCase() != "shared"
									&& usr.toLowerCase() != _oAppScope._login) 
							{
								editBox += '<li style="margin:0px;padding:0px;line-height:15px">';
								editBox += '<a href="" style="margin:2px;padding:2px;">'
											+ '<input type="checkbox" value="'+usr+'"><span class="lbl">'+usr+'</span></a>';
								editBox += '</li>';
							}
						}
						editBox += '<li class="divider"></li>';
						editBox += '<li style="margin:0px;padding:0px;line-height:20px">';
						editBox += 	  '<a href="" id="cAll"  style="margin:2px;padding:2px;font-weight:600">'
									+ '<input type="checkbox" value="'+ALL+'"><span class="lbl">SHARED (all users)</span></a>';
						editBox += '</li>'; 
	editBox += ' </ul> </div>'
			+ '</form>'
			;

	//Choose user target
	var shareBox = bootbox.dialog({
		//title: "Share view with who ?",
		size   : "small",
		//, className: "entry-box" 
		message: editBox, 
		buttons: {
			cancel: { label: "Cancel", className: "btn-default" },
			successs: { label: "Share"
				, callback : function() { 
					
					var user = [];
					
					if ( $("#cAll input[type=checkbox]").is(":checked"))
						user.push(ALL);
					else {
			            $("#shareBox ul.dropdown-menu input[type=checkbox]").each(function() {
			                if ($(this).is(":checked")) {
			                    //line += $("+ span", this).text() + ";";
			                	user.push( $(this).val() );
			                }
			            });
					}
		            
					//Go
		            shareCallback(user);
					
				}//end callback 
			}//end success
		}//end button
	});
	
	shareBox.on("show.bs.modal", function() { 
		//Height
		var hgt = (tabUsers.length + 1) * 30;
		//$(".entry-box .modal-body").css("height", hgt);  
		$("#shareboxFrm").css("height", hgt); 
	});
	
	 
	function handlecheck($c) {
		if ( $c.prop("checked") ) {
			if ( $c.val() == ALL ) {
				$("#shareBox input[type='checkbox']").prop("checked", true);
				//$c.prop("checked", true)
			}
			else { 
				if ( $("#shareBox ul").find('input:checkbox:not(:checked)').length == 1) 
					$("#cAll input[type='checkbox']").prop("checked", true);
			}
		}
		else {
			if ( $c.val() == ALL ) {
				$("#shareBox input[type='checkbox']").prop("checked", false);
				//$c.prop("checked", true)
			}
			else {
				$("#cAll input[type='checkbox']").prop("checked", false);
			}
		}
	}
	
	$("#shareBox ul li a input").click( function(e) {  
		e.stopPropagation();  
		handlecheck($(this));
	});
	
	$("#shareBox ul li a").click( function(e) { 
		e.preventDefault();
		e.stopPropagation();  
		var $c = $("input[type='checkbox']", $(this)); 
		$c.prop("checked", ! $c.prop("checked") );
		handlecheck($c); 
	}); 
	
	 $('.dropdown-toggle').dropdown('toggle');
	
} //end function

/**
 * Create an unique id for a widget
 * => [date creation]_[login creator]_[uniqId]
 * @param originId : id to duplicate
 * @returns
 */
function getUniqId(originId, bIsView) {
	
	 var newId = (new Date()).getTime();
	 var prefix = "_" + _oAppScope._login;
	 
	 if (!originId || originId == _EMPTY_WDT_ID) 
		 newId = (bIsView? "v":"w") + (new Date()).getTime();
	 else {
		 prefix = ""; 
		 newId  = originId; 
		 
		 var i = originId.lastIndexOf("_");
		 if (i>0 && !newId.endsWith("_shared")
				 && !newId.endsWith("_common")
			 ) {
			 newId = originId.substring(0, i);
		 }
		 
		 if (isCommon(originId)) {
			 if (!newId.endsWith("_common")) 
				 prefix += "_common";
		 }
		 else if (newId.indexOf("_")<0) {
			prefix = "_" + _oAppScope._login;
		 } 
	 } 
	 newId += prefix + "_" + uniqId();
	 return newId;  
}

/**
 * Get unique personal widget name
 * @param wdtLabel
 */
function getUniquePWidgtName(tabWidgt, wdtLabel) {
	var tnames = new Array();

	//Read all personal widget names
	for (var i=0; i<tabWidgt.length; i++) {
		var dic = tabWidgt[i];
		var nm = dic["label"];
		if (nm && tnames.indexOf(nm)<0)
			tnames.push(nm);
	}
	
	var newLabel = wdtLabel + "_1";
	var idx = 1;
	while (tnames.indexOf(newLabel)>=0) {
		newLabel = wdtLabel + "_" + (++idx);
	}
		
	return newLabel;
}

/**
 * Change css
 * @param cssFile
 * @param cssLinkIndex
 */
function changeCSS(cssFile, cssLinkIndex) {
	var oldlink = document.getElementsByTagName("link").item(cssLinkIndex);
	var newlink = document.createElement("link");
	newlink.setAttribute("rel", "stylesheet");
	newlink.setAttribute("type", "text/css");
	newlink.setAttribute("href", cssFile);
	newlink.setAttribute("id", "sdm-style");

	document.getElementsByTagName("head").item(0)
			.replaceChild(newlink, oldlink);
}

/**---------------------------------------
 *  Get study
/**--------------------------------------- */
function getStudy(bWarn) {
	var study = cleanText( $("#study").text() );	
	if (!study && bWarn) {
		toastr.warning("You have to select a study folder, before !");
		return "";
	}
	return study;
}

/**
 * Get short label, max limit
 * 
 * @param txt
 * @param limit
 * @returns {String}
 */
function cutLabel(txt, limit) {
	if (!limit) {
		limit = C_MAX_CAR;
	}
	var shortName = txt;
	
	if (txt.length > limit) {
		shortName = "";
		var idx = 0;
		var lidx = -1;
		for (var i=0; i<txt.length; i++) {
			var car = txt[i];
			
			if (idx == limit) {
				if (lidx>0) {
					var s = shortName.substring(lidx);
					shortName = shortName.substring(0, lidx) + " " + s;
					idx = s.length;
					lidx = -1;
				}
				else {
					shortName += " ";
				    idx = 0;
				}
			}
			else {
				if ("/-_.".indexOf(car)>=0)
					lidx = shortName.length+1;			
			}
			shortName += car;
			idx++;
		}
	}
	if (shortName.indexOf("/")==0) shortName = shortName.substring(1);
	return shortName;
}

/* Format to short filename */ 
function formatResLine(dval, iCutNum, bRemovePath, bRemoveExt) {
	
    var tab = {};
   
    var path 	 = dval.path;
	var filename = path;
	
	//Remove version
	var x = filename.indexOf("/?");
	if (x<0) x = filename.indexOf("?");
	
	//----- Get version ----
	var version = dval.version;
	if (!version) {
		if (x>0) version = filename.substring(x + "?ver=".length +1);
		else version = "";
	}
    tab["version"] = version;
	if (version) version = "?ver="+ version;
    
    //Filename without version
    if (x>0) filename = filename.substring(0,x);
    //Filename Remove last /
    if (filename.endsWith("/"))
    	filename = filename.substring(0,filename.length-1);
	 
	//Remove study
	var study = getStudy();
	if (study) {
		filename = filename.replace(study, "");
		tab["filename"] = cutLabel(filename, iCutNum); // + version;
	}
	else
		tab["filename"] = cutLabel(filename, iCutNum); // + version;
	
	//Remove Path
	var n = filename.lastIndexOf("/");
	if (bRemovePath) {
		if (n>0) {
			filename = filename.substring(n+1);
			n = -1;
		}
	}

    //----------------------------------------------
	//Get image, before cutting filename
	var image = dval.img;
	if (!image) {
		var name = filename;
		if (n>0) name = filename.substring(n+1);
		image = getImage(name);
	}
    tab["image"] = image;
    
	if (bRemoveExt){
		var x = filename.lastIndexOf(".");
		if (x>0) filename=name.substring(0,x);
	}
	
	//Always cut filename for wrap
	var shortName = cutLabel(filename, iCutNum);
    tab["shortname"] = shortName; 

    return tab;
}

//------------------------------------------------------
//
//			IMAGES
//
//------------------------------------------------------
/**
 * Get image path
 * //(?i)([^/]*)((1D_Fastener_K1)|(BUCKLING_LCID))(\.[^.]+)
 * @param fileName 
 * @returns {String}
 */
var _DEFAULT_ICON = { "op2":"nastran.png", "dball":"nastran.png"
					, "master":"nastran.png", "neut":"nastran.png"
					
					, "dat": "dat.png", "bdf":"dat.png", "blk":"dat.png", "f04":"dat.png"
					, "f06":"dat.png" , "pch":"nastran.png" , "blk":"nastran.png"
								
					, "plb":"patran.png", "ses":"patran.png"		
					, "txt":"txt.png"
					, "log":"log.png"
					, "conf" :"conf.png"
};

function getImage(fileName) { 
	if (!_oAppScope._allImages) return "";
	
	//DEFAULT IMAGE
	var image = _ROOT + "img/default/default.png";
	
	//Read extension of the filename
	var ext = fileName.substring(fileName.lastIndexOf(".")+1);
	if (ext) {
		ext = ext.toLowerCase();
		var defImg  = _DEFAULT_ICON[ext];
		if (defImg)
			return _ROOT + "img/default/"+ defImg;
	}

	for (var i=0; i<_IMG_PATH.length; i++) {
		
		var img_key = _IMG_PATH[i];
		var tabImages = _oAppScope._allImages[img_key];
		if (!tabImages) continue;
		
		//Image PATH
		if (img_key.indexOf("/")==0) img_key = img_key.substring(1);
		var imgSrc = _ROOT + img_key;
		
		for (var j=0; j<tabImages.length; j++) {
			var img = tabImages[j];
			//img name 
			var png = img.substring(0, img.lastIndexOf("."));
			
			if (fileName.indexOf("." + png)>0)
				return (imgSrc + img);
				
			var regEx = new RegExp(png + "[.]", "i");
			if (regEx.test(fileName)) {
				return (imgSrc + img);
			}
			
			var k = png.indexOf("_");
			if (k>0) {
				png = png.substring(k);
				regEx = new RegExp(png + "[.]", "i");
				if (regEx.test(fileName)) 
					return (imgSrc + img);
			}
		}
	}

	return image;
}

/**
 * Check if filename is document
 * @param fileName
 * @returns
 */
function isDocument(fileName) {
	return ( fileName.indexOf(".xls")>0 
			 || fileName.indexOf(".doc")>0 
			 || fileName.indexOf(".ppt")>0 
			 || fileName.indexOf(".txt")>0 
			);
}

//------------------------------------------------------------------

/**
 * Hide/Show slimscroll on left menu
 * @param bHide
 */
function sideSlimScroll(bHide) {
	if (bHide) { 	
	    $('.side-items ul').slimScroll({destroy:true});
		$('.side-items ul > .slimScrollRail').each( function( ) {$(this).remove();});
		$('.side-items ul > .slimScrollBar').each( function( ) {$(this).remove();});
	    $('.side-items ul > .slimScrollDiv').each( function( ) {
		    var hContent = $(this).html();
		    $(this).parent().append(hContent);
		    $(this).remove();
	    }); 
	}
	else {
		$('.side-items ul').slimScroll({
			height : '90%',
			railOpacity : 0.4,
			wheelStep : 10,
			alwaysVisible: true
		});
	}
}

/**
 * Create a dopdown select, most beatiful tah select
 */
function setVal(id, val) {
	alert( id + " : " + val);
	$('#'+id).text(val);
}
function htmlSelect(tab, value, dAttr) {
	
	//Avoid undefined
	if (!tab) tab = []; 
	
	var cls = "";
	var dropup = "";
	
	if (dAttr) {
		if ("cls" in dAttr) cls = dAttr.cls; 
		if ("dropup" in dAttr) dropup= dAttr.dropup; 
	}
	
	if (!value) value = tab[0];
	
	var sid = uniqId();
	var lis = "";
	for (var i=0; i<tab.length; i++) { 
		lis += '<li><a href="javascript:setVal(\''+sid+'\',\''+tab[i]+'\')">'+tab[i]+'</a></li>';
	}   
	var sel = '<div class="btn-group dropup">'
			+ '<button type="button" class="btn btn-white" id="'+sid+'">'+value+'</button>'
			+ '<button type="button" class="btn btn-white dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'
			+ '<span class="caret"></span>'
			+ '<span class="sr-only">Toggle Dropdown</span>'
			+ '</button>'
			+ '<ul class="dropdown-menu">'+lis+'</ul>'
			+ '</div>';
	return sel;
}

/**
 * Open file when click
 * @param shref
 */
function openFile(shref) { 
	//window.open(shref, "_blank", "width=900, height=700, scrollbars=yes");
	window.open("/datas/temp/test.h3d", "_blank", "width=900, height=700, scrollbars=yes");
}
function openFileKo(shref) { 
		
	var link = window.frames['iOpenFrame'].document.getElementById("myLink");
	link.href = shref;
	link.click();
	
//	var openWindow = window.open("./openFile.html", "_blank", "width=900, height=700");
//	openWindow.dataFromParent = shref;
//	openWindow.init();
	 
	/*
	var i = shref.lastIndexOf(".");
	var ext = shref.substring(i);
	ext = ext.replace(/\//g, "");
	i = ext.indexOf("?");
	if (i>0) ext = ext.substring(0, i);
	
	//TODO : work by don't know how open data correctly
	$.ajax({
		type :"GET",
		url			: shref, //  + _oAppScope.params("&"),
		async		: false, 
//		beforeSend	: function( xhead ) {
//			xhead.setRequestHeader("Authorization", "Basic "+_oAppScope._logStr); 
//			xhead.setRequestHeader("WWW-authenticate", "database"); 
//		}
		headers: { "WWW-authenticate" : "database"
					, "Authorization" : "Basic "+_oAppScope._logStr
					, "Content-type" : "application/octet-stream" 
					, "Content-disposition" : "attachment;filename=\"filename.h3d\""
			}
		, success : function (response, status, xhr) {

			window.open(shref, "_blank", "width=900, height=700");
//			var blob = new Blob([response]); //{type: type}
//			var link  = document.createElement('a');
//			
//			var downloadUrl = URL.createObjectURL(blob);
//			link.href = window.URL.createObjectURL(blob);
//			link.download = "Dossier_"+ (new Date()) + ext;
//			link.click();
//			 
//            setTimeout(function () {
//                URL.revokeObjectURL(downloadUrl);
//            }, 3000); // Cleanup
           
            // Check if a filename is existing on the response headers.
//            var filename = "";
//            var disposition = xhr.getResponseHeader("Content-Disposition");
//            if (disposition && disposition.indexOf("attachment") !== -1) {
//                var filenameRegex = /filename[^;=\n]*=(([""]).*?\2|[^;\n]*)/;
//                var matches = filenameRegex.exec(disposition);
//                if (matches != null && matches[1])
//                    filename = matches[1].replace(/[""]/g, "");
//            }
//
//            var type = "h3d"; //xhr.getResponseHeader("Content-Type");
//            var blob = new Blob([response], {type: type});
//
//            if (typeof window.navigator.msSaveBlob !== "undefined") {
//                // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed.
//                window.navigator.msSaveBlob(blob, filename );
//            } else {
//                var URL = window.URL || window.webkitURL;
//                var downloadUrl = URL.createObjectURL(blob);
//
//                if (filename) {
//                    // Use HTML5 a[download] attribute to specify filename.
//                    var a = document.createElement("a");
//                    // Safari doesn"t support this yet.
//                    if (typeof a.download === "undefined") {
//                        window.location = downloadUrl;
//                    } else {
//                        a.href = downloadUrl;
//                        a.download = filename;
//                        document.body.appendChild(a);
//                        a.click();
//                    }
//                } else {
//                    window.location = downloadUrl;
//                }
//
//                setTimeout(function () {
//                    URL.revokeObjectURL(downloadUrl);
//                }, 100); // Cleanup
//            }
 
		}
		, error: function(err) {
			window.open(shref, "_blank", "width=900, height=700");
		} 
	}); 
	*/
}

/** ====================================================== */
/** 					TOOLS							   */
/** ====================================================== */

// Minimalize menu when screen is less than 768px
$(window).bind("resize", function() {
	if ($(this).width() < 769) {
		$('body').addClass('body-small');
	} else {
		$('body').removeClass('body-small');
	}
});

// For demo purpose - animation css script
function animationHover(element, animation) {
	element = $(element);
	element.hover(function() {
		element.addClass('animated ' + animation);
	}, function() {
		// wait for animation to finish before removing classes
		window.setTimeout(function() {
			element.removeClass('animated ' + animation);
		}, 2000);
	});
}

/**
 * Show/Hide smoothly
 */
function SmoothlyMenu() {
	if (!$('body').hasClass('mini-navbar') || $('body').hasClass('body-small')) {
		// Hide menu in order to smoothly turn on when maximize menu
		$('#side-menu').hide();
		// For smoothly turn on menu
		setTimeout(function() {
			$('#side-menu').fadeIn(500);
		}, 100);
		
	} else if ($('body').hasClass('fixed-sidebar')) {
		$('#side-menu').hide();
		setTimeout(function() {
			$('#side-menu').fadeIn(500);
		}, 300);
	} else {
		// Remove all inline style from jquery fadeIn function to reset menu
		// state
		$('#side-menu').removeAttr('style');
	}
}

// Draggable panels
function WinMove() {
	var element = "[class*=col]";
	var handle = ".ibox-title";
	var connect = "[class*=col]";
	$(element).sortable({
		handle : handle,
		connectWith : connect,
		tolerance : 'pointer',
		forcePlaceholderSize : true,
		opacity : 0.8
	}).disableSelection();
}

// Click on spin setting
$('.spin-icon').click(function() {
	$(".theme-config-box").toggleClass("show");
});

/** ================================================
 * 					SKIN Handle
 * =================================================*/
function applySkin(skinName) { 	 
	var idx = skinName.substring(skinName.lastIndexOf("-")+1);
	for (var i=0; i<=4; i++)
		$("body").removeClass("skin-"+i);
 
	var skin = "skin-"+idx;
	console.log("Set skin: " + skin);
	
	var css = _ROOT + "css/style"+ ((idx=="0"||idx=="3")?"":"-blue") + ".css";
	changeCSS(css, IDX_CSS); 
	
 	$("body").addClass(skin);
};

$(".setings-item .skin-name a").click(function() {
	var skinName =  $(this).attr("class");
		
	$('.panel-colorbox' ).remove(); 
	$('.panel-colorbox-head' ).remove();
	$('.panel-colorbox-open' ).removeClass("panel-colorbox-open");
	
	applySkin(skinName);
 	updateSettings("skin", skinName);
});

// 
/** ================================================
 * 					READY
 * =================================================*/
$(document).ready(function() {
 
	console.log("-> util.js Ready!");

	// Add body-small class if window less than 768px
	if ($(this).width() < 769) {
		$('body').addClass('body-small');
	} else {
		$('body').removeClass('body-small');
	}

	// Collapse ibox function
	$('.collapse-link').click( function() {
		
		var ibox = $(this).closest('div.ibox');

		var button = $(this).find('i');
		var content = ibox.find('div.ibox-content');
		content.slideToggle(200);
		button.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');

		ibox.toggleClass('').toggleClass('border-bottom');
		setTimeout(function() {
			ibox.resize();
			ibox.find('[id^=map-]').resize();
		}, 50);
	});

	// Close ibox function
	$('.close-link').click(function() {
		var content = $(this).closest('div.ibox');
		content.remove();
	});

	// Close menu in canvas mode
	$('.close-canvas-menu').click(function() {
		$("body").toggleClass("mini-navbar");
		SmoothlyMenu();
	});

	// Open close right sidebar
	$('.right-sidebar-toggle').click(function() {
		$('#right-sidebar').toggleClass('sidebar-open');
	});

	/** ----------------- SCROLL ------------------------------- */
	// Initialize slimscroll for right sidebar
	$('.sidebar-container').slimScroll({
		height : '100%',
		railOpacity : 0.4,
		wheelStep : 10
	});
		

	// Initialize slimscroll for windows
	$('#wrapper').slimScroll({
		height : '100%',
		railOpacity : 0.4,
		wheelStep : 10,
		alwaysVisible: true
	});
	
	// Small todo handler
	$('.check-link').click(
			function() {
				var button = $(this).find('i');
				var label = $(this).next('span');
				button.toggleClass('fa-check-square').toggleClass(
						'fa-square-o');
				label.toggleClass('todo-completed');
				return false;
			});

	// Minimalize menu
	$('.navbar-minimalize').click(function() {  
		$("body").addClass('fixed-sidebar'); 
		$('.sidebar-collapse').slimScroll({
			height : '100%',
			railOpacity : 0.9
		}); 
		 
		$("body").toggleClass("mini-navbar");
		sideSlimScroll( $("body").hasClass("mini-navbar"));
		$('#collapsemenu').prop('checked', $("body").hasClass("mini-navbar"));
		
		//sideSlimScroll();
		SmoothlyMenu();
		
//		$(".theme-config-box").addClass("show");  
//		$('#collapsemenu').trigger("click"); 
//		SmoothlyMenu();
//		
//		//Hide settings  
//		setTimeout( function() {  
//			$(".theme-config-box").removeClass("show");  
//		}, 1000);  
	});

	// Tooltips demo
	$('.tooltip-demo').tooltip({
		selector : "[data-toggle=tooltip]",
		container : "body"
	});

	// Move modal to body
	// Fix Bootstrap backdrop issu with animation.css
	$('.modal').appendTo("body");

	// Full height of sidebar
	function fix_height() {
		var heightWithoutNavbar = $("body > #wrapper").height() - 61;
		$(".sidebard-panel").css("min-height",
				heightWithoutNavbar + "px");

		var navbarHeigh = $('nav.navbar-default').height();
		var wrapperHeigh = $('#page-wrapper').height();

		if (navbarHeigh > wrapperHeigh) {
			$('#page-wrapper').css("min-height", navbarHeigh + "px");
		}

		if (navbarHeigh < wrapperHeigh) {
			$('#page-wrapper').css("min-height",
					$(window).height() + "px");
		}
	}
	fix_height();
	
	// Enable/disable fixed top navbar
	$('#fixednavbar').click( function() {
		var val = 'on';
		if ($('#fixednavbar').is(':checked')) {
			$(".navbar-static-top").removeClass('navbar-static-top').addClass('navbar-fixed-top');
			$("body").addClass('fixed-nav');
			sideSlimScroll();
		} 
		else {
			val = 'off';
			$(".navbar-fixed-top").removeClass('navbar-fixed-top').addClass('navbar-static-top');
			$("body").removeClass('fixed-nav'); 
		}
		updateSettings("fixednavbar", val);
	});

	// Enable/disable fixed sidebar
	$('#fixedsidebar').click(function() {
		var val = 'on';
		
		if ($('#fixedsidebar').is(':checked')) {
			$("body").addClass('fixed-sidebar');
			$('.sidebar-collapse').slimScroll({
				height : '100%',
				railOpacity : 0.9
			}); 
		} else {
			val = 'off'; 
			$('.sidebar-collapse').slimscroll({
				destroy : true
			});
			$('.sidebar-collapse').attr('style', '');
			$("body").removeClass('fixed-sidebar');
		} 
		updateSettings("fixedsidebar", val);
	});

	// Enable/disable Small menu
	$('#collapsemenu').click(function() {
		var val = 'on';
		
		if ($(this).is(':checked')) { 
			$('.sidebar-collapse').slimscroll({
				destroy : true
			});
			$('.sidebar-collapse').attr('style', '');
			$("body").removeClass('fixed-sidebar');

			$("body").addClass('mini-navbar');
			
			//Destroy scroll
			sideSlimScroll(true); 
		} 
		else {
			val = 'off';
			$("body").removeClass('mini-navbar');  
			$("body").addClass('fixed-sidebar');
			
			$('.sidebar-collapse').slimScroll({
				height : '100%',
				railOpacity : 0.9
			}); 
			sideSlimScroll();
		}
		SmoothlyMenu();
		updateSettings("collapsemenu", val);
	});

	// Enable/disable fixed footer
	$('#fixedfooter').click(function() {
		var val = 'on';

		if ($('#fixedfooter').is(':checked')) {
			$(".footer").addClass('fixed');

		} else {
			val = 'off';
			$(".footer").removeClass('fixed');
		}
		updateSettings("fixedfooter", val);
	});

	// Fixed Sidebar
	$(window).bind("load", function() {
		if ($("body").hasClass('fixed-sidebar')) {
			$('.sidebar-collapse').slimScroll({
				height : '100%',
				railOpacity : 0.9
			});
			$('#wrapper').slimScroll({
				height : '100%',
				railOpacity : 0.9
			});
		}
	});

	// Move right sidebar top after scroll
	$(window).scroll(
			function() {
				if ($(window).scrollTop() > 0
						&& !$('body').hasClass('fixed-nav')) {
					$('#right-sidebar').addClass('sidebar-top');
				} else {
					$('#right-sidebar').removeClass('sidebar-top');
				}
			});

	$(document).bind("load resize scroll", function() {
		if (!$("body").hasClass('body-small')) {
			fix_height();
		}
	});

	// Add slimscroll to element
	$('.full-height-scroll').slimscroll({
		height : '100%'
	});
});
