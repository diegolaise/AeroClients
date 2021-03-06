
//========================= ICONS CONSTANTS =========================
var _Circle_Check 	= "fa-check-circle-o";
var _Circle_UnCheck = "fa-circle-o";

var _Square_Check   = "fa-check-square-o";
var _Square_UnCHECK = "fa-square-o";

//============================================================== 
function FUNCTIONS(){}
//============================================================== 
/**
 * Read filtered (checked sqaure values)
 * @param bIsChild : if children
 * @param type : version or extension
 * @returns list of values
 */
function getUnfilteredList(type, bIsChild) {
	var tfilter = [];

	var id = "#"
		if (bIsChild !== undefined) id += (bIsChild ? "c_":"p_") 
		id += type; 

	//Find all checked squares
	$(id).find("."+_Square_UnCHECK).each(function() {
		tfilter.push( $(this).prev().text().trim() );
	});

	return tfilter;
}

/**
 * Toggle all popovers 
 */
function togglePopover() {
	$("#main").find('[data-toggle="popover"]').popover('hide');
}

/**
 * Wait
 * @param b
 */
var _IS_BUSY = false; 
function wait(b) {
	if (b) {
		$('html').removeClass("wait");
		$("#sidebar-wrapper").prop("disabled", false);
		_IS_BUSY = false; 
	}
	else {
		$("#sidebar-wrapper").prop("disabled", true);
		$('html').addClass("wait");
		_IS_BUSY = true;
	} 
}

/**
 * Reorder Level
 * @param iLevel
 */
function reorderLevel(iLevel) {
	var slevel = ""+iLevel; 

	var htab = {};
	$.each(_ELT_BY_COL[slevel], function(i, obj) {
		var top = Math.floor(obj.top());
		htab[top] = obj;
	});
	var newTab = Object.keys(htab);
	newTab.sort();

	var orderedTab = [];
	$.each(newTab, function(i, key) {
		orderedTab.push(htab[key]);
	});
	_ELT_BY_COL[slevel] = orderedTab; 	
}

/**
 * End of draw/close node (show/hide)
 * Make boxes Draggables
 * @param bNoUpdateList
 */
function updateEvents(iLevel) { 
	//if (iLevel) resetPosition(iLevel);

	//Not allow to drag inside entry
	try {
		$(".entry").draggable({drag: function(event, ui){return false;}}); 
	
		$(".ibox-c, .entry-c").draggable({ 
			drag: function(event, ui) { 
				_SVG.redrawLines(); 
			} //drag
			, stop: function(event, ui) {
				_SVG.redrawLines();
	
				//Reorder levels  
				var id = ui.helper[0].id
				var path = $("#"+id).attr("for");
				var oEntry = getEntry(path);
				if (oEntry) {
					reorderLevel(oEntry._iLevel); 
				}
			}//stop
		});  
	}
	catch(err) {
		console.log("Err: Not draggable entry: " + err);
	}

	//- REDRAW
	if ( ! ($graphScope.$$phase) ) {
		$graphScope.$apply(); 
	}
	_SVG.redrawLines();

	//Show popover
//	$('[data-toggle="popover"]').popover(); 

	//- END Wait
	wait(true); 
}

/**
 * TOGGLE ON/OFF
 * @param $this
 * @returns
 */
function toggleOnOff($this) {	
	var bCollapseAll = $this.hasClass('fa-toggle-off');

	$this.addClass( (bCollapseAll ? 'fa-toggle-on' : 'fa-toggle-off'));
	$this.removeClass( (bCollapseAll ? 'fa-toggle-off' : 'fa-toggle-on'));
	return bCollapseAll;
}

function toggleOn($this) {	
	$this.addClass('fa-toggle-on');
	$this.removeClass('fa-toggle-off');
}

function toggleOff($this) {	
	$this.addClass('fa-toggle-off');
	$this.removeClass('fa-toggle-on');
}

/**
 * TOGGLE SQUARE CHECK
 * @param $this
 * @param tLabel
 * @returns
 */
function toggleSquareCheck($this, tLabel) {
	var bToChecked = $this.hasClass(_Square_UnCHECK);

	$this.addClass((bToChecked ? _Square_Check : _Square_UnCHECK));
	$this.removeClass((bToChecked ? _Square_UnCHECK : _Square_Check));

	if (tLabel && tLabel.length>1) {
		var slbl = (bToChecked ? tLabel[0] : tLabel[1]); 

		var $label = $this.prev();
		$label.text(slbl);

		var borl = (bToChecked ? 'red 2px solid' : 'none');
		$this.closest("li").css("border-left", borl);
	}

	//Retrun value
	return bToChecked;
}

/**
 * Update sidebar scrolling
 * @param id
 */
function updateScroll(id) {
	var h = $(window).height()-28;
	$( id + ' #scrollDiv').height(h);
	$( id + ' .slimScrollDiv').height(h);
}

