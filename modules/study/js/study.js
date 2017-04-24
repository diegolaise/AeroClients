/**========================================================== 
 * 
 * 	STUDY Handler
 *
 ============================================================*/

/**
 * Check if user is admin
 * @returns {Boolean}
 */
function isUserAdmin() {	
	if (! _oAppScope._profile.role ) return false;
	return ( _oAppScope._profile.role.toLowerCase() == "admin"); 
}

/**
 * Check if a widget is common
 * @param wId
 * @returns {Boolean}
 */
function isCommon(wId) { 
	return ( ($("#defaultWdt > #"+wId).length > 0));
}

/**
 * Check if a widget belong to personal list
 * @param wId
 * @returns {Boolean}
 */
function isPersonal(wId) {
	return ($("#personalWdt > #"+wId).length > 0);
}


/**
 * Get a widget object belonging to Common or Personal
 * @param wId
 * @returns
 */
function getCommonOrPersonalWidget(wId) {
	if (isCommon(wId))
		return _oAppScope.getCommonWidget(wId); 
	else
		return _oAppScope.getPersonalWidget(wId);
}

/**
 * Check if current view is a shared view
 * @param viewId
 * @returns {Boolean}
 */
function isSharedView(viewId) {
	if (viewId)
		return ( $("#defaultView > #"+viewId).length >0 );
	
	if (!_oSelectedView) return false; 
	return (_oSelectedView._type == _SHARED_VIEW);
}

/**
 * Open Help page
 */
function openHelp() {
	window.open('help.html', 'Popup', 'scrollbars=1,resizable=1,width=1000').focus();  
}

/** 
 * Full Screen handle 
 */
function runScreenFull() { 
	if (screenfull) { 
		$('#supported').text('Yes');

		$('#request-fullscreen').click(function () {      	
			if (!screenfull.isFullscreen) {
				screenfull.request($('#container')[0]);
			} else 
				screenfull.exit();
			screenfull.onchange();
		});

		screenfull.onchange = function (e) {
			var elem = screenfull.element;

			$('#status').text('Is fullscreen: ' + screenfull.isFullscreen);

			if (elem) {
				$('#element').text('Element: '+ elem.localName + (elem.id ? '#' + elem.id : ''));
			}

			var iShow ="glyphicon glyphicon-resize-small"; 
			var iHide = "glyphicon glyphicon-fullscreen";//"ad ad-screen-full fs18"

			if (!screenfull.isFullscreen) {
				$('#external-iframe').remove();
				document.body.style.overflow = 'auto';

				iShow = "glyphicon-fullscreen";
				iHide = "glyphicon-resize-small";
			}

			$("#request-fullscreen").removeClass(iHide);
			$("#request-fullscreen").addClass(iShow);
			full_height();
		};

		// Trigger the on change  to set the initial values
		screenfull.onchange();

	} 
	else {
		console.log("Screenfull not supported");
		$('#supported').text('No');
		$('#request-fullscreen').hide();
	}
} 

/**
 * Connect widget & group sortable 
 */
function connectSortable() { 

	//
	// Drag GROUP handler
	//
	$('#rowContainer .sortable-column').sortable({
		connectWith: [  "#rowContainer .sortable-column"    //Changement wdgt de colomns
		               , ".widgetContainer .sortable-list"  //Ajout wdgt dans un group
//		                , ".widgetContainer .sortable-item"
		               ]
	, receive: function(ev, ui) {
		//if (!ui.item) return;
		var bShared =  isSharedView();
		if (ui.item.hasClass("emptyBox") || bShared) {
			//console.log("cls: " +  ui.item.attr("class"));
			ui.sender.sortable("cancel");
			if (bShared) toastr.warning("You cannot move group into shared view");
		}
		else {
			//console.log("t-cls: " +  ui.item.attr("class"));
			if (_oSelectedView) _oSelectedView.posChange();
		}
	}
	});

	//
	// Drag widget handler
	//
	$('.widgetContainer .sortable-list').sortable({
		connectWith: ['.widgetContainer .sortable-list', '#rowContainer .sortable-column']
	, receive: function(ev, ui) {
		var bShared =  isSharedView();
		//Cancel group drop inside group
		if (ui.item.hasClass("widgetContainer") || ui.item.hasClass("emptyBox") || bShared) {
			ui.sender.sortable("cancel");
			if (bShared) toastr.warning("You cannot drop widget into shared view");
			else toastr.warning("You cannot drop group inside a group !");
		}
		else {
			//console.log("WIDGET drop ok : " + ui.item.attr("class"));
			if (_oSelectedView) _oSelectedView.posChange();
		}
	}
	});

	//
	// Drag left Menu widget handler
	//
	var widgetElt;
	$(".femWidget .sortable-list").sortable({
		helper : "clone",
		connectWith: [".widgetContainer .sortable-list", "#rowContainer .sortable-column"],
		start : function(event,ui) {

			//Change cursor to pointer
			$("#wrapper").css("cursor", "pointer"); 

			saveMe = $(ui.item).clone();
			startingList = $(ui.item).parent();

			name = $(ui.item).text();	 
			wdtId = $(ui.item).attr("id");

			eltId = uniqId();  
			if (!wdtId) wdtId = getUniqId();
			widgetElt = widgetHTML(name, wdtId, eltId, "panel-default");

			$(ui.item).show();
			saveMe.insertAfter($(ui.item) ).hide();             
		},
		stop: function(event, ui){

			if(startingList.attr("id") == $(ui.item).parent().attr("id") ) {
				// At this point, we've dropped it on the original list.
				//  Remove the clone we made.
				saveMe.remove();
			} 
			else { //DROP Widget         	
				// this can be done either here, or in the remove() func.
				//  I'm thinking this is more intuitive than to re-display
				//  the item in the remove func.
				saveMe.show();

				if (widgetElt) {
					$(ui.item).replaceWith(widgetElt);  
					//Get group elt id if exists
					var gpEltId;
					var oWdt = document.getElementById(eltId);
					if (oWdt) {
						var pWidt = oWdt.parentNode.parentNode;
						if (pWidt.className.indexOf("widgetContainer")>=0) {
							gpEltId = pWidt.id; 
						}
					}

					name = name.replace(/[\n\t\r]/g,"");
					_oSelectedView.dropWidget(eltId, wdtId, name, gpEltId); 
					if (wdtId != _EMPTY_WDT_ID) {
						refreshWidget(eltId);
					}
				}
				else //Cancel drop
					$(ui.item).remove();
			}
			$("#wrapper").css("pointer", "default");
		}
	}).disableSelection();
}

