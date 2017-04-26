/**=================================================================
 * 
 * 			GLOBAL TOOL : VARIABLES & FUNCTIONS
 * 
 *==================================================================*/
/** The angular scope */
var $graphScope = null; //angular.element(document.body).scope()

/** Check if IE explorer */
var _IS_IE = (window.navigator.userAgent.toLowerCase().indexOf("trident")>=0
				|| window.navigator.userAgent.toLowerCase().indexOf("msie")>=0);

/** CONSTANTS - GLOBAL VAR */
var _TABKEY = { "Tool"		: "From tool" 
				, "Process"	: "From process"
				, "Status"	: "Status" 
				, "Study"	: "Study Type"
};

/**------------------------------------------------------------------
 * 			GRAPH/DRAW GLOBAL VARS 
 *------------------------------------------------------------------*/
var p = $("body").css("padding-top");
var _BODY_PADDING = parseInt(p.replace("px", "")); //Body padding top

var _MIN_TOP 	= _BODY_PADDING + 120; 
var _MIN_LEFT 	=  220; //Width of menu (min begin of entry)

var _BOX_HEIGHT = 15; 	//max HEIGHT of input
var _BOX_WIDTH  = 120; 	//max Width of input

var _VERSION_BOX = 20;  //width of version box;

var _BOX_VGAP 	= 10; 	//Vertical gap between boxes
var _BOX_HGAP 	= 50; 	//Horizontal gap between boxes

var _BEGIN_COL_IDX 	= 4.5; //Beginning of column index //!!!Max is 8
var _BEGIN_LEVEL 	= 0;

var _GP_HEIGHT = 164; //max HEIGHT of boxes
var _GP_WIDTH  = 104; //max width of boxes
 
var _HEADER_HEIGHT = 20; 
var _MAX_HEIGHT = _GP_HEIGHT + _HEADER_HEIGHT; //body max Height
var _MAX_ENTRIES = 10;

/**------------------------------------------------------------------
 * 			PERSISTENCE GLOBAL VARS 
 *------------------------------------------------------------------*/
var _INSTANCES = {}; //{path : object}
var _ACTIVE_DATA;

//Save element by column, allow to know graph sibling position
var _ELT_BY_COL = {}; 
var _MIN_MAX_BORDER = {};

var _IS_HIDDEN_PARENT = false;
var _IS_HIDDEN_CHILD = false;

/**------------------------------------------------------------------
 * 			TOOLS FUNCTIONS
 *------------------------------------------------------------------*/
function cleanText(sTxt) {
	if (sTxt==null) return "";
	return sTxt.replace(/[\n\t\r]/g,"").trim();
}

function getArrayObj(jData, sKey) {
	if (!jData || !(sKey in jData)) {
		jData[sKey] = new Array();
	}
	return jData[sKey];
}

function getStrObj(jData, sKey) {
	if (!jData || !(sKey in jData)) {
		jData[sKey] = "";
	}
	return jData[sKey];
}

function getObj(jData, sKey) {
	if (!jData || !(sKey in jData)) {
		jData[sKey] = {};
	}
	return jData[sKey];
}

/**
 * Convertiot to ID
 * @param metaLbl
 * @returns
 */
function toId(metaLbl) {
	var id = metaLbl.replace(/ /g, "_");
	return "a_" + id;
}

/**
 * Get path whitout version
 * @param href
 * @returns
 */
function getPath(href) {
	var i = href.indexOf("?");
	if (i<0) {
		return href;
	} 
	return href.substring(0,i);
}

/**
 * Check if an element is visible
 * @param $elt
 * @returns
 */
function isVisible($elt) { 
	return ($elt && $elt.length>0 && $elt.is(":visible"));
}

/**
 * Scroll to max right when grow window drawing
 */
function scrollToRight() {
	var x = $(document).outerWidth() - $(window).width();
 
	//MOZILLA scroll
	if (navigator.userAgent.toLowerCase().indexOf('firefox'))
		$(window).scrollLeft(x+100);
	else
		$('body, html').scrollLeft(x);
}

/**
 * Scroll to min left
 */
function scrollToLeft() { 
	//MOZILLA scroll
	if (navigator.userAgent.toLowerCase().indexOf('firefox'))
		$(window).scrollLeft(0);
	else
		$('body, html').scrollLeft(0);
}

function scrollToBotttom() { 
   $("html, body").animate({ scrollTop: $(document).height() }, 200);
}

/**
 * Scroll to top
 */
function scrollToTop() { 
	$("html, body").animate({ scrollTop: 0 }, 200);
}
 
/**
 * Check if an element is collapsed
 * @param $elt
 * @returns {Boolean}
 */