/**
 * CHECK Graph Checkboxes
 * @param id
 * @param cls
 */
function checkAll(id, bIsChild) { 

	var bToChecked = $(id).hasClass(_Square_UnCHECK);

	$(id).addClass((bToChecked ? _Square_Check : _Square_UnCHECK));
	$(id).removeClass((bToChecked ? _Square_UnCHECK : _Square_Check));

	var borl = (bToChecked ? 'red 2px solid' : 'none');
	$(id).closest("li").css("border-left", borl);

	var sfx = "All";
	if (bIsChild !== undefined) sfx = (bIsChild ? " Children" : " Parents");

	var sLabel = (bToChecked ? "Uncheck "+sfx : "Check "+sfx);
	$(id).parent().prev().text(sLabel);

	//- (Un)Check all checkboxes
	var cls = "";
	if (bIsChild !== undefined) cls += (bIsChild ? ".child" : ".ancestr"); 
	$(cls + " input[type='checkbox']").prop("checked", bToChecked);

	//-- Handle hide uncheck
	handleHideUncheckMenu();
}

/**
 * COLLAPSE
 * @param id
 * @param bIsChild
 * @param label
 */
function collapse(id, bIsChild) { 
	var bCollapse = toggleOnOff($(id)); 

	//Collapse all Group
	var cls = ".panel-primary";
	var sfx = "";
	if (bIsChild !== undefined) 
		cls +=  (bIsChild ? ".child" : ".ancestr");
	else
		sfx = " All";

	//- Show All collapsed
	var $pBody = $(cls + " .panel-body");

	if (bCollapse) {
		$pBody.hide();
		$(cls + " .collapseBody").show();
	}
	else {
		$(cls + " .collapseBody").hide();
		$pBody.show();
	}

	var $label = $(id).parent().prev();
	$label.text( (bCollapse ? "Expand"+sfx : "Collapse"+sfx)); 

	//REDRAW
	_SVG.redrawLines(); 
}

/**
 * HIDE/SHOW UNCHEKED 
 * @param id
 * @param cls
 */
function hideUchecked(id, bIsChild) {

	var cls = "";
	if (bIsChild !== undefined) cls +=  (bIsChild ? ".child" : ".ancestr"); 

	//Toggle Show hide
	var tLabel = ["Show Unchecked", "Hide Unchecked"];
	var bHide = toggleSquareCheck($(id), tLabel);

	if (bHide) {
		//Hide entries of not checked cls (parents or children)
		$("input:checkbox:not(:checked)").closest(".entry"+cls).hide();
		$("input:checkbox:not(:checked)").closest(".entry-c"+cls).hide();

		//Hide Empties groups
		$( cls+".ibox .panel-body").each(function() {
			if ( $(this).find(".entry:visible").length == 0) {
				$(this).closest(".panel.ibox").hide();
			}
		});

		//Hide Empties containers
		$( cls+".ibox-c > .panel-body").each(function() {
			if ( $(this).find(".entry:visible").length == 0) {
				$(this).closest(".panel").hide();
			}
		});
	}
	else { 

		$(cls+":not(:visible) input:checkbox:not(:checked)").each(function(){
			var $entry = $(this).closest("div");
			var entry = getEntry($entry.attr("for"));
			if (entry) entry.display();
		}); 

		if (   $(".ancestr").find('input:checkbox:checked').length==0 
				&& $(".child").find('input:checkbox:checked').length==0 ) 
			$("#hideUncheck").hide();
	}

	//---- REDRAW -----
	_SVG.redrawLines(true);
}

/**
 * Handle hide uncheck
 */
function handleHideUncheckMenu() {

	var bExported = false;
	$("#hideUncheck").hide(); 

	var b = false;
	var numUncheckedParent = $(".ancestr").find('input:checkbox:not(:checked)').length;
	if (numUncheckedParent > 0) { 
		//Toggle Off parent Check all 
		$("#chckancestr").addClass(_Square_UnCHECK);
		$("#chckancestr").removeClass(_Square_Check); 
		$("#chckancestr").parent().prev().text("Check Parents");
		b = true;
	}

	var numUncheckedChild  = $(".child").find('input:checkbox:not(:checked)').length;
	if (numUncheckedChild > 0 ) {
		//Toggle Off child Check all
		$("#chckchild").addClass(_Square_UnCHECK);
		$("#chckchild").removeClass(_Square_Check); 
		$("#chckchild").parent().prev().text("Check Children");
		b = true;
	} 

	if (!_IS_HIDDEN_PARENT) {
		if ( $(".ancestr").find('input:checkbox:checked').length >0 ) {
			$("#hideUncheck").show();
			bExported = true;
		} 
	} 
	if (!_IS_HIDDEN_CHILD) {
		if ( $(".child").find('input:checkbox:checked').length>0 ) {
			$("#hideUncheck").show();
			bExported = true;
		}
	}

	var label = $("#hUchk").prev().text();

	if ( label.indexOf("Show")>=0  
			|| (numUncheckedParent == 0 && numUncheckedChild>0) 
			|| (numUncheckedParent > 0 && numUncheckedChild==0) ){
		$("#hideUncheck").show();
	} 

	var $pop = $("#exportedFiles");
	if (bExported) {
		$("#doExporting").removeClass("ic-disabled");
		$("#doExporting").addClass("ic-enabled");
		if (b) $pop.popover("show");
	}
	else {
		$("#doExporting").removeClass("ic-enabled");
		$("#doExporting").addClass("ic-disabled");
		if (b) $pop.popover("hide");
	}
}

