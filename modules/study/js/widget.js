//=================================================================

//WIDGET HANDLER

//==================================================================

var _C_VERSION   = "_VERSION_";

var _C_FILE      = "_files_";
var _C_PROPERTY  = "_properties_";
var _C_NAMESPACE = "Namespace";
var _C_NAME 	 = "Name";
var _C_VALUE 	 = "Value"; 
var _T_PROPS 	 = ["Namespace", "Name", "Value"];

//----------- CONSTANTS ------------
//Get empty pattern
var emptyPattern = function() { return [""]; }

//Get empty Property 
var emptyProps = function() {
	return  { "Namespace"  : "", "Name" : "", "Value" : ""  };
}

//Get empty JSON Entry 
var emptyJson = function() { 
	return { "_files_"  : [""] , "_properties_" : [ emptyProps() ] };
}

var emptySearch = {
    "_VERSION_"	: "",
    "_PATTERN_"	: [],
    "_PROPERTY_": [],
    "_PARENT_": [],
    "_CHILD_": []
}
 
//=================================================================

//Widget Form Object

//==================================================================
function WidgetFrm(dWdt, bCannotUpdate) {
	this._widget 		= dWdt;
	this._bCanUpdate 	= (bCannotUpdate ? false : true);
	this._dWdtSearch 	= dWdt.search;    //Current search widget

	/** Get value */
	this.getVal = function(key, rep) {
		var val = "";
		if (this._dWdtSearch[key]) {
			val = this._dWdtSearch[key];
			if (!val) val = "";
			else if (rep) val = val.replace(rep, "");
		}
		return val;
	};
	
	this.isChart = function() {
		return (this._widget.type == "chart");
	}
	
	this.getViewList = function() {
		if (this.isChart())
			return _CHART_TYPE;
		return _VIEW_TYPE;
	}

	/** Get version */
	this.getVersion = function(key) {
		var val = "";
		if (this._dWdtSearch[key]) {
			val = ""+this._dWdtSearch[key];
		}
		if (val=="-1") val = "";
		else if (val.toLowerCase()=="last") val = "";
		return val;
	};
	
	/** Get version */
	this.isAllVersion = function() {
		var val = "";
		if (this._dWdtSearch[_C_VERSION]) {
			val = ""+this._dWdtSearch[_C_VERSION];
		}
		return (val=="-1" || val.toLowerCase()=="all");
	};

	/** Check if view selected */
	this.isSelected = function(val) {
		var type = this._widget["view"];
		if (type == val)
			return ' selected="selected"';
		return '';
	};

	this.getName = function () {
		return $('#wdtname').val();
	}

	this.getView = function () {
		return $('#wdtview').val();
	}

	/**
	 * Construct widget form
	 * @param dWdt
	 * @returns {String}
	 */
	this.getHtml = function() {

		if (!this._dWdtSearch) 
			this._dWdtSearch = {};
		
		var viewOptions = '';
		var $this = this;
		var list  = this.getViewList();
		$.each(list, function(x, lst) {
			viewOptions  += '<option value="'+lst+'" '+ $this.isSelected(lst) +'>'+lst+'</option>';
		}); 

		// -------------------------------------
		//				HTML
		// -------------------------------------
		var editBox = '<form id="widgetfrm" class="form-horizontal" for="'+this._bCanUpdate+'">'
		+ 	'<div class="form-group"> '
		+ 		'<label class="col-md-2 control-label" for="name">Name :</label> '
		+ 		'<div class="col-md-4"> '
		+ 			'<input id="wdtname" type="text" placeholder="Your name" '
		+ 			' class="form-control input-md" value="'+this._widget.label+'"> '
		+ 		'</div> '
		+ 		'<label class="col-md-3 control-label" for="view">View type :</label> '
		+ 		'<div class="col-md-3"> '
		+ 			'<select id="wdtview" class="form-control input-md">'
		+ 				viewOptions
		+ 			'</select> '
		+ 		'</div> '
		+ 	'</div>'

		+ 	'<legend>Target :'	
		+ 		'<table id="wdgVersion" class="pull-right"><tr>'
		+ 			'<td><label class="control-label">Version : </label></td>'
		+ 			'<td><input id="'+_C_VERSION+'" name="'+_C_VERSION+'" type="text" placeholder="'
															+ (this.isAllVersion() ?'All"':'Last"')
		+ 			' 	class="input-xs" value="'+ this.getVersion(_C_VERSION)+'">'
		+ 			'</td>'
		+ 			'<td><input type="checkbox" id="allVersion"'
		+ 				(this.isAllVersion() ?' checked':'')+'> All'
		+ 			'</td>'
		+ 		'</tr></table>'
		+ 	'</legend>'
		//--------------- PATH & PROPERTY ------------------
		+ 	'<div class="form-group"> '
		+ 		'<div class="col-md-5 wdt-settings" title="Result pattern"> '
		+ 			this.htmTablePattern("_PATTERN_", ["Pattern (or)"]) 
		+ 		'</div> '

		+	 	'<div class="col-md-7 wdt-settings" style="padding-left:2px"> '
		+ 			this.htmTableProps("_PROPERTY_") 
		+ 		'</div> '
		+ 	'</div>'
		
		//+ ( this.isChart() ? "" : ""
		//--------------- LINK input PARENT ------------------
		+ 	'<legend>Parent :</legend>'
		+ 	'<div class="form-group"> '
		+ 		'<div class="col-md-12 wdt-settings" title="Parent pattern"> '
		+ 			this.htmTable("_PARENT_", ["To (and)"])
		+ 		'</div> '
		+ 	'</div>'

		//--------------- LINK output CHILD------------------
		+ 	'<legend>Children :</legend>'
		+ 	'<div class="form-group"> '
		+ 		'<div class="col-md-12 wdt-settings"  title="Children pattern"> '
		+ 			this.htmTable("_CHILD_", ["From (and)"]) 
		+ 		'</div> '
		+ 	'</div>'
		//)

		+ '</form> ';

		return editBox;
	};

	/**
	 * Get table from Array
	 * @param tableId
	 * @param tabKey
	 * @returns {String}
	 */
	this.htmTablePattern = function(tableId, tabKey) {	
		if (!tabKey) tabKey = ["Pattern"];

		//Get header : PATTERN/TO/FROM
		var htmTable  = '<table id="'+tableId+'">';
		htmTable    +=  '<thead><tr>';

		//1rst column => Left empty for +  
		htmTable += '<th class="empty"></th>';

		//Fill headers 
		for (var i=0; i<tabKey.length; i++) {
			htmTable += '<th>'+tabKey[i]+'</th>';
		} 
		htmTable += '<th></th>'      //Empty line for folder open
			htmTable += '</tr></thead>'; //Head for open folder Column

		htmTable += '<tbody>';

		//Get pattern table content
		var tPattern = this._dWdtSearch[tableId]; 
		if (!tPattern) 
			tPattern = emptyPattern();

		var sCanUpdate = ""+this._bCanUpdate;
		$.each(tPattern, function(i, val) {
			htmTable += trFileLine(val, sCanUpdate);
		});

		if (this._bCanUpdate) {
			htmTable += '<tr>'
				+ '<td class="text-navy empty addBefore" title="New pattern">'
				+ ' <i class="fa fa-plus"></i></td>'
				+ '<td class="empty" colspan="2"></td>'
				+ '</tr>';
		}

		htmTable += '</tbody></table>';
		return htmTable;
	};

	/**
	 * Create property table
	 * @param tableId
	 * @param tabKey
	 */
	this.htmTableProps = function(tableId) {

		var htmTable = '<table id="'+tableId+'">';
		htmTable    += '<thead><tr>';

		//Property Header
		for (var i=0; i<_T_PROPS.length; i++) { 
			htmTable += '<th>'+_T_PROPS[i]+'</th>';
		} 
		htmTable += "<th></th>"; //Head for delete/add Column
		htmTable += "</tr></thead><tbody>";

		//----- PROP TABLE COL ------- 
		var tabProp = this._dWdtSearch[tableId];
		if (!tabProp) tabProp = [emptyProps()];

		var sCanUpdate = (""+this._bCanUpdate);
		$.each(tabProp, function(i, dProp) {
			htmTable += trPropertyLine(dProp, sCanUpdate); 
		});

		if (this._bCanUpdate) {
			htmTable +='<tr><td class="empty" colspan="3"></td>'
				+ '<td class="text-navy empty addBefore"><i class="fa fa-plus"></i></td>'
				+ '</tr>';
		}
		htmTable += "</tbody></table>";
		return htmTable;
	};

	/**
	 * Create an unique table
	 * @param tableId
	 * @param tabKey
	 * @returns {String}
	 */
	this.htmTable = function(tableId, tabKey) {	

		if (!tabKey) tabKey = ["Pattern"];

		//Get header : PATTERN/TO/FROM 
		var sHeader = '<table id="'+tableId+'">';
		sHeader +=  '<thead><tr>';

		//1rst column => Left empty for Open 
		if (this._bCanUpdate) {
			sHeader += '<th class="iad text-navy" title="add new pattern">'
				//+ '	<span class="glyphicon glyphicon-edit"></span>'
				+ '	<i class="fa fa-plus-square-o"></i>'
				+ '	</th>';
		}
		else
			sHeader += '<th class="empty"></th>';

		//Pattern headers
		for (var i=0; i<tabKey.length; i++) {
			//if (tabKey[i].indexOf("Pattern")>=0)
			sHeader += '<th style="width:35%">'+tabKey[i]+'</th>';
		} 
		sHeader += '<th></th>'; //Head for open folder Column

		//Slim Empty column
		sHeader += domSeparator();

		//Property Header
		for (var i=0; i<_T_PROPS.length; i++) { 
			sHeader += '<th>'+_T_PROPS[i]+'</th>'; // style="width:103px;"
		} 
		sHeader += '<th></th>'; //Head for delete/add Column

		sHeader += '</tr></thead>'; //Close header

		var htmTable = sHeader + "<tbody>";//Create TBODY

		//Get pattern table content
		var pattern = this._dWdtSearch[tableId]; 
		if (!pattern || pattern.length==0) {
			pattern = [emptyJson()];
		}
		else if (pattern.length==1) {
			if (pattern[0] == {})
				pattern = [emptyJson()];
			else if (pattern[0].length == 0)
				pattern = [emptyJson()];
		}

		var sCanUpdate = (""+this._bCanUpdate);
		for (var i=0; i<pattern.length; i++) {
			var jData = pattern[i];
			htmTable += getHtmlLine(tableId, jData, sCanUpdate); 
		}

		//Return the table html
		return (htmTable + "</tbody></table>");
	}; 

	/**
	 * Create json of all values
	 */
	this.getSearchValue = function () {

		//Duplicate the widget search
		if (!this._bCanUpdate) {
			return $.extend(true, {}, this._dWdtSearch);
		}

		var jData = {};
		var bHasValue = false;

		$("#widgetfrm").find("table").each(function(idx, table) {

			var id = $(table).attr("id");

			//_VERSION
			if (id == "wdgVersion") {
				var vers = $("#"+_C_VERSION).val().trim(); 
				//Set all Data to -1
				if (  $("#allVersion").prop("checked")
					|| vers.toLowerCase()=="all") vers = "-1";
				jData[_C_VERSION] = vers;
			}
			else {
				//Get titles
				var tabTitle = [];
				$("#"+id + " tr th").each(function(i, o) {
					var key = cleanText($(this).text().replace('*', ''));
					if (key)
						tabTitle.push(key);	
				});

				//If one big table
				var oneTable = (tabTitle.length>_T_PROPS.length);

				var tab = [];
				//Append
				jData[id] = tab;

				$("#"+id + " tbody tr").each(function(lg, tr) {	

					var jElt 	= null;
					var tabProps= null;
					var dLine 	= null;

					//For each td
					var idx = 0;
					$("td", $(this)).each(function(i, td) { 

						//Find select or input
						var obj = $(td).find("select, input")[0];

						if (obj) {
							var val =  cleanText($(obj).val()); 

							//CHECK IF HAS VALUE
							if (val && val.trim()!="") bHasValue = true; 
							//console.log( val + " -> " + obj.outerHTML);

							//Get title
							var key = tabTitle[idx++];

							//Check if property
							var j = _T_PROPS.indexOf(key);

							if (!oneTable) {
								if (j<0) {
									if (val) tab.push(val);
								}
								else { 
									if (j==0) {
										if (!val) 
											dLine = null;
										else {
											//New property
											dLine = {};
											tab.push(dLine);
										}
									}
									if (dLine)
										dLine[key] = val;
								}
							}
							else {
								if (j<0) {
									if (val) {
										//Create new element 
										jElt = {}; 
										jElt[_C_FILE] = val; //[val]; //val.split("|"); do split only when search
										tabProps = [];
										jElt[_C_PROPERTY] = tabProps;
										tab.push(jElt);
									}
								}
								else {
									if (j==0) { 
										if (!val) 
											dLine = null;
										else {
											//New property, without pattern
											if (!tabProps) {
												jElt = {}; 
												jElt[_C_FILE] = "";
												tabProps = [];
												jElt[_C_PROPERTY] = tabProps;
												tab.push(jElt);
											}
											dLine = {};
											tabProps.push(dLine);
										}
									}
									if (dLine)
										dLine[key] = val; 
								} 
							}
						}
					}); //end for td
				}); //end for tr
			}
		}); //end for table

		//console.log(JSON.stringify(jData));
		if (bHasValue)
			return jData;	

		return {};
	};

} //--- END Widget Class ------- //