/** --------------------------------------
 * Edit Panel Title (Group & Widget name)
 *  
 * @param panelHeading
 * @param bIsGroup
 */
function panelEditHeader(panelHeading, bIsGroup) {
	var panel = panelHeading.parent();

	var head = (bIsGroup ? "-head" : "");

	//Get the panel title
	var panelTitle = $(panelHeading.children()[0]);
	var currentLabel = panelTitle.attr("title");

	var wIdt = panel.attr("for");
	var id 	 = panel.attr("id");

	var lastView = "";
	var oWdt 	 = null;
	if (!bIsGroup) {
		oWdt = _oSelectedView.getWidget(id)
		if (oWdt) {
			lastView = oWdt.view;
			currentLabel = oWdt.label;
		}
	}
	var lastColor = panel.attr("class");
	var bHasUpdate = false;

	//----------------------------------------
	//	 Create toggle Panel
	//---------------------------------------
	if (!panel.find('.panel-colorbox'+head).length) {

		//Append edit box
		var editBox = '<input type="text" class="form-control" value="'+currentLabel+'">';
		if (!bIsGroup) {
			
			var viewOptions = ''; 
			var list  = _VIEW_TYPE;
			if (oWdt.type == "chart") list =  _CHART_TYPE; 
			
			$.each(list, function(x, lst) {
				viewOptions  += '  <option value="'+lst+'" '+ (lastView==lst ? "selected" : "") + '>    '+lst+'</option>';
			}); 
			
			editBox += '<select class="form-control" style="text-align:center;">' 
				+ '  <option disabled>Select View look</option>' 
				+ viewOptions
				+ '</select>';
		}

		var colorBox = '<div class="panel-colorbox'+head+'">' + editBox
		+ '<span class="bg-white" 	data-panel-color="panel-default"></span>'
		//+ '<span class="bg-primary" data-panel-color="panel-primary"></span>'
		+ '<span class="bg-info" 	data-panel-color="panel-primary"></span>'
		+ '<span class="bg-success" data-panel-color="panel-success"></span>'	
		+ '<span class="bg-warning" data-panel-color="panel-warning"></span>'
		+ '<span class="bg-danger" 	data-panel-color="panel-danger"></span>'
		+ '<span class="bg-company" data-panel-color="panel-company"></span>'
		+ '<span class="bg-dark" 	data-panel-color="panel-dark"></span>'  
		+ '</div>';

		//Create panel color box
		panelHeading.after(colorBox);
	}

	var panelColorBox = panel.find('.panel-colorbox'+head);

	//---------- CLICK ON COLOR ----------------------
	panelColorBox.on('click', '> span', function (e) {
		var curSkin = _SETTINGS.skin;
		var dataColor = $(this).data('panel-color'); 

		if (curSkin == "s-skin-0" ||curSkin == "s-skin-3") {
			if (dataColor == "panel-success") 
				dataColor = "panel-primary";
			else if (dataColor == "panel-primary") 
				dataColor = "panel-info";
		}
		else {
			if (dataColor == "panel-success") 
				dataColor = "panel-info";
		}

		var altColors = 'panel-default panel-primary panel-info panel-success panel-warning'
			+ ' panel-danger panel-company panel-dark'
			+ ' panel-alert panel-system panel-white'; 
		panel.removeClass(altColors).addClass(dataColor).data('panel-color', dataColor); 

		//Update view setting
		_oSelectedView.updateContent(id, "color", dataColor); 

		//Save update
		bHasUpdate = (lastColor.indexOf(dataColor)<0);
	});

	//---------- Show hide Panel ------------------
	panelColorBox.slideToggle('fast', function () {

		panelHeading.toggleClass('panel-colorbox-open');

		//----------------------------
		// Click on floppy  icon (save)
		//------------------------------
		if (!panelHeading.hasClass('panel-colorbox-open')) {

			var editedVal = panelColorBox.children('input').val();
			editedVal = cleanText(editedVal);

			if (editedVal!="" && currentLabel!=editedVal) {
				//panelTitle.text(editedVal);
				panelTitle.attr("title", editedVal);
				var shtm = panelTitle.html().replace(currentLabel, shortText(editedVal));
				panelTitle.html(shtm);

				//Update view content
				_oSelectedView.updateContent(id, (bIsGroup ? "group" : "label"), editedVal);
				bHasUpdate = true;
			}

			//Get View select
			if (!bIsGroup) { 
				var newView = panelColorBox.children('select').val();
				if (newView && newView != lastView) { 
					//Update view content
					_oSelectedView.updateContent(id, "view", newView);

					//Reload view 
					$("#"+id+" .ibox-content").html('<i class="fa fa-spinner fa-spin"></i>');
					
					//Update Presentation (Grid , Link,  List) 
					if (oWdt.type == "chart")
						_oSelectedView.draw(id, newView);
					else
						_oSelectedView.htmlContent(id, newView);
					
					bHasUpdate = true;
				}
			}

			if (bHasUpdate) _oSelectedView.flagChange(); 
		}
	});
}