function isCollapsed($elt) {
	var pCollapsed = $elt.parents().filter(function() {
		if ( $(this).css("display") == "none" )
			return $(this);
	}); 
	return (pCollapsed && pCollapsed.hasClass("panel-body"));
}

/**
 * Get offset position
 * @param $elt
 * @returns {___anonymous5211_5233}
 */
function offsetPosition($elt) { 
	var sTop = $elt.css("top"); 
	
	var y = this.top();
	if (sTop) y = parseInt(sTop.replace("px", "")); 
    
	var x = this.left();
	var sLeft = $elt.css("left"); 
	if (sLeft)
		x = parseInt(sLeft.replace("px", "")); 
    
    return {"top" : y, "left" : x}; 
}

/**
 * Draw line between two object
 * @param leftObj
 * @param rightObj
 */
function drawLine(leftObj, rightObj, bIsChild) {
	var leftId  = bIsChild ? leftObj.id() : rightObj.id();
	var rightId = bIsChild ? rightObj.id() : leftObj.id();

	//Draw line between entry and parent
	if ( _SVG.isLinked(leftId, rightId) ) return true;

	return _SVG.drawLine({
		left_node  	: leftId,
		right_node 	: rightId,
		horizantal_gap : 10,
		error : true,
		width : 0.6 
	});	 
}

/**
 * 
 */
function resetZoom() {
	var scale = 'scale(1)';
	document.body.style.webkitTransform =  scale; // Chrome, Opera, Safari
	document.body.style.msTransform =   scale;    // IE 9
	document.body.style.transform = scale;    	  // General
}
  
/**
 * Toggle connector to plus
 * @param $span
 */
function toggleToPlus($span) {
	if (! $span) return;
	if ($span.hasClass("glyphicon")) {
		$span.removeClass("glyphicon-minus-sign");
		$span.addClass("glyphicon-plus-sign");
	}
	else {
		$span.removeClass("fa-minus-circle");
		$span.addClass("fa-plus-circle");
	} 
	$span.css("display", "block");//$span.show();//don't handle show event
}

/**
 * Toggle connector to minus
 * @param $span
 */
function toggleToMinus($span) {
	if (! $span) return;
	
	if ($span.hasClass("glyphicon")) {
		$span.removeClass("glyphicon-plus-sign");
		$span.addClass("glyphicon-minus-sign");
	} else {
		$span.removeClass("fa-plus-circle");
		$span.addClass("fa-minus-circle");			
	} 
	$span.css("display", "block"); //$span.show();//don't handle show event
}

/**=================================================================
 * 
 * 					Graph Handling
 * 
 *==================================================================*/

function indexOf(obj) { 
	var tab = _ELT_BY_COL[ ("" + obj._iLevel)];
	if (tab) return $.inArray(obj, tab);
	return -1;
}

/**
 * Save created element by columns
 * @param obj
 * @param col
 */
function saveElement(obj) {
	var sLevel = ("" + obj._iLevel);
	
	var tab = _ELT_BY_COL[sLevel];
	if (!tab)	{
		tab = [obj]; 
		_ELT_BY_COL[sLevel] = tab; 
	}
	else {
		//Ordonner
		var objTop = obj.top();
		
		var found = false;
		
		for (var i=0; i<tab.length; i++) {
			var entry = tab[i];
			var top = entry.top();
			if (top > objTop) {
				tab.splice(i, 0, obj);
				found = true;
				break;
			}
			
//			var hgt = entry.height();
//			if (hgt>obj.height()) {
//				var bottom = top + hgt;
//				if (bottom>objTop) {
//					tab.splice(i, 0, obj);
//					found = true;
//					break;
//				}
//			}
		}
		if (!found) 
			tab.push(obj);
	}

	//Decaler a droite  
	var left = obj.left();
	if (left < _MIN_LEFT) { 
		
		var nb = 1;
		var dec = _BOX_HGAP + _BOX_WIDTH;
		while ( (left + dec) < _MIN_LEFT) {
			nb++;
			left += dec;
		} 
		
		scrollToLeft();
		
		//DECALER
		decalerADroite(nb); 
	}
  
	//Save min/max left 
	var ml = _MIN_MAX_BORDER[sLevel]; 
	var border = obj.left(); 
	if ( obj.isChild() ) {
		border += obj.width(); 
		if (!ml || border > ml) 
			_MIN_MAX_BORDER[sLevel] = border;
	}
	else if (!ml || border < ml)
		_MIN_MAX_BORDER[sLevel] = border;
}

/**
 * Rabaisser les siblings apres oEntry
 * @param oEntry
 * @returns
 */ 