//=============================================
//FUNCTIONS
//=============================================
/**
 * Get slim column
 * @returns {String}
 */
function domSeparator() {
	return '<th class="separator"></th>';
}

/**
 * Open Column
 * @returns {String}
 */
function domOpenColumn(bCanUpdate) {
	return '<td class="open" title="Select a path">'
	+ '<span class="glyphicon glyphicon-folder-open"></span></td>';
}

/**
 * Get selector
 * @param value
 * @returns {String}
 */ 
function domInputSelect(cls, tab, value, dropup) {

	var sel = '<input type="text" value="'+value+'" class="'+cls+'">';

	if (tab && tab.length>0) {
		if (!dropup) dropup="";
		sel = '<div class="input-group">'
			+'    <div class="input-group-btn '+dropup+'">'
			+'      <button type="button" class="dropdown-toggle" '
			+ ' data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" '
			+ ' style="padding:0px;width:15px;background:#fff;border:none;color:gray">'
			+ '<span class="caret"></span></button>'
			+'      <ul class="dropdown-menu">'
			;
		for (var i=0; i<tab.length; i++) { 
			sel += '<li><a href="#">' + tab[i] + '</a></li>';
		} 
		sel += '      </ul>'
			+'    </div>' 
			+'    <input type="text" value="'+value+'" class="form-control '+cls+'" aria-label="...">'
			+'</div>';
	} 
	return sel;
}