/** ---------------------------------------
 * Create a Group htm 
 * @param id
 * @param jwidt
 * @param hWidgets
 * @returns {String}
 */
function getGroup(id, jwidt, hWidgets) {
	if (!hWidgets) hWidgets = "";

	var groupName = jwidt.group;  
	var dOpt = jwidt.options;

	var gpPanelColor = "panel-default";
	if (dOpt) {
		gpPanelColor = dOpt["color"];
	}

	//Update view
	_oSelectedView.linkToContent(id, jwidt);

	return createGroupElement(id, groupName, gpPanelColor, hWidgets);
}

/**
 * Get an html group box
 * @param id
 * @param groupName
 * @param gpPanelColor
 * @param hWidgets
 * @returns {String}
 */
function createGroupElement(id, groupName, gpPanelColor, hWidgets) {
	var gpHtml = 
		'<div id="'+id+'" class="panel '+gpPanelColor+' ibox sortable-item widgetContainer" '
		 + ' onmouseup="mouseUp(event)" onmousedown="mouseDown(event)">'
			+ '<div class="panel-heading column">'
				+ '<span class="panel-title" title="'+groupName+'">'+ shortText(groupName) + '</span>'
				+ '<span class="panel-controls" style="letter-spacing: 0.2px;">' 
					+ '<a href="" class="panel-control-collapse" title="Collapse the group"></a>'
		;
	
	if ( isUserAdmin() || !isSharedView() ) { //TODO Handle Save Sgared view by admin
		gpHtml += '<a href="" class="panel-control-color" title="Custom the group color"></a>';
		gpHtml += '<a href="" class="panel-control-remove" title="Remove entire group"></a>';
	}
	
	gpHtml += '</span>'
		   + '</div>' 
		   + '<div class="ibox sortable-list ui-sortable">'+ hWidgets+ '</div>'
		   + '</div>'; 
	
	return gpHtml;
}

/**-----------------------------------------------------
 * Hide all panel (widget) refresh during updating
 * @param b
 */
function hideSpinners(bHide) {
	$(".panel-control-refresh").each(function(ix) {
		if (bHide) {
			$(this).hide();
		} else {
			$(this).show();
		}
	});
//	if (bHide)
//	$(".panel-control-refresh").addClass("fa-spin");
//	else
//	$(".panel-control-refresh").removeClass("fa-spin");
}

/**-----------------------------------------------------
 * Get empty box
 * @returns {String}
 */
function emptyBox() {
	if (isSharedView()) return "";
	return '<div class="panel panel-default emptyBox" draggable="false" style="border:none">' 
	+ '<div class="btn-group newGroup" role="group" title="Add new group" draggable="false">'
	+ '<button type="button" class="btn"><i class="fa fa-plus"></i> GROUP</button>' 
	+ '</div>'
	+ '<div class="btn-group newWidget" role="group" title="Add wew widget">'
	+ '<button type="button" class="btn"><i class="fa fa-plus"></i> WIDGET</button>' 
	+ '</div>'
	+ '</div>'
	;
} 


/** ------------------------------------------
 * Load a widget data
 * @param domId
 */
function refreshWidget(domId) {
	//Get study
//	var study = getStudy(true); 
//	if (study) //Load data
		__launchSearch(domId);	
}

/** ---------------------------------------
 * 			TIMER/REFRESH HANDLE
 *--------------------------------------- 
 */
var _TIMEOUT 	  = null; 
var _IS_INTERRUPT = false;

/**
 * Refresh all widget of the selected view 
 */
function __loadView() {
	
	//Don't allow to refresh view if busy
	if (isBusy()) {
		console.log("BUSY .....");
		return;
	}
	
	//Check study
	if ( !getStudy(true) ) return;
	if ( !_oSelectedView.hasContent()) return;
	
	//Clear interrupt
	_IS_INTERRUPT = false;
 
	//Hide button refresh 
	$('#refresh').show(); 
	$('#refresh').addClass("fa-spin"); //faire tourner
 
	var startTime = (new Date()).getTime();
	
	var endLoadingView = function() {  
		if (!_IS_INTERRUPT) {
			var endTime = (new Date()).getTime();
			var ts = " (" + ((endTime - startTime)/1000)  + " s)";
			console.log("__ End loading view: " + _oSelectedView.name() + ts + " __");
		}
		
		//Restore defaults icons
		restoreIcons();  
			
		//Relaunch if has timer
		if (_B_REFRESH_AUTO) {
			var timerMillis = parseInt(_SETTINGS["RefreshInterval"], 10) * 1000; 
			console.log("=> Launch next timer, in " + (timerMillis/1000) + " s");
			_TIMEOUT = setTimeout(function(){ __loadView(); }, timerMillis);
		}
	}
	
	//Load SYNC
//	if (_SERV_PATH.indexOf("client")>=0)
//		SynchroneSearch(endLoadingView);
//	else //Load ASYNC 
	AsyncSearch(endLoadingView); 
}

/**
 * ASYNCHRONE Launch
 * @param endCallback
 */
function AsyncSearch(endCallback) {
	console.log("ASYNCHRONE Launch ....");  
	var nbWidget = $('.ibox.float-e-margins.sortable-item').length; 
	$('.ibox.float-e-margins.sortable-item').each(function(i, elt) {
		nbWidget--;
		var domId = elt.id;  
		if (nbWidget<=0 || _IS_INTERRUPT) {
			__launchSearch(domId, endCallback); 
		} else {
			__launchSearch(domId);
		} 
	});	
}