/**
 * TOGGLE CHECK ALL ON/OFF  
 * @param id
 */
function toggleCheckboxes(id) { 
	var bToOn = toggleOnOff( $(id) );
	
	if (bToOn) {
		$("input.check").css("display", "block");

		$(".exportItem").show();
		$("#doExporting").removeClass("ic-disabled");
		$("#doExporting").addClass("ic-enabled");

		if (_IS_HIDDEN_PARENT) $(".exportItem.menu-p").hide();
		if (_IS_HIDDEN_CHILD)  $(".exportItem.menu-c").hide();

		//Scroll to bottom
		var bttm = $(".sidebar-nav").outerHeight();
		$('.sidebar-nav').slimScroll({ scrollTo: bttm+'px' });

		//Handle
		handleHideUncheckMenu();		
	}
	else {
		//var bVisible = $("#doExporting").hasClass("ic-enabled"); //$("#doExporting").is(":visible");

		//$("input.check").hide();
		$("input.check").css("display", "none");
		$(".exportItem").hide();

		//if (bVisible) $("#doExporting").show();
	}
}

/**
 * EXPORT FILES
 */
var _SLIDE = false;
function slide(val) { _SLIDE = val; }

function exportFiles() {
	_SLIDE = true;

	if ( $("#doExporting").hasClass("ic-disabled") ) {
		bootbox.alert({ size: "small"
			, title : "Datas Export"
				, message :"Please, select (check) files before exporting !"
					, callback: function(ok) { _SLIDE = false; }
		}); 
		return;
	} 
	var tabExported = [];
	$.each(_INSTANCES, function(key, oEntry) {
		if (oEntry.isVisible()) {
			if (oEntry.isEntry()) { 
				oEntry.readChecked(tabExported);
			}
		}
	});

	if (tabExported.length==0) {
		bootbox.alert({ size: "small"
			, title : "Cannot export data"
				, message :"There was no selected (checked) entry !"
					, callback: function(ok) { _SLIDE = false; }
		}) 
		return;
	}

	bootbox.prompt({ size: "small"
		, title : "Name of the exported file ?"
			, callback: function(fName) {

				_SLIDE = false;

				if (!fName || fName.trim()== "") return true;

				var filename = fName;
				if (filename.indexOf(".json")<0) filename += ".json";

				var wasSavedfunc = function(href) { 
					if (href) {
						//Show link  
						$graphScope.addExported(filename);
						$graphScope.$apply(); 

						//bootbox.alert("Datas was Exported successfully !" );

						if ( !$("#exportedFiles").next().is(':visible') )
							$("#exportedFiles").trigger("click");
					}
				}

				if ( ! $graphScope.exists(filename)) {
					$graphScope.saveExportedFile(filename, tabExported, wasSavedfunc); 
				}
				else {
					bootbox.confirm({ size: "medium"
						, title : "A file named <b>"+fName+"</b> is already exist"
						, message :"<h4>Overwrite it ?</h4>"
							, buttons: {  
								'cancel': {
									label: 'No',
									className: 'btn-primary'
								},
								'confirm': {
									label: 'Yes',
									className: 'btn-danger'
								}
							}
					, callback:  function(ok) {
						if (ok) { 
							$graphScope.saveExportedFile(filename, tabExported, wasSavedfunc);
						}
					}
					}); 
				} 

			}//end bootbox callback func
	}); 
}

/**
 * Zoom
 * @returns {String}
 */ 
var _zInit = 0.1;
var _ZOOM = {
		// zoomed size relative to the container element
		// 0.0-1.0
		targetsize: _zInit, //normal size
		// scale content to screen based on their size
		// "width"|"height"|"both"
		scalemode: "both",
		// animation duration
		duration: 500,
		// easing of animation, similar to css transition params
		// "linear"|"ease"|"ease-in"|"ease-out"|"ease-in-out"|[p1,p2,p3,p4]
		// [p1,p2,p3,p4] refer to cubic-bezier curve params
		easing: "ease",
		// use browser native animation in webkit, provides faster and nicer
		// animations but on some older machines, the content that is zoomed
		// may show up as pixelated.
		nativeanimation: true,
		// root element to zoom relative to
		// (this element needs to be positioned)
		root: $(document.body),
		// show debug points in element corners. helps
		// at debugging when zoomooz positioning fails
		debug: false,
		// this function is called with the element that is zoomed to in this
		// when animation ends
		animationendcallback: null,
		// this specifies, that clicking an element that is zoomed to zooms
		// back out
		closeclick: true
};