/**
 * Check if can update table
 * @param sCanUpdate
 * @returns {Boolean}
 */
function canUpdate(sCanUpdate) {
	if (sCanUpdate)
		return (sCanUpdate == "true");
	return ($("#widgetfrm").attr("for") == "true");
} 

/**
 * Create a file line
 * @param val
 */
var trFileLine = function(val, sCanUpdate) {
	var bCanUpdate = canUpdate(sCanUpdate);

	var hfiles = ''; 
	if (bCanUpdate) {  
		hfiles += '<td class="delLine empty" title="Remove this pattern">'
			+  '<i class="fa fa-remove"></i></td>';

		hfiles += '<td><input type="text"'
			+ (val ? '' : ' class="text-navy"')
			+ ' value="'+val+'"></td>';

		hfiles += '<td class="open" title="Select a path">'
			+ '<span class="glyphicon glyphicon-folder-open"></span></td>';
	} 
	else { 
		hfiles += '<td class="empty"></td>';
		hfiles += '<td colspan="2" style="width:85px;max-width:85px">'+ val +'</td>'; 
	}

	return ('<tr>' + hfiles +'</tr>');
};

/**
 * Get property line
 * @param dProp
 * @param 
 * @returns {String}
 */
function trPropertyLine(dProp, sCanUpdate) {
	var hprop = '<tr>'; 
	hprop += propertyLine(dProp, sCanUpdate); 
	hprop += '</tr>'; 
	return hprop;
};

/**
 * propertyLine tds
 * @param dProp
 * @param sCanUpdate
 * @returns
 */
function propertyLine(dProp, sCanUpdate, dropup) {
	var bCanUpdate = canUpdate(sCanUpdate);
	var hprop = "";

	var dicMetdadata = _oAppScope._businessMetadata;

	var tab = Object.keys(dicMetdadata);
	var dTab;
	$.each(_T_PROPS, function(j, key) { 
		var pVal = dProp[key]; 
		if (!pVal) pVal = "";

		if (!bCanUpdate) {
			if (j==_T_PROPS.length - 1)
				hprop += '<td colspan="2">'+ pVal +'</td>';
			else
				hprop += '<td>'+ pVal +'</td>';			
		} 
		else { 
			hprop += '<td>' + domInputSelect(key.toLowerCase(), tab, pVal, dropup) + '</td>';

			tab = [];
			if (pVal)  {
				if (key == _C_NAMESPACE) { 
					dTab = dicMetdadata[pVal]; 
					tab = [];
					if (dTab) {
						for (var i=0; i<dTab.length; i++) {
							tab.push(dTab[i].name);
						}
					}
				}
				else if (key == _C_NAME) {
					if (dTab) {
						for (var i=0; i<dTab.length; i++) {
							if (dTab[i].name == pVal) {
								tab = dTab[i].value;
								break;
							}
						}
					}
				} 
			} //end pval
		}

	});

	if (bCanUpdate) {//Append x icon in end
		hprop +='<td class="delLine" title="Remove this property">'
			+ ' <i class="fa fa-remove"></i>'
			+ '</td>';
	}  

	return hprop;
};

/**
 * Add an line for ONE table
 * @param tableId
 * @param jData
 */
function getHtmlLine(tableId, jData, sCanUpdate) {

	//For 2html table
	if (!sCanUpdate && !jData && !($("#"+tableId).find(".iad").html()) ) {
		//Check if a pattern tab or a prop tab
		if (tableId.toLowerCase().indexOf("prop")>=0) 
			return trPropertyLine(emptyProps());
		else
			return trFileLine("");
	}

	if (!jData) {
		jData = emptyJson();
	} 
	else if ( isStr(jData) ) {
		var f = jData;
		jData = emptyJson();
		jData[_C_FILE].push(f);
	}

	//- For Unique table
	var tabHtm = ""; 
	//----------------------------------
	// Insert pattern line
	//----------------------------------
	var cid = uniqId();

	//Check if can Update
	var bCanUpdate = canUpdate(sCanUpdate);
	var val = jData[_C_FILE];
	var pattern = '<tr class="'+cid+'">'; 

	if (bCanUpdate) {
		//1rst column => Icon Delete //-- REMOVE ENTIRE LINE --
		pattern += '<td class="delClass empty" title="Remove entire line">'
			+  '<span class="glyphicon glyphicon-remove-circle"'
			+  ' style="color:#df5640;font-size:14px;"></span>'
			+  '</td>';

		//2nd column => Pattern/To/From	
		var style = (val ? '' : 'class="text-navy"');
		pattern += '<td><input type="text" '+style+' value="'+val+'"></td>';

		//3rst column => Icon Folder OPEN
		pattern += domOpenColumn();
	} 
	else {
		pattern += '<td class="empty"></td>';
		pattern += '<td colspan="2">'+ val +'</td>';
	}

	//Separator column
	pattern += domSeparator();

	//----------------------------------
	// Insert property line
	//---------------------------------- 
	var tProps = jData[_C_PROPERTY]; 
	if (tProps.length==0)
		tProps = emptyJson()[_C_PROPERTY];

	var dropup = "";
	if (tableId == "_CHILD_")
		dropup = "dropup";

	$.each(tProps, function(i, dVal) {

		//Append line
		pattern += propertyLine(dVal, sCanUpdate, dropup);
		pattern += '</tr>';

		//Append empty line to pattern
		if (i>0) {
			pattern += '<tr class="'+cid+'"><td class="empty" colspan="3"></td>';	
			pattern += domSeparator();
		}
	});

	//Append empty line to pattern & ADD icon
	if (bCanUpdate) {
		pattern += '<tr class="'+cid+'"><td class="empty" colspan="7"></td>'
		+ '<td class="pad text-navy empty" title="New property"><i class="fa fa-plus"></td>'
		+ '</tr>';
	}

	return pattern;
};

/** ----------------------------------------
 * ADD EVENTS
--------------------------------------------*/ 
function EventsAdd() {};

/** Add line for ONE table */
$(document).delegate('.wdt-settings .iad', 'click', function (e) {	
	e.preventDefault();
	//Get id of the table
	var id = $(this).closest("table").attr("id"); 
	var htm = getHtmlLine(id, emptyJson()); 
	$('#'+id+' tr:last').after(htm);
});