/**
 * Launch SYNCHRONE  
 * @param endCallback
 */
function SynchroneSearch(endCallback) {
	console.log("SYNCHRONE Launch ....");  
	
	var tabWidget = new Array();
	$('.ibox.float-e-margins.sortable-item').each(function(i, elt) {
		tabWidget.push(elt.id);

		if (_TIMEOUT != null) $('#'+elt.id).css( 'cursor', 'wait' );
		$("#"+elt.id+" .ibox-content").html('   Waiting to launch ...');
 
	});
	
	var syncCallback = function() { 
		if (_IS_INTERRUPT || tabWidget.length==0) 
			endCallback();
		else {
			domId = tabWidget.shift();
			__launchSearch(domId, syncCallback); 
		}
	};
	
	var domId = tabWidget.shift();
	 __launchSearch(domId, syncCallback);
} 

/**
 * Timer ON : when click on launch
 */
function timerON() {	
	console.log("TIMER ON ..."); 
	
	_B_REFRESH_AUTO = true; 

	if (_TIMEOUT) {
		clearTimeout(_TIMEOUT);
	}
	
	//REFRESH THE VIEW if not busy  
	__loadView();
 
	//Launch menu auto
	_oAppScope.refreshMenus();
	
	//Spin setting icons 
	$(".fa.fa-cogs").addClass( "fa-spin");
}

/**
 * Stop timer
 */
function timerOFF() {  
	_B_REFRESH_AUTO = false;
  
	console.log("TIMER OFF ...");  
	if (_TIMEOUT) {
		clearTimeout(_TIMEOUT);
	}
	_TIMEOUT = null;
 
	if (_oSelectedView && _oSelectedView.hasContent()) {
		$('#refresh').removeClass("fa-spin");
		$('#refresh').show(); 
	}
	else
		$('#refresh').hide(); 
	
	$(".fa.fa-cogs").removeClass( "fa-spin");
}

/**
 * End loading data properly
 */
function restoreIcons() {
	//console.log("Restore icons (" + _B_REFRESH_AUTO + ")");
	
	//Stop propagation
	_IS_INTERRUPT = false;

	//Hide spinners
	hideSpinners();

	//Stop refreshing
	$('#refresh').removeClass("fa-spin");
	$('#refresh').hide(); 
	
	if (!_B_REFRESH_AUTO && _oSelectedView && _oSelectedView.hasContent()) {
		$('#refresh').removeClass("fa-spin");
		$('#refresh').show(); 
	} 

	//Set deafult Cursors of widgets
	$('.ibox.float-e-margins.sortable-item').css('cursor', 'default');

	//End wait for all
	$('#rowContainer').fadeTo('slow', 1);
}
 
//---------------------------------------------------
// Variables to hadle xhr request busy
// ---------------------------------------------------
var _XHR_BUSY    = {};
/**
 * 
 */
function stopRequest() {
	$.each(_XHR_BUSY, function(idx, xhr) {
		if (xhr)
			try {xhr.abort(); } catch(err){}
	});
	_XHR_BUSY  = {};
}

/**
 * 
 * @returns {Boolean}
 */
function isBusy() {
	return (Object.keys(_XHR_BUSY).length>0);
}

/**
 * Load a view and Contruct Selected view
 * @param oView
 */
function loadSelectedView(oView, bFirst) { 

	if (!oView) {  
		toastr.warning("Invalid selected view, no id found!");
		return;
	}
	
	//Get last selected view Id
	var lastSelectedViewId = (_oSelectedView ? _oSelectedView._id : "");
 
	//Stop all launched 
	if (isBusy()) { 
		if (lastSelectedViewId != oView._id) {
			//Block other request to switch view
			_IS_INTERRUPT = true; 
			
			//Stop All requests
			stopRequest(); 
			
			//Restores icons
			restoreIcons();
		}
		else return; //Keep going
	} 
	 
	console.log("\n======== Select View : " + oView._id + " =======");
	
	//Activate Menu Item by angular 
	_oAppScope.selectView(oView); 
	 
	//Start new Xhrs
	_XHR_BUSY = {};

	//For shared view : Disable save/rename + hide save icon
	if (!isUserAdmin() && isSharedView()) {
		$(".noDefault").hide();
	}
	else {
		$(".noDefault").show();
	}

	// Get/Set the study of the view

	
	//UPDATE View SETTING
	if (!bFirst && lastSelectedViewId != _oSelectedView._id) {
		updateSettings("SelectedView", _oSelectedView._id);
	}

	//===> If Create New view
	if (! _oSelectedView.hasData()) {
		//keep current study
		for (var j=0; j<3; j++) {
			$("#column-"+j).html(emptyBox());
		}
		//Hide spinner
		restoreIcons();
		return;
	}

	//	Load view
	console.log("_ View name : " + _oSelectedView.name());
	//	Clear all columns 
	for (var j=0; j<3; j++) {
		$("#column-"+j).html('');
	}

	//	Construct the new page
	$.each(_oSelectedView._tcontent, function(i, jwidt){	
		var colContent = ""; 
		var colNum = ""+(i%3);

		//		If has group
		if (jwidt.group) { 
			//Get all widgets of the group
			var widgets = jwidt.widgets;
			var htmWdt = "";
			$.each(widgets, function(j, dCurWdgt){ 
				htmWdt += _oSelectedView.getWidgetElt(dCurWdgt);
			}); 

			var id = jwidt.id;
			if (id===null || (typeof id) === "undefined")
				id = uniqId();

			// Construct the html group with all widget contens
			if (jwidt.column) colNum = jwidt.column;
			colContent = getGroup(id, jwidt, htmWdt);			
		}
		else { //- If Widget only 
			if (jwidt.column) colNum = jwidt.column;
			colContent = _oSelectedView.getWidgetElt(jwidt);
		}

		// Append to column
		var colId = "#column-" + colNum;
		$(colId).append(colContent);
	});

	// Append empty boxes
	for (var j=0; j<3; j++) {
		$("#column-"+j).append(emptyBox());
	} 

	// Connect all draggables
	connectSortable();

	//Refresh view first
	//If auto launch interval
	if (_B_REFRESH_AUTO) {
		timerON();
	} 	
	else {
		timerOFF();
		__loadView();
	}
}