function zoom(bPlus) { 
	var pas = 0.02; 
	var z = _ZOOM.targetsize; 

	if (bPlus) {
		z += pas;
		if (z > (_zInit + (4 * pas))) { 
			return; //max reached  
		}
	}
	else {
		z -= pas; 
		if (z < (_zInit - (3 * pas))) return; //min reached 
	}

	//--- ZOOM --
	_ZOOM.targetsize = z;

	$(".panel").zoomTo(_ZOOM); 
}


/**
 * Before filter
 * @param cls
 * @param callback
 */
function beforeFilter(cls) {	
	//- Show All collapsed
	$(cls + " .panel-body").show(); 

	//- Show all Containers
	$(cls + ".panel-default").show();  

	//- Show All GROUP : panel primaries
	$(cls + ".panel-primary").show();  
}

/**
 * Filter (version/extension)
 * @param bIsChild
 * @param versionOrExtension
 */
function filterEntries(label, bIsChild) {

	//Read all version squares 
	var cls = "";
	if (bIsChild !== undefined) cls += (bIsChild ? ".child" : ".ancestr"); 

	//BEFORE filter
	beforeFilter(cls); 

	//Get other filter label
	var notLabel = (label == "version" ? "extension" : "version");

	//- FILTER
	//Get prefix
	var prefix = ""
		if (bIsChild !== undefined) prefix += (bIsChild ? "c_" : "p_");

	var isLastVersionChecked = $("#"+prefix+"version .last").hasClass("fa-check-circle-o");

	//If all version checked && all extension checked => check all
	var allChecked = $("#all_"+prefix+"version").hasClass(_Circle_Check);
	// If not last version checked
	if ( !isLastVersionChecked) {  
		$(cls + ".entry").show();   //.child.entry
		$(cls + ".entry-c").show(); //.child.entry-c
	}
	else {
		$(cls+".no-last").hide();
		$(cls+".vlast").show(); 
		$(".active").show(); 
	}

	//Hide extension Uncheck squares 	
	$("#"+prefix+"extension").find("li .fa").each(function() {
		var ext = $(this).prev().text().trim(); 
		if ( $(this).hasClass(_Square_UnCHECK) ) 
			$(cls+"."+ext).hide(); 
	});

	//Hide version Uncheck squares 	
	if ( !isLastVersionChecked && !allChecked) { 
		$("#"+prefix+"version").find("li .fa").each(function() {
			var ver = $(this).prev().text().trim(); 
			if ( $(this).hasClass(_Square_UnCHECK) ) 
				$(cls+"."+ver).hide(); 
		});
	}

	//Draw line to new showed entry-c
	$(cls + ".entry-c:visible").filter(function() {
		var id = "#" + $(this).attr("id");
		var tab = (bIsChild ? _SVG.getLeft(id) : _SVG.getRight(id));

		if (!tab || tab.length==0) {
			var cPath = $(id).attr("for"); 
			var oEntry = getEntry(cPath); 

			var tabPrec = (bIsChild ? oEntry.oParents() : oEntry.oChildren());
			if (tabPrec.length>0) {

				//If entry not positionned, put it on top
				if (indexOf(oEntry)<0) {
					var obj = tabPrec[0];
					var pos = {"top": obj.top(true), "left" : oEntry.left()}; 

					oEntry.setPosition(pos);
					saveElement(oEntry); 

					//Decaler vers le bas les autres
					moveNextToDown(oEntry);
				} 

				//Draw lines for each children or ancestor  
				$.each(tabPrec, function(i, obj) { 
					drawLine(obj, oEntry, bIsChild);
				});
			}
		}
	});

	//- AFTER FILTER 
	afterFilter(cls);  
}

/**
 * After filter
 * @param cls
 */
function afterFilter(cls) {
	//- Update NUMBER on Group 
	$(cls + ".panel-primary .panel-heading .panel-title").find(".badge").each(function() {  

		var $pPrimary = $(this).closest(".panel-primary");

		//Update number
		var nb = $pPrimary.find(".panel-body .entry:visible").length; 
		$(this).text(nb);

		//Hide Empty Groups
		if (nb == 0) 
			$pPrimary.hide();  
		else  {
			$pPrimary.show(); 

			//Show hide to active data
			if (nb>1)
				$pPrimary.children(".panel-heading").children(".toActiveData").show();
			else
				$pPrimary.children(".panel-heading").children(".toActiveData").hide();
		}
	});

	//- Hide Empties containers
	$(cls + ".ibox-c > .panel-body").each(function() {
		if ( $(this).find(".panel-primary:visible").length == 0
				&& $(this).find(".entry:visible").length == 0 //For container who has entry
		)  
			$(this).closest(".panel.panel-default").hide(); 
	}); 

	//Collapse old collapsed
	$(cls + " .collapseBody:visible").filter(function() {
		var $pBody = $(this).prev();
		if (! $pBody.hasClass("panel-body")) //for slimscroll
			$pBody = $(this).parent().find(".panel-body");
		$pBody.hide(); 
	});
}

