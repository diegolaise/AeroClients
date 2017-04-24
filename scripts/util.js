//========================================================================
//		SDMA UTILS
//========================================================================

var _REVISION = "2.4";
 
//Used Separator
var _B_HASH   = false;

var _SEP = "&";
var _SESSION_ID	= "sessionId";
var _PARAMETER  = "parameter";

var _URL 	= "ALUrl"; 
var _LOGIN 	= "login";
var _PASS 	= "password";

var _HOST 		= "host";
var _H_USER 	= "user";
var _H_PASS 	= "hpassword";

var _PROJECT  = "project";

var _SDMR_KEY = [_LOGIN, _PASS];
var _JOB_KEY  = [_HOST, _H_USER, _H_PASS]; 
var _PARAM_KEYS = _SDMR_KEY.concat(_JOB_KEY);

function wait() { $('html').addClass("wait"); }
function endwait() { $('html').removeClass("wait"); }

//==============================================================
//    Parameter Parsing
//==============================================================
function parseParameters(hash) {
	var dConfig = {};
	
	var sessionId;  
	if (hash) {
		if (hash.startsWith("/")) {hash = hash.substring(1);}
		if (hash.endsWith("/")) {hash = hash.substring(0, hash.length-1);}
		
		sessionId = hash;
		_B_HASH = true;
	} 
	
	var strParam = ""; 
	if (sessionId) { 
		
		strParam = getStorage(sessionId);
		
		//If no storage
		if (!strParam) {
			_B_HASH = false; 
		}
	}
	else { 
		sessionId = uniqId();
	}

	if ( !strParam && window.location.href.indexOf("?")>0 ) {
		strParam = window.location.href.split("?")[1]; 
	} 
	
	if (strParam) {
		setStorage(sessionId, strParam);
		
		var sParam = decodeURIComponent(strParam);
		var tParam = sParam.split(_SEP); 
		
		dConfig[_SESSION_ID] = sessionId;
		dConfig[_PARAMETER]  = tParam; 
	}
	else if (history.length>0 && hash){
		history.back();
	}
	
	//CLEAR HASH  
	if (_B_HASH) window.location.hash = "#/" + sessionId;
	
	return dConfig;
}

//==============================================================
//Logout
//==============================================================
/**
* Open new window without history
* @param url
*/
function openReplace(url) {
	var win = window.open("", "_top", "true");
	win.opener = true;
	
	window.open(url); 
	
	win.close(); 
	window.close();
}

/**
* Log out
* @param project
*/
function logOut(project) { 
	openReplace("/sdma/index.jsp?project="+project);  
}



//==============================================================
//STORAGE
//==============================================================
var _hasStorage = (function() {
	return (typeof(Storage) !== "undefined");
}()); 

var _Storage = (function() {
	return localStorage; 
}());

function clearStorage(sKey) {  
	_Storage.removeItem(sKey);
} 

/**
* Read local storage item
* @param skey
* @returns
*/
function getStorage(skey, bIsObj) { 
	if (! _hasStorage) return "";
	
	var value = _Storage.getItem(skey);
	if (!value) {
		if (bIsObj) return null;	
		value =""; 
	}
	else if (bIsObj) { //} || value.indexOf("{")==0 || value.indexOf("[")==0) {
		try { 
			var obj = JSON.parse(value);
			if (obj!=null && (typeof obj != "undefined")) 
				return obj;
		}
		catch (err) {} 
	}
	return value;
}

/**
* Set storage item
* @param skey
* @param obj
*/
function setStorage(skey, obj) { 
	if (! _hasStorage ) return;  
	if (typeof obj === "string") 
		_Storage.setItem(skey, obj);
	else
		value = _Storage.setItem(skey, JSON.stringify(obj));
}

//==============================================================
//    UTILS
//==============================================================

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
 * Sleep
 * @param milliseconds
 */
function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
}

/**
 * String endsWith
 * 
 * @param suffix
 * @returns {Boolean}
 */
String.prototype.endsWith = function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

/**
 * String Starts With
 */
String.prototype.startsWith = function(prefix) {
	return (this.indexOf(prefix) === 0);
};


/**
 * Get unique id
 * 
 * @param lastId
 * @returns
 */
var _ALL_IDS = new Array();
function uniqId() {
	var id = "i" + Math.random().toString(36).substr(2, 9); 
	if (_ALL_IDS.indexOf(id)<0) {
		_ALL_IDS.push(id);
		return id;
	}
	
	//Not unique, try again
	return uniqId();
}

 
$.arrayIntersect = function(a, b) {
	return $.grep(a, function(i) {
		return ($.inArray(i, b) > -1);
	});
}
 
jQuery.fn.justtext = function() {
    return $(this).clone()
            .children()
            .remove()
            .end()
            .text()
            .trim();
}; 

//============================ SPIN ============================

function addSpin($parent) {
	var sHtml = '<div id="spinner" class="spinner"></div>';
	if (!$parent) $parent = $('body');
	$parent.append(sHtml);
}

function delSpin() {
	if ($("#spinner").length>0)
		$("#spinner").remove(); 
}

function spin($parent) { 
	if (!$parent) $parent = $('body');
	if ($("#spinner").length>0)
		$("#spinner").show();
	else {
		addSpin($parent); 
		$("#spinner").show();
	}
	$('html').addClass('wait');
}

function hideSpin() {
	$("#spinner").hide();
	$('html').removeClass('wait');
}

//==============================================================