/**
 * Change timer select
 * @param value
 */
function changeTime(value) {
	updateSettings("RefreshInterval", (""+value)); 
}

/**---------------------------------------
 * Load Widget data 
 * ---------------------------------------*/  
/**
 * SEARCH
 * @param domId
 * @param callbackFunc
 */
function __launchSearch(domId, callbackFunc) {

	//if stopped
	if (_IS_INTERRUPT) { 
		if (callbackFunc) callbackFunc();
		return;
	}

	//The div element id
	var id  = "#"+domId;  
	var cid = id + " .ibox-content";
	
	//The widget id (the name of the widget from json)
	var wdtId = $(id).attr("for");
	var wdtName = $( id + " h5").text();

	//Get/Create the widget object
	var oWdtg = _oSelectedView.getWidget(domId);

	//If the object was not exists, or not specified
	if (!oWdtg || !hasValue(oWdtg.search)) {
		//Write error 
		var wdtContent = '[Unknown specification]';
		var errMessage = "This widget don't have a specification !"; 
		
		//If New widget
		if (wdtId == _EMPTY_WDT_ID) {
			wdtContent = '[Need to specify]';
			errMessage = "This widget is empty,<br>Please, edit its specification before";
		}
		else if (!oWdtg) 
			errMessage = "The widget template : " + wdtId + " was not found !";

		//Update content
		$(cid).html('<i>'+ wdtContent + '</i>');
		$(id).css( 'cursor', 'default' );

		if (callbackFunc) {
			callbackFunc();
		}
		
		//Break
		return;
	}

	//WAIT Cursors
	$(id).css( "cursor", "wait" );
	$(id + " .nbElt").hide();

	//Hide spinner
	$(id + " .panel-control-refresh").hide();

	//Wait spinner only for manual refresh
	if (_TIMEOUT == null) {
		$(cid).html('<i class="fa fa-spinner fa-spin"></i>'); 
	}

	//Find root param: set to study, by default
	var curStudy = getStudy();

	var sUrl = SEARCH_URL();
	//console.log("Call " + sUrl); 
	var dParam 			= {};   
	dParam["study"] 	= curStudy;
	dParam["logStr"]	= _oAppScope._logStr; 
	dParam["sessionId"] = _oAppScope._sessionId; 
	
	var dSearch 	= oWdtg.search;
	dParam["data"]	= angular.toJson(dSearch, 4);
	
	// ---------------------------
	// 		CALL NEXT search
	// ---------------------------
	var endSearchCallBack = function(domId) {
		delete _XHR_BUSY[domId];
		
		$(id).css('cursor', 'default');
		$(id + ' .panel-control-refresh').show();

		if (callbackFunc) callbackFunc();
	}

	// -----------------------------
	// Launch SEARCH
	// ----------------------------- 
	var NB_RELAUNCH = 2;
	var search = function() {
		var xhr = $.get(sUrl, dParam, function(tdata) { 	
			console.log( "  -> End! " + wdtId + " (" + wdtName + ")");
	
			// ---------------------------
			// 		SHOW RESULT
			// ---------------------------
			try {
				//Update only if datas was changed, or if update manualy
				if (oWdtg.type == "chart") {
					_oSelectedView.draw(domId, oWdtg.view, tdata);
				}
				else if ( $(cid).html().indexOf("<i")>=0 
							|| _oSelectedView.isContentChange(domId, tdata) ) {
					_oSelectedView.htmlContent(domId, oWdtg.view, tdata);
				} 
				else console.log("\t" + wdtId + " -> No updates !");
			}
			catch(ex) { 
				console.log("\t" + wdtId + " -> " + ex.message);
				$(cid).html("Malformed result: " + oWdtg.type + " <br> " + ex.message);
			}
	
			//Call Next
			endSearchCallBack(domId); 
	
		}).fail(function(err) { //err, xhr, opt){  
			//var sError = JSON.stringify(err.responseText);	
			if (err.statusText != "abort") {
				var sErr =  ""+err.responseText;
	
				var z = sErr.lastIndexOf("<h1>");
				var w = sErr.lastIndexOf("</h1>");
				console.log("\t" + wdtId + " -> FAILED !" + sErr.substring(z+4, w));
				$(cid).html("Failed: " + err.statusText); 
				
				NB_RELAUNCH --;
				if (NB_RELAUNCH>=0 && sErr.indexOf("Unable to parse multistatus")>=0) 
					_XHR_BUSY[domId] = search();
				else
					endSearchCallBack(domId);
			}
		}); 
		 return xhr;
	 }
	 //SEARCH
	 _XHR_BUSY[domId] = search(); 
}

/**==================================================================
 * 
 * 				EVENTS
 * 
=================================================================== */
/**---------------------------------------
 * CREATE New VIEW
*/
function EventViewNew() {}
$('.newView').click(function(e) {
	e.stopPropagation(); 
	e.preventDefault();
	viewCreateNew();
});