//=============================================================
function EVENTS(){}
//=============================================================
//- GRAPH Toggle MINUS connector Children
function EventG_ConnectorClick(){}
$(document).delegate(".droite, .gauche", 'click', function(e) {
	e.stopPropagation();

	togglePopover();
	toggleConnector($(this), $(this).hasClass("droite"));
	_SVG.redrawLines(); 
});

//- GRAPH Toggle meta-data popover when click on it
function EventG_MetadataPopover(){}
$(document).delegate('[data-toggle="popover"]', 'click', function(e) {
	e.stopPropagation();
	$('[data-toggle="popover"]').not(this).popover('hide');
}); 

//- GRAPH Toggle heading
function EventG_HeadingClick($this) {
	var $pBody    = $this.next();
	var $collapse = $pBody.next();

	//Cas slimmscroll
	if ( ! $pBody.hasClass("panel-body")) {
		$pBody = $this.parent().find(".panel-body");
	}

	var path   = $this.parent().attr("for"); 
	var oEntry = getEntry(path); 

	var nextLevel = oEntry._iLevel + (oEntry.isChild() ? 1 : -1);
	if ( isVisible($pBody) ) {
		//Keep width
		var wdt = $this.css("width");
		if (!wdt) wdt = $this.width() + 4;
		$this.css("width", wdt);

		$pBody.hide();
		$collapse.show();

		//Reset other position before if entry is bigger
		if (oEntry.allEntries().length>=_MAX_ENTRIES) { 
			//Decaler vers le haut
			upNextPosition(oEntry);
		}
	}
	else {
		//$(this).css("width", "");
		$pBody.show();
		$collapse.hide(); 

		moveNextToDown(oEntry);
	}	
}
$(document).delegate('.panel-heading', 'click', function(e) {
	e.preventDefault();
	e.stopPropagation();

	EventG_HeadingClick($(this));
	_SVG.redrawLines(); 
}); 

//=============================================================
function EventG_CheckBoxClick(){} //- GRAPH Handle CHECK CLICK
//=============================================================
$(document).delegate('.check', 'click', function(e) {
	e.stopPropagation();

	var isChecked = $(this).prop("checked");

	var id = $(this).attr("name");
	var oEntry = getEntry(id);

	if (!oEntry) { 
		id = $(this).closest("div").attr("for");
		oEntry = getEntry(id);
	}

	//else //Container
	if (oEntry) {
		oEntry.check(isChecked);
	}
	handleHideUncheckMenu();
});

//=============================================================
//HANDLE ACTIVE DATA SELECT CHANGE  
//=============================================================
$(document).delegate('.metadata select', 'change', function(e) { 
	e.stopPropagation();
	
	var value = $(':selected', $(this)).text(); 
	var metaName = $(this).attr("title"); 

	//Selected medatata
	var metaLbl = $(this).attr("id");

	//Select by Index
	var idx = parseInt( $("option:selected", $(this) ).attr("title") );
	//console.log(idx + " => " + metaName + " : " + value );
	$.each(_TABKEY, function(label, name) {
		var sid = toId(label);
		if (metaLbl != sid ) { 
			var id = "#"+sid; 
			$(id + " option:eq("+idx+")").prop('selected', true);
		}
	});

	//Select good version
	var version = value;
	if (metaName != "Version") {
		//Select the good version
		$("#a_Version option:eq("+idx+")").prop('selected', true);
		version = $("#a_Version :selected").text();
	}

	var $pop = $(".titre.activeData a");
	var isActive = (value.indexOf("*")>=0);
	if (isActive) { 
		//Hide popover
		$pop.popover("hide");
		
		$("#actdata").removeClass("ic-enabled");
		$("#actdata").addClass("ic-disabled");	
		_SVG.disable(false);
		
		$("#actdata").hide();
		$("#canceldata").hide();
	} 
	else {
		$("#actdata").removeClass("ic-disabled");
		$("#actdata").addClass("ic-enabled");

		_SVG.disable(true);
		
		//Show actdata
		$("#actdata").show();
		//Show cancel
		$("#canceldata").show();
		
		//Show popover
		$pop.popover("show");
		$(".popover").addClass("ic-pop");
	}
});