/** Add line before for TWO table */
$(document).delegate('.wdt-settings .addBefore', 'click', function (e) {	
	e.preventDefault();
	var $tr = $(this).parent();

	//Get the table id
	var tId = $tr.closest("table").attr("id");
	var htr = getHtmlLine(tId);
	$tr.before(htr);
});

/** Add Property before for ONE table */
$(document).delegate('.wdt-settings .pad', 'click', function (e) {	
	e.preventDefault();

	//Get Prev line, if has hidden, unhide it 
	var $trPrev = $(this).parent().prev();
	if ($trPrev && $trPrev.find(".hidden")[0])
		$trPrev.find(".hidden").removeClass("hidden");

	else {  
		//Create new line
		//Class of entire group, keep only one, make delete easy
		var $tr = $(this).parent(); 
		var cid = $tr.attr("class");

		var htm = '<tr class="'+cid+'">';

		//Empty pattern + separator (4 cols=>  +, to, open, separator)
		htm += '<td class="empty" colspan="4" ></td>'; 

		//Property table line 
		htm += propertyLine(emptyProps() , "true");
		htm += '</tr>';

		//Append before the add line
		$tr.before(htm); 
	}
});


/**------------------------------------------
 * DELETE  EVENTS
 *------------------------------------------*/
function EventsDelete() {};

/** Delete Entire class for ONE TABLE*/
$(document).delegate('.delClass', 'click', function (e) {	
	var cl = $(this).parent().attr("class");
	if (cl) $("."+cl).remove();
});

/** DELETE Property, Pattern table */
$(document).delegate('.delLine', 'click', function (e) {	

	//The td delelte line
	var $this   = $(this);

	//The Tr line to delete
	var $tr     = $(this).parent();
	//var tdHtm = $tr.find('td')[1].outerHTML; 	 

	//Get the class of parent (check if property line)
	var hasClassId = $(this).parent().attr("class");

	//IF delete TD for ONE table
	if (hasClassId) { 

		//Get first td
		var $td0 = $tr.find('td:eq(0)');

		//If first line of One table (has red x)
		if ( $td0.hasClass("delClass") ) {

			//Keep the line to delete
			var $trInit = $this.parent();

			//Check the next Line
			$tr = $tr.next();

			// Check if it is a Last line 
			var $td1 = $tr.find('td:eq(1)');

			//If the next line contains "pad" (add property)
			if ( $td1.hasClass("pad") ) {

				//Clean only current property

				//Set namespace select to empty
				$trInit.find(".namespace").val("");
				$trInit.find(".namespace input").val("");

				//Clean name td
				$trInit.find(".name").parent().html('<input type="text" value="" class="name">'); 
				//Clean value td
				$trInit.find(".value").parent().html('<input type="text" value="" class="value">'); 

				return;
			}

			//=> Remove the next line But copy it's properties, to this line
			// this, actually it's NOT USED 
			//Copy the Next val props to this 
			var sNamespace = $(".namespace", $tr).val(); 
			var sName 	   = $(".name", $tr).val();
			var sValue     = $(".value", $tr).val();

			if (!sNamespace) sNamespace = ""; 
			var $namespaceSel = $trInit.find(".namespace");
			$namespaceSel.val(sNamespace);
			$namespaceSel.trigger("change");

			if (sName) {
				var $name = $trInit.find(".name");
				$name.val(sName);
				$name.trigger("change");
			}

			if (!sValue) sValue = ""; 
			$trInit.find(".value").val(sValue);
		}	
	}

	//Remove
	$tr.remove();
});


/** --------------------------------------------------
 * 		SELECT 
------------------------------------------------------ */
function EventsMetadataSelect() {}
var _bPrevent = false;
$(document).delegate(".wdt-settings .dropdown-menu li a", "click", function(e) {	
	var val = $(this).text(); 

	//Get input
	var $this = $(this).closest("div").next();
	$this.val(val);

	//If value => last
	if ($this.hasClass("value")) return;

	//Get next td
	var $td = $this.closest("td").next();
	if (!$td) return;

	var nextInput = $td.find("input")[0]; 
	if (!nextInput) return;

	//var lastVal = nextInput.val();

	//Get class of next
	var cls = $(nextInput).attr('class');
	cls = cls.replace("form-control", "").trim();

	//Get html to update
	var dropup = "";
	if ($this.closest("table").attr("id") == "_CHILD_")
		dropup = "dropup";

	//Read array value
	var tabArrayVal = getTabNext($this, val); 
	var selectHtm = domInputSelect(cls, tabArrayVal, "", dropup);
	$td.html(selectHtm);

	//if (lastVal in tabArrayVal) //reselect it

	//Clear name
	if (cls == "name") { 
		$(".value", $td.parent()).parent().html('<input type="text" value="" class="value">'); 
	}
});

function EventsChange() {}
$(document).delegate(".wdt-settings td select", "change", function(e) {	
	var val = $(this).val(); 
	var $td = $(this).parent(); 

	if ($(this).hasClass("value")) {
		return;
	}
	var isNamespace = $(this).hasClass("namespace");

	var tab = getTabNext($(this), val); 

	//Get next td
	$td = $td.next();

	var child = $td.children()[0]; 
	//if ($(child).hasClass("delLine")) return;

	//Get next val if exists  
	val = $(child).val(); 

	//Get class of next
	var cls = $(child).attr('class');
	cls = cls.replace("form-control", "");

	//Get html to update
	var selectHtm = domInputSelect(cls.trim(), tab, val);
	$td.html(selectHtm);

	//Cascade change if namespace
	if (isNamespace) {
		var select = $td.children()[0];
		if (select) { 
			$(select).trigger("change");
		}
	}
});

/**
 * Get nex tab of select
 * @param $sel
 * @param val
 * @returns
 */
function getTabNext($sel, val) {
	if ($sel.hasClass("value"))
		return [];

	var namespVal;
	var isName = false;
	if ( $sel.hasClass("namespace")) {
		namespVal = $sel.val();
		isName = true;
	}
	else {
		var $td = $sel.closest("td");
		namespVal = $(".namespace", $td.prev()).val();
	}

	var tab = []; 
	var dTab = _oAppScope._businessMetadata[namespVal];

	if (dTab && dTab.length>0) {
		for (var i=0; i<dTab.length; i++) {
			if (isName)
				tab.push(dTab[i].name);
			else if (dTab[i].name == val) {
				tab = dTab[i].value; 
				break;
			}
		}
	} 
	return tab;
}

/**-------------------------------------------------------
 *   					VERSION
---------------------------------------------------------*/
function EventsVersion() {};

/** Catch _VERSION_ edit events */
$(document).delegate("#"+_C_VERSION, "keyup", function(e) {
	var val = $(this).val().trim();
	if (isNaN(val)) //If Not number, clear
		$(this).val("");
	else {
		//Uncheck all version
		$("#allVersion").prop("checked", false);
		$("#"+_C_VERSION).attr("placeholder", "Last");
	}
});

/**  Check/unchek all version  */
$(document).delegate("#allVersion",  "click", function (e) {
	var id = "#"+_C_VERSION;
	if ($(this).prop('checked')) {
		$(id).val("All");
		$(id).attr("placeholder", "All");
	}
	else {
		$(id).val("");
		$(id).attr("placeholder", "Last");
	}
});