/**---------------------------------------
 * Click on VIEW CHANGE
--------------------------------------- */
function EventViewChange(){};
$(document).delegate( '#collapseView li a, #defaultView li a', 'click', function (e) {
	e.preventDefault();
 
	var $this  = $(this);
	var viewId = $(this).attr("id");

	//-----------------------------
	// Loading New the view
	//-----------------------------
	var loadNewViewCallback = function (bOk) {  
 
		//- LOAD the new VIEW   
		var oView = _oAppScope.createView(viewId);
		loadSelectedView(oView);  
		
		////Reset flag 
		oView.flagChange(true); 

	}//end function

	//If last view was not updated
	if (!_oSelectedView || !_oSelectedView._wasChanged || _oSelectedView._id == viewId ) {
		loadNewViewCallback();
		return;
	}

	//Check if last view was updated
	bootbox.dialog({
		message:  "The previous view has unsaved update.<br>"
				+ "<span style='font-size:14px;'>Save it before switch view ?</span>",
			//title: "Save changed view",
			buttons: {
				cancel: { 
					label: "No"
						, className: "btn-default" 
							, callback: function() { 
								loadNewViewCallback();
							}
				},
				main: {
					label: "OK",
					className: "btn-primary",
					callback: function() {
						//Save the view before and load it
						viewSave(loadNewViewCallback); 
					}
				}
			}
	});//end bootbox
});

/**-------------------------------------------------
 * Delete/Remove View/Personal widget from VIEWS
*/
function EventMenuTrash(){}; function EventWidgetTrash(){}; function EventViewTrash(){};

$(document).delegate('.fa.fa-trash-o', 'click', function (e) {
	e.preventDefault();
	e.stopPropagation();

	var $li = $(this).closest("li");
	//var $li = $(this).parent().parent();
	
	var label = cleanText($(this).parent().text()); 
	var bDeleteWidget = $li.hasClass("sortable-item");
	var wdtId 		  = $li.attr("id");
	var viewId		  = $(this).parent().attr("id");
 	
	//---- Delete function callback ----
	var sMessage = "Removing " + (bDeleteWidget ? "widget : " : "view : " ) + label; 
	function proceedDeleting() {
		bootbox.confirm({ size:"small", title: sMessage, message: "Are You Sure ?", callback: function(bOk) {
			if (bOk) {
				//---
				//Remove personal widget
				//---
				if (bDeleteWidget) { //Remove left widget
					widgetMenuRemove(wdtId);	    		
				}
				//---
				// Remove shared view
				//---
				else if ($li.parent().attr("id") == "defaultView") { 
					viewRemoveShared(viewId);
				}
				//---
				// //Remove personnal view
				//---
				else { 
					//Get view index
					viewRemovePersonal(viewId);
				} 
				
				//Securite
				$li.remove();
			} 
		}});
	} //end delete normally

	//----------
	// Delete view
	//---------
	if (!bDeleteWidget) 
		proceedDeleting();
	
	else { 	
		//----------
		// Delete menu widget
		//---------
		//Check if widget is used by view  
		var tViews = _oAppScope._personalViews;
		if (JSON.stringify(tViews).indexOf("\""+wdtId+"\"")<0) 
			proceedDeleting();

		else {  
			bootbox.dialog({ title : "WARNING !"
				, message:  "This widget is used by other view(s)<br></br>Do you want to ?"
				, buttons: {
					success : { 
						label: "Keep them"
						, className: "btn-primary" 
						, callback: function() {  
							widgetMenuRemove(wdtId); 
						}
					},
					main: {
						label: "Remove all",
						className: "btn-danger",
						callback: function() { 
							viewUpdateAllWidget(wdtId, true);  
						}
					}
					, cancel: { label: "Cancel" 
						, className:  "btn-default"
							, callback : function() {}
					}
				}
			});//end bootbox
		}
	}

});

//--------------------------------------------------------------
//	Menu VIEW Edit/Update Personal Widget
function EventWidgetPersonalClick(){}; 
//--------------------------------------------------------------
$(document).delegate('#personalWdt .widgetLabel', 'click', function (e) {
	e.preventDefault();
	var liParent = $(this).closest("li");

	//	Get the widget name id
	var oldId 	 = liParent.attr("id");
	var oldWdt 	 = _oAppScope.getPersonalWidget(oldId);
	if (!oldWdt) return;
	var oldSearch = $.extend(true, {}, oldWdt.search);
	
	//Callback after save
	widgetEdit(oldWdt, "", function(dNewWgt, bChangeSearch) {
		 
		if (!dNewWgt) return;
		 
		if (!bChangeSearch) {
			savePersonalWidget(dNewWgt);
		} 
		else if (JSON.stringify(_oAppScope._personalViews).indexOf("\""+oldId+"\"")<0) //Personal view
			savePersonalWidget(dNewWgt);
		else { 
			//
			// Kill switch : give possibility to update all personal, ou pas
			//
			bootbox.confirm({
				message :  "<h4>This widget is used by existing view(s)"
						 + "<br>They will be updated to</h4><br><br>Continue ?",		
				callback: function(OK) {
					if (OK) {
						//Update all & save & reload
						updateWidgetsOfViews(oldId, dNewWgt); 
					}
					else {
						//Cancel Update => Restore back
						dNewWgt.search = oldSearch;
						toastr.info("Update cancelled !");
					}
				} //end callback function
			});
		}  
	});//end widgetEdit

});

/** ---------------------------
 * Handle Icons panel controls
 * -----------------------------
 */
function EventControlToggle(){}
$(document).delegate('.panel-heading.ibox-title, .panel-heading.column', 'click', function (e) {
	e.preventDefault(); 
	togglePanel( $(this).parent()); 
});