function Event_SetToActiveData() {}
$(document).delegate('.toActiveData', 'click', function(e) { 
	e.stopPropagation();
	e.preventDefault();

	var path = $(this).closest("div").attr("for");
	if (!path) {
		path = $(this).closest(".panel").attr("for");
		var cont = getEntry(path);
		path = ""; var sep= "";
		$.each(cont.allEntries(), function (i, obj) {
			path += sep + obj._path; sep=",";
		});
	}

	bootbox.confirm({ size:"small"
		, message: "Change the active data to this ?"
			, callback: function(bOk) {
				if (bOk) { 
					if (_ZOOM_BOX) bootbox.hideAll();
					$graphScope.changeActiveData(path, false);
				}
			} 
	}); 
});

//===================ACTIVE-DATA/PARENTS TOGGLE=================
function Event_ToggleMenuItem() {}
//============================================================== 
$(document).delegate('.menu a', 'click', function(e) { 

	var checkElement = $(this).next();
	if ( !checkElement.is('ul') ) return false;

	if ( !(checkElement.is(':visible'))) {

		//- Close all others (down)
//		$('.menu ul:visible').slideUp('normal');
//		$('.menu ul:visible').prev().css("background", "none");
//		$('.menu ul:visible').prev().css("border-left", "none");
//		$('span.fa-caret-down').addClass('fa-caret-up');
//		$('span.fa-caret-down').removeClass('fa-caret-down');

		//-- Open current
		checkElement.slideDown('normal');

		$('i.fa-angle-up', $(this)).addClass('fa-angle-down');
		$('i.fa-angle-up', $(this)).removeClass('fa-angle-up');

		checkElement.prev().css("background", "rgba(255,255,255,0.2)");
		checkElement.prev().css("border-left", "red 2px solid"); 

		$('span.fa-caret-up', $(this)).addClass('fa-caret-down');
		$('span.fa-caret-up', $(this)).removeClass('fa-caret-up');

	}
	else
	{
		//Close this
		checkElement.slideUp('normal');

		$('i.fa-angle-down', $(this)).addClass('fa-angle-up');
		$('i.fa-angle-down', $(this)).removeClass('fa-angle-down');

		checkElement.prev().css("background", "none");
		checkElement.prev().css("border-left", "none");

		$('span.fa-caret-down', $(this)).addClass('fa-caret-up');
		$('span.fa-caret-down', $(this)).removeClass('fa-caret-down');
	}
	updateScroll();
});

//=============================================================
function Event_CheckCircleTitleClick(){} //- RADIO TITLE VERSION/EXTENSION
//=============================================================
$(document).delegate('.menu a i.fa-stack-1x', 'click', function(e) {   
	e.preventDefault(); e.stopPropagation(); 

	//If already checked => do nothing
	//Disable UNCHEK ALL (n'a aucun sens)
	if ( $(this).hasClass(_Circle_Check) ||
			(! $(this).hasClass(_Circle_Check)
					&& ! $(this).hasClass(_Circle_UnCheck) )
	) return;

	//- WAIT
	wait();

	$(this).removeClass(_Circle_UnCheck);
	$(this).addClass(_Circle_Check); //CHECK TITLE RADIO

	//Get parent jdom
	var $parent = $(this).closest("li");
	var $ul = $parent.children("ul");

	//- UNCHECK "Last" radio button
	$ul.find("."+_Circle_Check).each(function() {
		$(this).removeClass(_Circle_Check);
		$(this).addClass(_Circle_UnCheck); //UNCHECK LAST RADIO
	});

	//- CHECK all squares children
	$ul.find("."+_Square_UnCHECK).each(function() {
		$(this).removeClass(_Square_UnCHECK);
		$(this).addClass(_Square_Check); //CHECK SUB SQUAREs
	});

	//----- FILTER entries
	var label = $ul.attr("id");
	filterEntries(label);

	//----- Redraw lines, because hidding something
	_SVG.redrawLines(true);

	//- END WAIT
	wait(true);
});

//=============================================================
function Event_CheckSquareSubClick(){} //- CHECK/UNCHECK SUB-SQUARES
//=============================================================
$(document).delegate('.menu .fa-check-square-o, .menu .fa-square-o', 'click', function(e) {
	e.preventDefault(); e.stopPropagation();

	var id = $(this).attr("id");
	if (id) return; //Handle child only;

	wait(); //WAIT

	//Check/Uncheck square (this)
	var bToChecked = toggleSquareCheck($(this)); 

	var $ul = $(this).closest("ul");
	var $limenu = $ul.parent();

	//Find checked children
	var unCheckNum   = $ul.find("."+_Square_UnCHECK).length; 
	var bAllChecked= (unCheckNum == 0); 

	//Check/Uncheck Radio Title (parent)
	$('i.fa.fa-stack-1x', $limenu).removeClass( (bAllChecked ? _Circle_UnCheck : _Circle_Check) );
	$('i.fa.fa-stack-1x', $limenu).addClass( (bAllChecked ? _Circle_Check : _Circle_UnCheck));

	//Uncheck LAST radio title, if only 1 checked
	if (bToChecked) {
		var checkNum   = $ul.find("."+_Square_Check).length; 
		if (checkNum>0) {
			var $lastRadio  = $('span.last', $ul);
			$lastRadio.removeClass(_Circle_Check);
			$lastRadio.addClass(_Circle_UnCheck);
		}
	}

	//--------------------------------------
	//Filter
	//--------------------------------------
	var label = $ul.attr("id");
	filterEntries(label);

	//--------------------------------------
	// Redraw lines
	//--------------------------------------
	_SVG.redrawLines(true);
	wait(true); //END_WAIT
});