function moveNextToDown(oEntry) {
	
	//Only topBox is saved in _ELT_BY_COL
	var topBox = oEntry.topBox();
	
	var iLevel = oEntry._iLevel; 
	var tabCol = _ELT_BY_COL[(""+iLevel)];
	if ( !tabCol) return; 
	var N = tabCol.length;
	if (N<=1) return;
	
	//Get topBox top
	var topTop = topBox.top();
	
	var idx = $.inArray(topBox, tabCol);  
	if (idx>0) {
		//Get precedent object
		var precObj    = tabCol[idx - 1]; 
		var precBottom = Math.floor(precObj.top() + precObj.height() + _BOX_VGAP); 
		
		//The Entry is inside its precedent 
		if (topTop < precBottom) {
			topBox.setPosition({"top": precBottom, "left": topBox.left()}); 
		}
	} 
	
	//The entry is the last => stop 
	if (idx+1 == N) return;
	
	var netxTop = Math.floor(topTop + topBox.height()) + _BOX_VGAP; 
	for (var i = (idx + 1); i<N; i++) {
		var obj = tabCol[i];

		var top = Math.floor(obj.top());
		if (top >= netxTop) break;
		
		//Move to next
		obj.setPosition({"top": netxTop, "left": obj.left()});
			
		//Next decalage
		netxTop += Math.floor(obj.height()) + _BOX_VGAP;
	}  
}

/**
 * Reoreder after collapse
 * @param oEntry
 * @returns
 */
function upNextPosition(oEntry) {
	
	var bIsChild = oEntry.isChild();
	
	var oBox = oEntry.topBox(); 
	
//	var myPrecedent = getTopPrecedent(oBox, bIsChild);
//	if (oBox.top() <= myPrecedent.top()) {
//		var top = myPrecedent.top() - (oBox.height() /2);
//		oBox.setPosition({ "top" : top , "left": oBox.left() });
//	}
 
	var sLeveL = ""+oBox._iLevel;
	var iPrecLevel = oBox._iLevel + (bIsChild ? -1 : 1);
	var tabCol = _ELT_BY_COL[sLeveL]; 
  
	var top  = oBox.top() + oBox.height() + _BOX_VGAP;
	var left = oBox.left();
	var idx  = $.inArray(oBox, tabCol);

	for (var i=(idx+1); i<tabCol.length; i++) {
		
		var obj = tabCol[i];
		
		var oPrecedent = getTopPrecedent(obj, bIsChild);
		var topPrec = oPrecedent.top();
		if (top < topPrec) {
			top = topPrec;
		}
		
		obj.setPosition({ "top" : top , "left": left });
		
		//Next top
		top += obj.height() + _BOX_VGAP; 
	} 
	return true;
}


/**
 * Get data entry
 * @param path
 * @returns
 */
function getEntry(path) {
	return _INSTANCES[path]; 
}

/**
 * Container From
 * @param path
 * @returns
 */
function getContainer(cKey, cLabel) { 
	if (cKey in _INSTANCES)
		return _INSTANCES[cKey]; 
	
	var cont = new Container(cKey, cLabel, "CONTAINER");
	_INSTANCES[cKey] = cont;
	return cont;
}

/**
 * Container type
 * @param path
 * @returns
 */
function getGroup(gpId, gpLabel) {   
	if (gpId in _INSTANCES)
		return _INSTANCES[gpId]; 

	var group = new Container(gpId, gpLabel, "GROUP");
	_INSTANCES[gpId] = group;
	return group;
}

/**
 * Get entry/container object from dom
 * @param $div
 * @returns
 */
function getObject($div) {
	var path = $div.attr("for");
	if (!path) return null;	
	return _INSTANCES[path];
}

/**
 * Create last path from a list
 * @param list
 * @returns {Array}
 */
function sortLastPath(list) {
	var hlast = {};
	$.each(list, function(idx, path) {		
		var i = path.indexOf("?ver=");
		if (i<0) {
			hlast[path] = "0";
		}
		else {
			var shortPath = path.substring(0,i);
			var version   = path.substring(i+5);
			if (shortPath in hlast) {
				var iVer = version.replace(/\//g, "");
				var lVer = hlast[shortPath].replace(/\//g, "");
				if ( parseInt(iVer) > parseInt(lVer) )
					hlast[shortPath] = version;
			}
			else
				hlast[shortPath] = version;
		}
	});
	var tlast = [];
	$.each(hlast, function(path, vers) {
		if (vers=="0")
			tlast.push(path);
		else
			tlast.push( path + "?ver=" + vers);
	})
	return tlast;
}

/** Show log/error */
function showlog(err) {
	var sErr = (""+err);
	if (sErr) {
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
	}
	return sErr;
}


/////======================================== END Utils.js =====================================////////