/**---------------------------
 *  WIDGET icons clicks
 */
function EventControlClick(){}
$(document).delegate('.panel-controls a', 'click', function (e) {
	e.stopPropagation();
	e.preventDefault(); 

	var panelHeading = $(this).closest('div');
	var panel 		 = panelHeading.parent();

	//	Check if is group panel
	var bIsGroup = panel.hasClass("widgetContainer");

	//Get title dom
	var panelTitle = $(panelHeading.children()[0]);
	var sTitle = (bIsGroup ? "group" : "widget") + " : " + panelTitle.attr("title");
		
	var wdgtId 	 = panel.attr("for");
	var domId 	 = panel.attr("id"); 
	var bIsNew	 = (!wdgtId || wdgtId == _EMPTY_WDT_ID);

	var action = $(this).attr('class');
	switch(action) {
	case 'panel-control-collapse':
		togglePanel(panel);
		break;

	case 'panel-control-refresh':  
		if (!bIsNew) refreshWidget(domId); 
		break;

	case 'panel-control-title':  
	case 'panel-control-color':
		panelEditHeader(panelHeading, bIsGroup);
		break;

	case 'panel-control-share': 
		if (!bIsGroup && !bIsNew) //Only share widget
			widgetShare(panel);
		break;
		
	case 'panel-control-personal': 
		if (!bIsNew) {
			var dWdt	= _oSelectedView.getWidget(domId);
			if (dWdt) { 
				//Ask for a name ??
				bootbox.prompt({ size: "small" 
					, title : "Give the personal widget name"
					, value : dWdt.label
					, callback: function(newlabel) {
						if (!newlabel || newlabel.trim()== "") return true;
						var oldLabel = dWdt.label;
						
						dWdt.label = newlabel;
						widgetSaveToPersonal(dWdt, function(w, bOk) {
							//Restore current label if failed
							if (!bOk)  //Failed
								dWdt.label = oldLabel;
							else {
								//Rename the widget title name
								panelTitle.text(newlabel);
								panelTitle.attr("title", newlabel);
								_oSelectedView.flagChange();
							}
						});
					}
				}); 
			} 
		}
		break;
		
	case 'view-only panel-control-setting':
	case 'panel-control-setting':
		if ( !bIsGroup) {
			
			var wdtLabel = panelTitle.attr("title");	 
			var dWtd 	 = _oSelectedView.getWidget(domId);
			var oldType  = dWtd.type;
			var wIdt 	 = dWtd.id;

			//------------------------
			//	After update callback
			//------------------------
			widgetEdit(dWtd, domId, function(dUpWdt, bChangeSearch) {

				if (!dUpWdt) return;
				 
				var newName = dUpWdt.label;
				if (newName != wdtLabel) {
					panelTitle.attr("title", newName); 
					//Preserve count label
					var shtm = panelTitle.html().replace(wdtLabel, shortText(newName));
					panelTitle.html(shtm);
				}
				  
				//Set new Id
				var newId = dUpWdt.id; 
				panel.attr("for", newId); 
				
				//Id was changed only if change 
				if (newId != wIdt) {
					//Change view content
					_oSelectedView.updateWdtDomLink(domId, dUpWdt); 
					
					//Show personal icon
					if (isPersonal(wIdt)) {
						togglePersonalIcon(newId, true);
					}
				}
				else {
					_oSelectedView.flagChange();
				}
				
				//Save current the view, if flag change
				_oSelectedView.store();

				//Reload datas content
				if (bChangeSearch) {
					refreshWidget(domId);
				} 
			});
		}  
		break;

	case 'panel-control-remove':
		bootbox.confirm({size: "small", 
			title: "Remove " + sTitle
			, message : "Are You Sure ?!", callback: function(ok) {
				if (ok) { 
					//Update view 
					panel.remove(); 
					_oSelectedView.deleteDomFrom(domId);
				} 
			}}); 
		break;

	default: 
		break;
	} 
});

/**--------------------------------------------------------------
 	Left bar MENU Widget
----------------------------------------------------------------*/
/** Left bar COMMON widget click */
function EventWidgetCommonClick(){}
$(document).delegate('#defaultWdt .dWidgetLabel', 'click', function (e) {
	e.preventDefault();
	e.stopPropagation();
	 
	var liParent = $(this).closest("li");
	var initId 	= liParent.attr("id");
	var dWdt 	= _oAppScope.getCommonWidget(initId);
	if (!dWdt) return;

	//var initlabel = dWdt.label;
	var canEditCommon = (isCommon(initId) && isUserAdmin());
	
	//Call edit widget
	widgetEdit(dWdt, "",  function(dNewWdt, bChangeSearch) {
			
		if (!dNewWdt || !canEditCommon) return;

		//Duplicate _commonWidgets
		var dCommonWdt = $.extend(true, {}, _oAppScope._commonWidgets);
		
		var found =  false;
		for (var i=0; i<dCommonWdt.widgets.length; i++) {
			var wdt = dCommonWdt.widgets[i];
			
			//Replace by new widget
			if (wdt.id == initId) {
				dCommonWdt.widgets[i] = dNewWdt;
				found = true;
				break;
			}
		}
		//Append if not found
		if (!found)  {
			toastr.warning("Common widget not found !");
			return; //!!! NEVER ADD Unknown, only add from share
		} 

		//-
		//- Save the common widget
		//-
		SaveFile(_oAppScope._project + "/" + _SHARED_WDT_FILE, dCommonWdt, function(bOk) {
				if (bOk) { 
					//Update angular view
					_oAppScope._commonWidgets = dCommonWdt;
					
				    //Refresh Angular view
				    _oAppScope.$apply();
					
					//If search was changed -> refresh all box if exist
					if (_oSelectedView && bChangeSearch) {
						var tIds = _oSelectedView.getComponentIds(initId); 
						if (tIds)  {
							for (var i=0; i<tIds.length; i++) {
								refreshWidget(tIds[i]);
							}
						}
					}
				} 
		   }//end function
		);//end SaveFile
		
	}); //end widgetEdit & function
 
}); 