//============================================================== 
function Event_CheckLast() {} //- CHECK LAST
//============================================================== 
$(document).delegate('.last', 'click', function(e) {
	
	e.preventDefault(); e.stopPropagation();

	//If already checked => do nothing
	if ( $(this).hasClass(_Circle_Check) ) return;

	$(this).removeClass(_Circle_UnCheck);
	$(this).addClass(_Circle_Check); //CHECK LAST RADIO

	//---------------
	wait(); //WAIT
	//---------------

	//Uncheck ALL squares
	var $ul = $(this).closest("ul");
	$ul.find("."+_Square_Check).each(function() {
		$(this).removeClass(_Square_Check);
		$(this).addClass(_Square_UnCHECK);
	});

	//Uncheck Title radio
	$('i.fa-check-circle-o', $ul.prev()).addClass(_Circle_UnCheck);
	$('i.fa-check-circle-o', $ul.prev()).removeClass(_Circle_Check);

	var cls = "";

	//- BEFORE Filter
	beforeFilter(cls);

	//------------------
	//FILTER : vlast/no-last 
	$(cls+".no-last").hide();
	$(cls+".vlast").show(); 
	//------------------

	//- AFTER Filter
	afterFilter(cls); 

	//Redarw lines
	_SVG.redrawLines(true);
	//--------------
	wait(true); //END WAIT
});

//============================================================== 
function Event_ToggleTopSideBar() {} 
//============================================================== 
//- Top navbar
$(document).delegate('#menu-toggle', 'click', function(e) {  
	e.preventDefault();
	$("#wrapper").toggleClass("toggled");
});

//- Left Sidebar
$(document).delegate("#menu-toggle-2", 'click', function(e) {  
	e.preventDefault();
	$("#wrapper").toggleClass("toggled-2");
	$("#brand").toggleClass("toggled");
}); 

//============================================================== 
function Event_filename() {} //OPEN Aero datas
//============================================================== 
$(document).delegate('.filename', 'click', function(e) {
	var href = $(this).attr("title");
	var entry = getEntry(href);
	if (entry) {
		//var fpath = entry.get('filepath');
		//window.open(fpath, "_blank", "width=900, height=700, scrollbars=yes");
		
		var mime = entry.get("mimeType");
		var fpath = entry.get("filepath");
		$graphScope.loadFile(fpath, mime);
	}

});

var _BSHOWED = false;
var _ZOOM_BOX = null;
//============================================================== 
function Event_fullBox() {} 
//============================================================== 
$(document).delegate('.toZoomGroup', 'click', function(e) { 
	e.preventDefault(); e.stopPropagation();

	wait(); //WAIT

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

	//var hgt = (document.body.offsetHeight - 200) + "px";
	var hgt =  $(".sidebar-nav").outerHeight() - 160;

	var panel = $(this).closest(".panel-primary"); 
	var id = panel.attr("id");
	var oGroup = _INSTANCES[id];

	var pBody = $(this).closest(".panel-primary").find(".panel-body");
	var shtml = pBody.html();  
	shtml = shtml.replace(/ui-draggable/g, "");

	var tabChecked = [];
	pBody.find('input:checkbox:checked').each(function() {
		tabChecked.push($(this).parent().attr("id"));
	});

	//Remove Hidden
	//html = html.replace(/ none;/g, " block;");
	shtml = shtml.replace(/ui-draggable/g, "");

	//Classname 
	//shtml + "<div class='panel-body group' style='width:auto;height:100%;'>"+shtml+"</div>";
	_ZOOM_BOX = bootbox.dialog(
			{ title: "" + (oGroup._container?oGroup._container._label:"") + " : "  + oGroup._label
				+ "<input type='text' id='input-search' placeholder='Search ...'>"
				, message: "<div> </div>" //shtml
					, className: "entry-box"  
						//, closeButton : false
						, buttons: { 
							success: {
								label: "Close",
								className: "btn-primary large-btn", 
							} //end success
						}//end button
			});//end bootbox


	_ZOOM_BOX.on("show.bs.modal", function() { 
		//Height
		$(".entry-box .modal-body").css("height", hgt);  
		$(".bootbox-body", $(this)).append(shtml); 
		$(this).find(".droite, .gauche").remove();  

		$.each(tabChecked, function(i, id) {
			$(".entry-box #"+id + " input:checkbox").prop("checked", true);
		});
		wait(true); 

		//Popover
		$(this).find(".version").each(function() {
			$('[data-toggle="popover"]').popover({
				"container" : _ZOOM_BOX
				, "placement" : 'left'
			}); 
		});

		//Handle search
		$("#input-search").keyup(function() {
			var pattern = $(this).val().toLowerCase();
			$(".bootbox-body .entry").each(function() {
				var label = $(".filename", $(this)).text();
				if ( pattern && label.toLowerCase().indexOf(pattern)>=0 ) 
					$(".filename", this).css("background", "#ffffcc"); //#ff8080");
				else
					$(".filename", this).css("background", "transparent");
			});
		});

		//Handle clearing
		$("#input-search").mouseup(function() {
			var pattern = $(this).val();
			if (!pattern) return false;

			var $this = $(this);
			setTimeout(function() {
				if ($this.val().trim() == "")
					$(".bootbox-body .filename").css("background", "transparent");
			}, 1); 
		});

	}); 
});