/**------------------------------------------
 *		 TREE VIEW
 *------------------------------------------*/ 
/**
 * Get tree node of a folder
 * @param foldePath
 * @param callback
 */
var _D_NODES = {}
function getTreeNodes(foldePath, folderOnly, callback) {
	if (_D_NODES[foldePath]) {
		if (callback) callback( _D_NODES[foldePath] ); 
		return _D_NODES[foldePath];
	}
	 
	var sUrl = PATH_URL() + "?action=ALtreeView&path="+foldePath+"&level=1&folder="+folderOnly+_oAppScope.params("&");
	var startTime = (new Date()).getTime();
	
	$.ajax({ type		: "GET"
		, url			: sUrl
		, beforeSend	: function(xhr) {
			xhr.setRequestHeader("Authorization", "Basic " + _oAppScope._logStr); 
			xhr.setRequestHeader("WWW-authenticate", "database");
		},  
		dataType	: "json",
		async		: false,
		success		: function (jtab) {  
			//console.log("Tree end: " + (((new Date()).getTime() - startTime)/1000) );
			
			_D_NODES[foldePath] = jtab; 
			if (callback) callback(jtab); 
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {  
			//console.log("ERROR: failed to load paths for: " + rootFolder + " " + errorThrown);
			toastr.error("" + errorThrown, "Failed to load tree view");
			if (callback) callback();

		}
	});	
}

/**---------------------------------------------------------------
 * TREE VIEW HANDLER
----------------------------------------------------------------- */
var _B_FOLDER_ONLY = true; //Get folder only

function widgetTreeInfo() {}
$(document).delegate('.open .glyphicon.glyphicon-folder-open', 'click', function (e) {

	$(".widget-box").css({opacity: 0});

	//Read concerned input
	var myInput = $(this).parent().prev().children('input');

	//Contruct Tree
	var rootFolder = getStudy(); 
	var tabId = $(this).parent().closest("table").attr("id");
	var sTitle = tabId.replace(/_/g, "");
	if (sTitle.endsWith("S")) sTitle = sTitle.substring(0, sTitle.length-1);
	
	//--------------------------------------
	// SHOW TREE
	//-------------------------------------- 
	getTreeNodes(rootFolder, _B_FOLDER_ONLY, function(defaultData) { 
			//============= TREE FRM ==============
			var treeFrm = '<form class="form-horizontal"> ' +
			'<fieldset> ' +
	
			'<div class="form-group"> ' +
			//'<label class="col-md-2 control-label">Search: </label> ' +
			'<div class="col-md-6"> ' +
			'<label for="input-search" class="sr-only">Search Tree:</label>'+
			'<input type="text" class="form-control" id="input-search" '
			+ ' placeholder="Search ..." value="">'+
			'</div> ' +
	
			'<div class="col-md-3">'+
			'	<input type="checkbox" id="chk-exact-match" value="false"><span style="padding:5px">Exact Match</span></br>'+
			'	<input type="checkbox" id="chk-ignore-case" value="false"><span style="padding:5px">Ignore Case</span>'+
			'</div>' + 
	
			'<div class="checkbox col-md-3">'+
			'	<button type="button" class="btn btn-info checkbox" id="btn-search">Search</button>'+
			'</div>' +
	
			'</div>' +
	
			//'<legend>Study :</legend>'+
			'<div class="form-group"> ' +
				'<div id="treeview-searchable" class="col-md-12 text-navy"></div>' +
				//'<div id="treeview-spin"><i class="fa fa-spinner fa-spin fa-5x"></i></div>' +
			'</div>' +
	
			'<div id="selectable-output" style="padding:0px !important;margin:0px; !important"></div>' +
			//'<div class="form-group input-md" style="margin:0px;" id="selectable-output"></div>' +
	
			'</fieldset> ' +
			'</form> ';
			//=================================================================
	
			bootbox.dialog({
				title: "Select a path for the target " + sTitle
				, message: treeFrm
				, className: "widget-tree"
					, closeButton : false
					, buttons: {
						cancel: { label: "Cancel", className: "btn-default"
							, callback: function () {   
								$(".widget-box").css({opacity: 1});
							}
						},
						success: {
							label: "OK",
							className: "btn-primary btn-large",
							callback: function () {
	
								$(".widget-box").css({opacity: 1});
	
								var selectedPath = $('#selectable-output').html();
								if (selectedPath) {
									selectedPath = selectedPath.replace(/#/, "");
									myInput.val(selectedPath);
									myInput.attr("title", selectedPath);
								} 
							}
						} 
					}
			});//end bootbox
	
			var $searchableTree = $("#treeview-searchable").treeview({
				showBorder: false
				//, color: "#428bca" 
				, expandIcon  : "glyphicon glyphicon-folder-close"
				, collapseIcon: "glyphicon glyphicon-folder-open"
				, folderOnly  : _B_FOLDER_ONLY
				, data: defaultData 
				, onNodeSelected: function(event, node) {
							$('#selectable-output').html('' + node.href + '');
						}
				, onNodeUnselected: function(event, node) { $('#selectable-output').html(''); }
			});
	
			var search = function(e) {
				var pattern = $("#input-search").val();
				var options = {
						ignoreCase: $("#chk-ignore-case").is(":checked"),
						exactMatch: $("#chk-exact-match").is(":checked"),
						revealResults: true 
				};
				var results = $searchableTree.treeview("search", [ pattern, options ]); 
			}
	
			$("#btn-search").on("click", search);
			$("#input-search").on("keyup", search);
	
			$("#btn-clear-search").on("click", function (e) {
				$searchableTree.treeview("clearSearch");
				$("#input-search").val("");
			});	
	
			$(".widget-tree .modal-header").css("background", "#fff");
			$(".widget-tree .modal-body").css("background", "#ddd");

	}); //-- END showTreeFrm function 
 
});

//============================================================================
// HTML WIDGET HANDLER
//============================================================================
 
/** ---------------------------
 * Create New Widget panel
 * -----------------------------*/
function widgetHTML(wdtLabel, wdtId, elId, color) {

	wdtLabel = cleanText(wdtLabel);
	if (!color) color = "panel-default";

	var bIsNew		= (!wdtId || wdtId == _EMPTY_WDT_ID);
	var bDefault 	= isCommon(wdtId) ;	
	var bSharedView = isSharedView();
	var bIsPersonal = isPersonal(wdtId);

	var clsViewOnly = "";
	var clsTitle = "View or widget definition";
	if ( (bDefault || bSharedView) && !isUserAdmin() ) {
		clsViewOnly = "view-only ";
		var clsTitle = "View widget definition";
	}
	
	var hidden = ' style="display:none;"';

	return '<div id="'+elId+'" for="'+wdtId+'" onmouseup="mouseUp(event)" onmousedown="mouseDown(event)"'
		  		+ ' class="ibox float-e-margins sortable-item '+color+'">'

	  			+ '<div class="panel-heading ibox-title"> '	
	  					+ '<h5 title="'+wdtLabel+'">'+shortText(wdtLabel)+'</h5>'
	  					+ '<span class="nbElt"></span>' 
	  					
	  					+ '<span class="panel-controls"> '
							//COLLAPSE
							+ '<a href="" class="panel-control-collapse" title="Collapse the widget"></a>'
						
							//REFRESH
							+ '<a href="" class="panel-control-refresh" title="Refresh the widget content"></a>'   
						
							//EDIT
							+ '<a href="" class="panel-control-color"' + (bSharedView ? hidden : ' title="Custom the widget"') 
							+ '></a>'
							
							//SHARE										   
							+ '<a href="" class="panel-control-share"' + ((bDefault || bSharedView || bIsNew) ? hidden : ' title="Share this widget"') 
							+ '></a>'
							
							//SETTING / VIEW
							+ '<a href="" class="'+clsViewOnly+'panel-control-setting" title="'+clsTitle+'"></a>'
						
							//TO PERSONAL										   
							+ '<a href="" class="panel-control-personal"' + (bIsPersonal || bIsNew ? hidden : ' title="Save to personnal"') 
							+ '></a>'
							//REMOVE										  
							+ '<a href="" class="panel-control-remove"' + (bSharedView ? hidden : ' title="Remove the widget"') 
							+ '></a>'
							
						+ '</span> '
				+ '</div> ' //end heading

			+ '<div class="ibox-content" id="'+elId+'">'
			+ (wdtId === _EMPTY_WDT_ID ? '<i>[Need to specify]</i>' : '<i>Refresh to load datas</i>')
			+ '</div> '

	+ '</div>';
}

/**
 * Edit/Update a widget
 * @param wdtLabel : the widget Label
 * @param dWdt 	   : the widget (domId<=0 from common or personal else from view)
 */
function widgetEdit(dWdt, domId, updateCallBack) {
	if (!dWdt) {
		toastr.warning("Unknown widget " + domId + " !");
		return;
	}
	var lastLabel = dWdt.label;
	var lastView  = dWdt.view;
	var wId 	  = dWdt.id;

	//-
	//- Hide Save to personnal, if need
	//-
	var bClass = "col-xs-3 btn-success"; 
	var type = _DEFAULT_WDT;
	if (domId=="") 
		bClass = "hidden";

	if (isPersonal(wId))  {
		bClass = "hidden";
		type = _PERSONAL_WDT;
	}
	else if (isCommon(wId)) {
		type  = _COMMON_WDT; 
	}

	//Check if has search change;
	var oldSrch = dWdt["search"]; 
	if (! hasValue(oldSrch) ) oldSrch = emptySearch;
	else {
		//Complete
		$.each(emptySearch, function(key, val) {
			if ( !oldSrch[key]) oldSrch[key] = val;
		})
	} 

	//If has update callback  
	//If no callback => read only or shared view
	var bCannotUpdate = false; 

	//Don't allow to update Left common widget
	//Or widget of shared view 
	if (!updateCallBack || isSharedView()) {
		bCannotUpdate = true;
	}

	//Create a widget form
	var oWidtFrm = new WidgetFrm(dWdt, bCannotUpdate);
//	if (oWidtFrm.isChart()) {
//		bClass = "hidden";
//	}

	bootbox.dialog({
		title: "Widget ["+ type +"] ["+wId+"]"
		, message: oWidtFrm.getHtml()
		, className: "widget-box"	
			, buttons: {
				
				save: { label: "To personal"
					, className: bClass
					, callback: function () {  

						//If dSrch is empty
						var dSrch = oWidtFrm.getSearchValue();
						if ( ! hasValue(dSrch) ) {
							toastr.warning("Sorry! cannot save an unspecified widget.");
							return;
						}

						//Check if unique name
						var newName = oWidtFrm.getName();
						var name = $(".widgetName:contains('"+newName+"')").text();
						if (name === newName) {
							toastr.warning( "Please, give another one"
											, "Widget named " + newName + " already exists", _fixedOption);
							return false; //=> Don't close bootbox
						}

						//Change current widget to personnal
						dWdt["label"]  = newName;
						dWdt["view"]   = oWidtFrm.getView(); //Presentation
						dWdt["search"] = dSrch;

						//Call save to widget
						widgetSaveToPersonal(dWdt, updateCallBack);

					}//end callback
				}//end Save to perso

				, cancel: { label: (bCannotUpdate ? "Close" : "Cancel")
					, className:  "btn-default"
						, callback : function() {
							if (updateCallBack) updateCallBack();
						}
				}//end cancel

				, success: {
					label: "UPDATE",
					className: (bCannotUpdate ?  "hidden" : "btn-primary"),
					callback: function () {
			
						//Check if has changed
						var newName = oWidtFrm.getName();
						var newView = oWidtFrm.getView();  
						var bHasChanged   = (newName!=lastLabel || newView!= lastView);
			
						//Check if has search change;  
						var newSrch 	   = oWidtFrm.getSearchValue(); 
						var bChangeSearch  = (JSON.stringify(newSrch) != JSON.stringify(oldSrch));
						//var bChangeSearch = !isSame(newSrch, oldSrch);
			
						//NO CHANGE => nothing to do
						if (!bHasChanged && !bChangeSearch) {
							return;
						}
			
						//Check if has updated
						if (bChangeSearch) {
							bHasChanged = true;
			
							// If Edit is from View (domId!=""), 
							// and widget is COMMON or PERSONNAL => clone
							if (domId!="" && type!=_DEFAULT_WDT) {
								dWdt = $.extend(true, {}, dWdt);
								dWdt["id"] = getUniqId(dWdt.id);
							}
			
							//Update the search dictionnary with values from prompt
							dWdt.search = newSrch;
						}               	 
						else if (newView != lastView && domId!="") {
							//Only presentation view was changed, -> Reload view
							//$("#"+domId+" .ibox-content").html('<i class="fa fa-spinner fa-spin"></i>');
							_oSelectedView.htmlContent(domId, newView);
						}
			
						if (bHasChanged) {
							dWdt["label"] = newName;
							dWdt["view"]  = newView;
			
							//Get id for new widget
							if (dWdt["id"] == _EMPTY_WDT_ID) {
								dWdt["id"] = getUniqId(dWdt.id);
							}
			
							//Call calback for each widget caller type
							if (updateCallBack) {
								updateCallBack(dWdt, bChangeSearch);  
							}
						} 
					}
				}//end success
				
			}//end button
	});		
}//END

/**
 * DELETE Widget on left menu : Personal/Common Widget
 * @param wdtId
 */
function widgetMenuRemove(wdtId) {

	//-- REMOVE DEFAULT (admin or owner)
	var bIsCommon = isCommon(wdtId);
	
	//Get current widget
	var defWdt = (bIsCommon ? _oAppScope.getCommonWidget(wdtId) : _oAppScope.getPersonalWidget(wdtId)); 
	if (!defWdt) return;  
	delete defWdt["$$hashKey"];

	//Get widget to remove 
	var oWdtToUpdate = (bIsCommon ? _oAppScope._commonWidgets : _oAppScope._personalWidgets);
	delete oWdtToUpdate.widgets["$$hashKey"]; 

	//Save last number 
	var nbInit = oWdtToUpdate.widgets.length;
	
	//Remove
	var tWidgets = $.grep(oWdtToUpdate.widgets, function(oWdt) {
		return (oWdt.id != wdtId);
	});	 

	if (tWidgets.length == nbInit) return;

	//--- UPDATE --
	var savingCallback = function(bOk) {	
		if (!bOk){ //Failed => Restore
			oWdtToUpdate.widgets.push(defWdt); 
		}
		else if ( $("#"+wdtId).length >0 ) {
			$("#"+wdtId).remove();
		}
		_oAppScope.$apply();
	};

	//Save to WIDGET Settings file
	oWdtToUpdate.widgets = tWidgets;
	_oAppScope.$apply();
	
	if (bIsCommon) {
		SaveFile(_SHARED_WDT_FILE, oWdtToUpdate, savingCallback);
	} else {
		SaveToProfile(_WIDGET_FILE, oWdtToUpdate, savingCallback);
	}
}

/**
 * 
 */
function togglePersonalIcon(wdtId, bShow) {
	//Show icon Save To personnal, for existing dom
	if (_oSelectedView) { 
	   var lstDomId = _oSelectedView.getComponentIds(wdtId);
	   
	   console.log("togglePersonalIcon : ("+ wdtId + ") nb:" + lstDomId.length + " -> " + bShow);
	   $.each(lstDomId, function(i, eltId) { 
		   if (bShow)
			   $("#"+eltId + " .panel-control-personal").show();
		   else
			   $("#"+eltId + " .panel-control-personal").hide();
	   });
	} 
}

/**
 * Share A Widget
 */
function widgetShare(panel) {

	var id 	 = panel.attr("id"); 
	var oWdt = _oSelectedView.getWidget(id);
	if (!oWdt) return;

	if (isCommon(oWdt.id)) {
		toastr.info("This widget is already common<br>Threre is nothing to share");
		return;
	}

	var wdgId = oWdt.id; 
	if (wdgId == _EMPTY_WDT_ID) {
		toastr.warning("Sorry! you cannot share an empty widget", "Widget share", _fixedOption);
		return;
	}

	//Construct search json
	var dSearch = oWdt.search;
	if (!hasValue(dSearch)) {
		toastr.warning("Sorry! you cannot share empty/unknown widget", "Widget share", _fixedOption);
		return;
	} 

	getUserLists( function(tabUser) {
		if (!tabUser || tabUser.length==0) return; 
		
		var isShareToAll = (tabUser[0] == ALL || (ALL in tabUser)); 
		var tabUri = [];
		
		//Get uri
		var widgetUri = _PROFILE_ROOT_URI; 
		var userTarget = "";
		if (isShareToAll) { //Share to ALL 
			widgetUri += _SHARED_WDT_FILE; 
			tabUri.push(widgetUri); 

			//CHANGE SHARE icon
			$(".panel-control-share", panel).addClass("hidden");	
			
			userTarget = "ALL";
		}
		else { //- Share to an user 
			$.each(tabUser, function(w, user) {
				tabUri.push(widgetUri + user + "/" + _WIDGET_FILE); 
				userTarget += user + " ";
			});
		}
		
		//Duplicate  the widget & change its id
		var oShareWdt = $.extend(true, {}, oWdt);
		//Get new Id 
		oShareWdt.id = getUniqId(oWdt.id);
		
		$.each(tabUri, function(ix, fileUri) {
			
			//Get the user target widgets
			$.getJSON(_DATA_URI + _oAppScope._project + fileUri, function(jExtWdgt) {
	
				//Check if unique id && label  
				var strWidget = JSON.stringify(jExtWdgt.widgets);
				var strId = "\"" + oShareWdt.id + "\""; 
				while( strWidget.indexOf(strId)>0 ) {
					oShareWdt.id = getUniqId(oWdt.id);
					strId = "\"" + oShareWdt.id + "\"";
				}
				
				var curLabel = oWdt.label;
				var lblId = "\"" + curLabel + "\"";
				var ix = 0;
				while( strWidget.indexOf(lblId)>0 )
					lblId = "\"" + curLabel + "("+(++ix)+")" + "\"";
				if (ix>0) oShareWdt.label = curLabel + " ("+ix+")";
	
				//Append the new widget
				jExtWdgt.widgets.push(oShareWdt);
	
				//--- Save it ---
				SaveFile(fileUri, jExtWdgt, function(bOk) {								
					//SHARE TO DEFAULT
					if (isShareToAll) {
						//Update Widget to shared 
						oWdt.id     = oShareWdt.id;
						oWdt.search = oShareWdt.search; //Keep search
	
						//Append this to common
						panel.attr("for", (""+oShareWdt.id));
	
						//Update Angular view && Save the owner view
						_oAppScope.addWidget(oShareWdt, true);
					} 
					toastr.success("Widget is shared to: " + userTarget);
				} );
	
			}).error(function(err) {
				toastr.error("Failed to get widgets for: " + userTarget);
			}); 
		});
 
	});
}//end widgetShare

//============================================================================

//WIDGET PRESENTATION

//============================================================================
/**
 * Get GRID presntation for widget 
 */
function widgetGridPresentation(data) { 

	if (!data || (typeof data === "undefined") || data === null || data.length==0 )
		return _NO_DATA_MESS;

	var whtm= '<div class="row placeholders feed-element">';

	$.each(data, function(idx, dval) { 
		if (dval && Object.keys(dval).length>0) {
			var shref = dval.href; 	
			var path = dval.path; 

			var tabVal = formatResLine(dval, 10, true);

			var name = tabVal["filename"];
			var shortName = tabVal["shortname"];
			var version = tabVal["version"];
			var image = tabVal["image"];

			//Get short file name
			var i = path.lastIndexOf("/");
			var name = path.substring(i+1);

			var iClass = "img-grid";
			if (image.indexOf("dfem")>=0)
				iClass = "dfem-grid";
			else if (isDocument(shref)) {
				iClass = "doc-grid";
			}

			var badgeVersion = "";
			if (version) {
				badgeVersion = "<span class='badge badge-version badge-primary'>"+version+"</span>";
			}

			whtm += '<div class="col-xs-3 col-sm-3 col-md-3 col-lg-3">'
				+ '<div class="thumbnail">'
				+ '	<a href="javascript:openFile(\''+shref+'\')" title="'+path+'">'
				//+ '<a href="'+shref+'" target="_blank" title="'+path+'">' 
				+ '	<img class="'+iClass+'" alt="'+name+'" src="'+image+'">'
				+ badgeVersion
				+ '</a>'
				+ '<div class="caption">'
				+ '<h7>'+shortName+'</h7>'
				+ '</div>'
				+ '</div>'
				+ '</div>';
		}
	});

	whtm += '</div>';
	return whtm;
}

/**
 * Widget LIST Presentation
 * @param data
 * @returns
 */
function widgetListPresentation(data) { 

	if (!data || (typeof data === "undefined") || data === null || data.length==0) 
		return _NO_DATA_MESS;

	var whtm= '<div class="feed-activity-list">';

	$.each(data, function(idx, dval) { 
		if (dval && Object.keys(dval).length>0) {		
			var shref = dval.href; 
			var path  = dval.path; 

			var tabVal 		= formatResLine(dval, 40, true); //Remove Path
			var filename 	= tabVal["filename"];
			var shortName 	= tabVal["shortname"];
			var version 	= tabVal["version"]; 
			var image 		= tabVal["image"];

			var iClass = "img-list";
			if (isDocument(shref)) {
				iClass = "doc-list";
			}

			var badgeVersion = "";
			if (version) {
				badgeVersion = "<span class='pull-right badge badge-version badge-primary'>"+version+"</span>";
			}

			whtm += '<div class="feed-element">'
				+ '<a class="pull-left" href="'+shref+'" style="color:#a8acb1;">'
				+ 	'<img class="'+iClass+'" alt="" src="'+image+'">'
				+ '</a>'

				+ '<div class="media-body">' 
				+ '<a href="javascript:openFile(\''+shref+'\')" title="'+path+'">'
				//+ '<a href="'+shref+'" target="_blank" title="'+path+'">'
				+ shortName+'</a>'
				+ badgeVersion
				+ '</div>'

				+ '</div>';
		}
	});

	whtm += '</div>';
	return whtm;
}

/**
 * Widget LINK (href) Presentation
 * @param data
 * @returns
 */
function widgetLinkPresentation(data) { 

	if (!data || (typeof data === "undefined") || data === null || data.length==0) 
		return _NO_DATA_MESS;

	var whtm= '<div class="feed-activity-list">';

	$.each(data, function(idx, dval) {
		if (dval && Object.keys(dval).length>0) {
			var shref = dval.href;
			var path = dval.path; 

			var	image = '<i class="fa fa-file pull-left" style="color:#a8acb1;margin:5px 0px;"></i>';
			dval.img = image; //set image => not search formatResLine

			var tabVal 		= formatResLine(dval, 35, true);
			var filename 	= tabVal["filename"];
			var shortName 	= tabVal["shortname"];

			//!!! Clear dVal for not keeping when switch
			dval.img = "";
			
			var version 	= tabVal["version"];
			var badgeVersion = "";
			if (version) { 
				badgeVersion = "<span class='badge badge-version badge-primary pull-right'>"+version+"</span>";
			} 

			whtm += '<div class="feed-element">'
				+ '<a class="pull-left" href="'+shref+'">'+ image +'</a>'
				+ '<div class="media-body-l">' 
				+ '<a href="javascript:openFile(\''+shref+'\')" title="'+path+'">'
				//+ '<a href="'+shref+'" target="_blank" title="'+path+'">'
				+ filename+'</a>'
				+ badgeVersion
				+ '</div>'
				+ '</div>';
		}
	});

	whtm += '</div>';
	return whtm;
}

/**
 * Save a widget to personal
 * @param dWdt
 * @param type
 * @param updateCallBack
 */
function widgetSaveToPersonal(dWdt, updateCallBack) {

	var wdtId = dWdt.id;

	// Duplicate && Generate a new id, only if COMMON
	var newWdt = dWdt;  
	if (isCommon(wdtId) || wdtId.endsWith("_shared")){
		newWdt = $.extend(true, {}, dWdt);
		newWdt["id"] =  getUniqId(wdtId);  
	}

	//Add to personnal
	var pWidget =  $.extend(true, {}, _oAppScope._personalWidgets);
	pWidget.widgets.push(newWdt);

	//Save the personal widget 
	SaveToProfile(_WIDGET_FILE, pWidget, function(bOk) { 
		if (bOk) {
			
			//Update PERSONAL WIDGET angular view
			_oAppScope._personalWidgets.widgets.push(newWdt);
			_oAppScope.$apply(); 

			//Hide panel-control-personal
			togglePersonalIcon(wdtId, false);

			if (updateCallBack) {
				updateCallBack(newWdt, true);
			}

			//---
			//Toggle Personnal widget
			//---
			var $li = $("#personalWdt").closest("li");
			if (! $("#personalWdt").hasClass("in")) {
				$( "a", $li).trigger("click");
			} 
		} 
		else if (updateCallBack) {
			updateCallBack();
		}
	}); 

}//End widgetSaveToPersonal

/**
 * Save a widget & reload it
 * @param bReload
 */
function savePersonalWidget(dWtd, fCallBack) {

	//- Find the widget and change it's specification
	var bFound = false;
	$.each(_oAppScope._personalWidgets.widgets, function(idx, wdt) {
		
		if (wdt.id == dWtd.id) {
			bFound = true;
			
			//If found, REPLACE
			_oAppScope._personalWidgets.widgets.splice(idx, 1, dWtd);
			_oAppScope.$apply();
			
			//Save WIDGET.json
			SaveToProfile(_WIDGET_FILE, _oAppScope._personalWidgets, function(bOk) {
				//- Refresh the widget box
				if (bOk) _oAppScope.$apply();
				if (fCallBack) fCallBack(bOk);
			});//end SaveToProfile
			return false; //break
		}
	});
	
	if (!bFound) {
		if (fCallBack) fCallBack(false);
	}
}

/**
 * Update all widget content for the user views
 * @param wdtId
 * @param dWdt
 * @returns {Boolean}
 */
function updateWidgetsOfViews(wdtId, dWdt) {	
	
	//Save the widgets before
	savePersonalWidget(dWdt, function(bOk) {
		if (!bOk) return;
		
		//--------------------------------------------
		//	UPDATE All Widget on the entire view
		//----------------------------------------------
		//String to change
		var strId = "\""+wdtId+"\"";
		var bHasUpdate = false;
		$.each(_oAppScope._personalViews, function(idx, oView) {
			
			if (JSON.stringify(oView).indexOf(strId)<0 ) return true; //continue
	 
			for (var j=0; j<oView.content.length; j++) {	
				var tContent = oView.content[j]; 
				if (JSON.stringify(tContent).indexOf(strId)<0 ) continue;
				
				var tWidgets =  tContent.widgets; 
				if (tWidgets) { 
					for (var i=0; i<tWidgets.length; i++) {
						var dWidget = tWidgets[i];
						if (dWidget.id == wdtId) {
							tWidgets[i].search = dWdt.search; 
							bHasUpdate = true;
						}
					} //end for
				}
				else if (tContent.id == wdtId) { 
					oView.content[j].search = dWdt.search; 
					bHasUpdate = true;
				} 
			};
			 
		});
	
		//If bHasUpdate => Save view.json
		if (bHasUpdate) {
			SaveToProfile(_VIEW_FILE, _oAppScope._personalViews, function(bOk) {
				if (!bOk) return;
				
				//Refresh concerned widgets of current view
				if (_oSelectedView) {
					var lstDomId = _oSelectedView.getComponentIds(wdtId);
					$.each(lstDomId, function(x, eltId) {
						//Hide icon
						$("#"+eltId + " .panel-control-personal").hide(); 
						
						//Reload the widget
						refreshWidget(eltId);
					});
				}
					
			});
		} 
	});
	
} //end function

//======================================== END WIDGET ================================================