/** ---------------------------------
 * TOGGLE WIDGET Menu : handle accordion 
 -----------------------------------*/
$('.femWidget a .nav-label, .views a .nav-label' ).click(function(e) {
	e.preventDefault(); 
	var $parent = $(this).closest("li");

	if ( $parent.hasClass("active")) {
		$parent.removeClass("active");
	}
	else {
		$parent.addClass("active");
	}

//	//Collapse other
//	var myId = $(".collapse", $parent).attr("id");
//	$(".femWidget ul").each(function() {
//	var id = $(this).attr("id");
//	if (id != myId)
//	$(this).removeClass("in");
//	});
});

function togglePanel(panel)  {
	panel.toggleClass('panel-collapsed');
	panel.children('.ibox, .ibox-content, .slimScrollDiv, .panel-footer').slideToggle('fast', function () {
		console.log('callback:', 'Toggle');
	});
}

/**---------------------------------------
 * CREATE NEW GROUP
 * ---------------------------------------*/ 
function EventGroupCreate(){}
$(document).delegate('.newGroup, .emptyColumn', 'click', function (e) {
	e.preventDefault(); 
	var elt = $(this).parent(); 
	bootbox.prompt( { size: "small"
		, title: "Name of the new group ?"
			, callback : function(groupName) { 
				//Toggle 
				if (groupName !== null && groupName.trim() !== "") { 
					var gpId = uniqId();
					var sGroupHtm = createGroupElement( gpId, groupName, "panel-default", "");

					elt.before( sGroupHtm );
					connectSortable(); 

					//Add group to view
					_oSelectedView.addGroup(gpId, groupName);
				}//end  
			}//end function
	}); //end bootbox	
});

/**---------------------------------------
 * NEW WIDGET 
 * ---------------------------------------*/ 
function EventWidgetNew(){}
$(document).delegate('.newWidget, .emptyColumn', 'click', function (e) {
	e.preventDefault();
	var colParent = $(this).parent(); 

	var wdtLabel = "New Widget";
	var eltId = uniqId();
	var widgetElt = widgetHTML(wdtLabel, _EMPTY_WDT_ID, eltId, "default-color");

	colParent.before( widgetElt );
	connectSortable(); 

	_oSelectedView.dropWidget(eltId, _EMPTY_WDT_ID, wdtLabel); 
});


/** ----------------------------------------
 * Change STUDY click
 ------------------------------------------*/ 
function EventStudyChange(){};
$(document).delegate(".studies a", "click", function(e) {
	e.preventDefault();
  
	if (!_oSelectedView) return;
	 
	var newStudy = cleanText($(this).text()); 
	$("#study").text(newStudy);
	
	var curStudy = _oSelectedView.study();
	if (curStudy !== newStudy) {
		_oSelectedView.updateStudy(newStudy);
		__loadView();
	} 
});

/**---------------------------------------
 *  RUN after ready
 * ---------------------------------------*/
var EventsAfterReady = function() {

	//Set sdma angular 
	if (!_oAppScope)_oAppScope = angular.element(document.body).scope();
 
	//----------------------------
	// Click on save view icon
	//----------------------------
	$("#saveView").click(function() { 
		viewSave();
	});
	
	//----------------------------
	//Click on refresh All
	//----------------------------
	$("#refresh").click(function() { 
		if ( !$(this).hasClass("fa-spin") ) {
			//console.log("\nCall Refresh view ...");
			__loadView();
		}
	}); 
	
	//--------------------------------
	// Toggle Timer setting
	//--------------------------------
	$('#ontimer').click(function() {
		if ($('#ontimer').is(':checked')) { 
			//Timer ON
			updateSettings("ontimer", "on"); 
			timerON();

		} else { 
			//Timer OFF
			updateSettings("ontimer", 'off');
			timerOFF();
		}
	});  

	//----------------------------
	// Click on setting icon
	//---------------------------- 
	$(".profileSetting").click(function() { 
		editprofile();
	}); 
	
	//----------------------------
	//- HELP
	//----------------------------
	$(".glyhicon.glyphicon-info-sign").click(function() { 
		openHelp();
	})

	//-----------------------------
    // Client/DAO  switch
	//-----------------------------
	$('#onclient').click(function() {
		var state = "off"; 
		if ($('#onclient').is(':checked')) {  
			state = "on";  
			_SERV_PATH = _ROOT + "client/";
		} 
		else {
			_SERV_PATH = _ROOT + "src/";
		}
		console.log("!! SWitch to : " + _SERV_PATH);
		updateSettings("onclient", state); 
		__loadView();
	}); 
	
	//----------------------------
	// ON before Reload page
	//---------------------------- 
	window.onbeforeunload = function(event)
	{ 
		//event.stopPropagation(); event.preventDefault(); 
		
		//Save sessionId 
//		var hashref = "#/"+_oAppScope._sessionId; 
//		hashref += ":" + encodeURIComponent(_oAppScope._logStr);
//		window.location.hash = hashref;
		
		//Stope requests
		stopRequest();
		if (_oSelectedView && _oSelectedView._wasChanged) {
			if (confirm("WARNING: the view has changes.\nSave it, before unloading ?") == true) {
				viewSave();
			}
		} 
	}; 

};//====================================END Study======================================================