/** 
 * Full Screen handle 
 */
function runScreenFull() { 
	if (! screenfull) {  
		console.log("Screenfull not supported");
		$('#supported').text('No');
		$('#request-fullscreen').hide();
		return;
	}

	$('#supported').text('Yes'); 
	$('#request-fullscreen').click(function () {      	
		if (!screenfull.isFullscreen) {
			screenfull.request($('#container')[0]);
		} else 
			screenfull.exit();
		screenfull.onchange();
	});

	screenfull.onchange = function (e) { 
		$('#status').text('Is fullscreen: ' + screenfull.isFullscreen);

		var elem = screenfull.element;
		if (elem) {
			$('#element').text('Element: '+ elem.localName + (elem.id ? '#' + elem.id : ''));
		}

		var iShow = "glyphicon glyphicon-resize-small"; 
		var iHide = "glyphicon glyphicon-fullscreen"; 

		if (!screenfull.isFullscreen) {
			$('#external-iframe').remove();
			document.body.style.overflow = 'auto';

			iShow = "glyphicon-fullscreen";
			iHide = "glyphicon-resize-small";

			//
			$('#wrapper').css("min-height",  "100%");
		}
		else { 
			var navbarHeigh  = $('nav.navbar-default').height();
			var wrapperHeigh = $('#wrapper').height();

			if (navbarHeigh > wrapperHeigh) {
				$('#wrapper').css("min-height", navbarHeigh + "px"); 
			} 
			else if (navbarHeigh < wrapperHeigh) {
				$('#wrapper').css("min-height", $(window).height() + "px"); 
			}
		}

		$("#request-fullscreen").removeClass(iHide);
		$("#request-fullscreen").addClass(iShow); 
	};

	// Trigger the on change  to set the initial values
	screenfull.onchange(); 
} 

//============================================================== 
function READY() { 
//============================================================== 
	console.log("Call Ready ...");

	//--- Allow fullcreeen
	runScreenFull(true); 

	//-- INIT MENU 
	$('.menu ul').hide();
	$('.menu ul.current').show();

	//- Handle scrolling, graph 
	// Add scroll to sidebar
	$('.sidebar-nav').slimScroll({
		height : '98%'  /*'92%'*/
			   , railOpacity : 0.1
			   , color: '#fff'
	});

	//----------------------------
	// Window RESIZE
	//----------------------------  
	$(window).resize(function() {
		updateScroll(".sidebar-nav");
	});
	
	//---------------------------------------
	//		Toggle titre
	//---------------------------------------
	$('.titre a').click(function() { 
		
		var checkElement = $(this).next();
		
		if ( ! checkElement.is('ul')) {
			var cls = $(this).attr("for");
			if (cls) {
				checkElement = $(this).parent().nextAll(("." + cls));
			}
		}

		if ( !(checkElement.is(':visible'))) {
  
			//-- Open current
			checkElement.slideDown('normal');

			$('i.fa-angle-up', $(this)).addClass('fa-angle-down');
			$('i.fa-angle-up', $(this)).removeClass('fa-angle-up');
			
			//Handle
			handleHideUncheckMenu();
		}
		else if ( !_SLIDE) {
			//Close this
			checkElement.slideUp('normal'); 
			
			$('i.fa-angle-down', $(this)).addClass('fa-angle-up');
			$('i.fa-angle-down', $(this)).removeClass('fa-angle-down');
		}

		updateScroll();
		return false;
	});

}//end ready

//$(document).ready(function() { READY(); });
/***============================== END ================================**/

