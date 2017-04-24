//========================================================== 
// 
// 	VIEW Handler
//
//  version : 2.1.0
//============================================================
 
var _TO_UDATE_COLOR = "#df5640";
var _DEFAULT_VALUE = { "label" : "Unknown" 
	, "color" : "panel-default"
	, "view" : "list"
	, "type" : ""  
}

/**
 * Get a new view Id
 */
function viewId(oldId) {
	return getUniqId(oldId, true);
}

/**=================================================================
 * 
 * 					View Object
 * 
 *==================================================================*/

function View(jdata, type) { 

	/* Attributes */ 
	this._data 	   = jdata; /* Save data origin for other attributes if needed*/

	this._id  	   = jdata["id"];  
	this._tcontent = jdata["content"];
	this._type     = type;
	
	//Widget by domId : widget object
	this._dWidgetsByDomId = {};

	//Widget by domId : result showed
	this._dataWidgets = {};

	/* flag for change */
	this._wasChanged = false;
	this._posChanged = false;
	
	this._charts = {};
	
	/** View Name */
	this.name = function() {
		return this._data.name;
	}
	
	/** View study */
	this.study = function() {
		return this._data.study;
	}
 
	/** Update name */
	this.rename = function(newName, isShared) {

		var $this = this; 
		var idx = -1; 

		var tabView;
		if (isShared) 
			tabView = _oAppScope._sharedViews.views;
		else 
			tabView = _oAppScope._personalViews.views;
		
		var oldName = this.name();
		var renameOk = function(bOk) { 
			var dView = tabView[idx];
			
			if (!bOk) {
				//Restore
				dView.name = oldName;
			}
			else { 
				$this._data.name = newName;
				dView.name 	 = newName; 
				  
				//Save setting
				updateSettings("SelectedView", dView.id);
				
				//Apply
				_oAppScope.$apply();
				
				//Refresh angular view 
				if ( $("#viewLabel").text() != _oAppScope._oSelectedView.name() )
					$("#viewLabel").text(newName);
			}
		}
		
		//find view & rename Id
		for (idx=0; idx<tabView.length; idx++) {
			var dView = tabView[idx];
			if (dView.id == $this._id) { 
				
				if (isShared) {
					_oAppScope._sharedViews.views[idx].name = newName;   
					SaveFile(_SHARED_VIEW_FILE, _oAppScope._sharedViews, renameOk);
				}
				else {
					_oAppScope._personalViews.views[idx].name = newName;  
					SaveToProfile(_VIEW_FILE, _oAppScope._personalViews, renameOk); 
				}
				break;
			}
		} 
	};
	
	this.hasContent = function() {
		return (Object.keys(this._dWidgetsByDomId).length>0);
	}

	/** Link structure content to an unique dom id */
	this.linkToContent = function(domId, obj) {
		this._dWidgetsByDomId[domId] = obj; 
	}
	
	this.updateWdtDomLink = function(domId, newWdt) {	
		//Get old widget id
		var oldWid = this._dWidgetsByDomId[domId].id;
		
		delete newWdt["$$hashKey"];
		
		var bFound = false;
		//Replace in tContent
		for (var i=0; !bFound && i<this._tcontent.length; i++) {
			var dContent = this._tcontent[i];
			 
			if (dContent.group) {
				for (var j=0; j<dContent.widgets.length; j++) {
					var wdt = dContent.widgets[j];
					if (wdt.id == oldWid) {
						//Replace
						dContent.widgets.splice(j, 1, newWdt);
						this.flagChange();
						bFound = true;
						break;
					}
				}
			}
			else if (dContent.id == oldWid) { //Ungrouped WIDGET
				
				//console.log("Replace by\n" + JSON.stringify(newWdt, null, "\t"));
				//console.log("this._tcontent Before\n" + JSON.stringify(this._tcontent, null, "\t"));
				
				//Replace by new
				this._tcontent.splice(i, 1, newWdt);
				
				//console.log("this._tcontent\n" +  JSON.stringify(this._tcontent, null, "\t"));
				
				this.flagChange();
				bFound = true;
				break;
			}
		}
		
		//Replace
		this._dWidgetsByDomId[domId] = newWdt;
	}

	/** Link structure content to an unique id */
	this.getWidget = function(domId) {
		var oWdt = this._dWidgetsByDomId[domId];
		if (!oWdt) return {};
		
		//If no specification, get from common (if found)
		if (oWdt.id != _EMPTY_WDT_ID && !hasValue(oWdt["search"]) ) {
			var wdgtCommon = getCommonOrPersonalWidget(oWdt.id); 
			if (wdgtCommon) oWdt["search"] = $.extend(true, {}, wdgtCommon.search);
		}
		return oWdt;
	}
	
	/** Get the component id (domId) from widget id  */
	this.getComponentIds = function(wdgId, dSearch) {
		var lst = new Array();
		$.each(this._dWidgetsByDomId, function(domId, dWdt) {
			if (dWdt.id == wdgId) {
				lst.push(domId);
				
				//Update search
				if (dSearch) {
					dWdt.search = dSearch;
				}
			}
		});
		return lst;
	}


	/** Update dictionary content */
	this.updateContent = function(domId, key, value) {
		var dObj = this._dWidgetsByDomId[domId];

		if (dObj) {
			if (dObj[key]) //has this key : update it
				dObj[key] = value;

			else if (dObj["group"]) {//if has group, append to option
				if (!dObj["options"])
					dObj["options"] = {};
				dObj["options"][key] = value;
			}
			else
				dObj[key] = value;

			this.flagChange();
		}
	}

	/** Add New widget to View
	 * @param domId : the DOM id of the widget
	 * @param wdtId : the widget id
	 * @param sLabel : the widget label
	*/
	this.dropWidget = function(domId, wdtId, sLabel, gpEltId) {

		//Set new widget with own
		var dWdt = {  "id"	   : wdtId
					, "label"  : cleanText(sLabel)
					, "view"   : "grid"
				    , "type"   : "" 
					, "search" : {}
				 };
 
		//If common/personal widget was dragged
		var defWdt = getCommonOrPersonalWidget(wdtId); 
		if (defWdt) {
			dWdt["view"] = defWdt.view; //look type
			dWdt["type"] = defWdt.type; //look type
			
			//Clone search !!!NEW
			dWdt["search"] = $.extend(true, {}, defWdt.search);
		}
		//else  //New widget 

		this._dWidgetsByDomId[domId] = dWdt;

		//Append it to group
		if (gpEltId) {
			var dGroup = this._dWidgetsByDomId[gpEltId];
			if (dGroup)
				dGroup.widgets.push(dWdt);
			else
				this._tcontent.push(dWdt);
		}
		else
			this._tcontent.push(dWdt);

		//Signal change
		this.posChange();
	}

	/** Add new group to content */
	this.addGroup = function(gpEltId, gpName) {
		var dGroup = { "group"  : gpName
						, "options": {"color": "panel-default"}
						, "widgets": []
		};

		this._dWidgetsByDomId[gpEltId] = dGroup; 
		this.posChange();
	}

	/** Remove a widget or group from view */
	this.deleteDomFrom = function(domId) {
		delete this._dWidgetsByDomId[domId]; 
		this.posChange();
	}

	/** Update study */
	this.updateStudy = function(study) {
		this._data.study = study;
		this.flagChange();
	};

	/** Check if has data */
	this.hasData  = function() { 
		if (!this._tcontent) {
			this._tcontent = new Array();
		}
		else if (this._tcontent.length==1) {
			return hasValue(this._tcontent[0]);
		}
		return (this._tcontent.length>0);
	};

	/** Update view content */
	this.update = function(bSave, callback) { 
		//Read study
		this._data["study"] = getStudy();

		//Relire les colonnes et reordoner content
		var content = [];
		var dWidgets = this._dWidgetsByDomId;

		$('.sortable-column').each( function(i, oDivSortable) { //-1

			//Get colomn elements
			$(oDivSortable).children().each( function(j, divElt) { //2

				//If element is not an empty box
				if (divElt.className.indexOf("emptyBox")<0)  {

					var id = divElt.id;
					
					if (id) { 
						//if is group
						if (divElt.className.indexOf("widgetContainer")>=0)  {
	
							//get all widgets of the group
							var dGroup = dWidgets[id];
							tWidgets = [];
	
							//var uiSortable = divElt.childNodes[1];
							var uiSortable = $('.ibox.sortable-list', divElt);
	
							//Get all widgets
							$.each(uiSortable.children(), function(l, divWdt) {
								var wid = divWdt.id;
								var dwdt = dWidgets[wid];
								delete dwdt["$$hashKey"];
								if (dwdt) tWidgets.push(dwdt);
							});
	
							dGroup.widgets = tWidgets;
							dGroup["column"] = (""+i);
							content.push(dGroup);    				
						}
						else { //Widget
							var dWidt = dWidgets[id];
							if (dWidt) {
								dWidt["column"] = (""+i);
								delete dWidt["$$hashKey"];
								content.push(dWidt);
							}
						}//end if
					}

				} //end if

			}); //2
		}); //-1

		//Update data content
		this._tcontent   = content;
		this._posChanged = false;

		//Sauver dans view json (_VIEW_FILE)
		if (!this._wasChanged) flagChange();
		if (bSave) {  
			this.store(callback);
		} 
	};
	
	/** View Position was changed */
	this.posChange = function(bReset) {
		//Don't allow to change Shared view
		if (!isUserAdmin() && this._type == _SHARED_VIEW) {
			this.flagChange(true); 
			return;
		}
		
		this._posChanged = true;
		this.flagChange(); 
		
		//blink(true, bReset); 
		if (this._wasChanged) {
			toastr.warning("Need to save !", "View has changes");
		}
	};
	
	/** Set Flag of update to true */
	this._BlinkTimer = null;
	this.flagChange = function(bEnd) {  
		//Set flag
		if (bEnd) {
			this._wasChanged = false; 
			this._posChanged = false;
		}
		else  {
			if (!isUserAdmin() && this._type==_SHARED_VIEW) return;
			this._wasChanged = true; 
		}
		
		//Color it
		$("#saveView").css("color", (bEnd ? "" : _TO_UDATE_COLOR) );
		
		//Blink
		/*
		if (this._BlinkTimer) clearInterval(this._BlinkTimer);
		if (bEnd) {
			$("#saveView").show();
		}
		else {
			this._BlinkTimer = setInterval( function() {
				if ( $("#saveView").is(":visible") )
					$("#saveView").hide(); 
				else
					$("#saveView").show();
			}, 600);
		}
		*/
	}; 

	/** Save view to file */
	this.store = function(callback, bToastr) {  
		if (!this._wasChanged) {return;}
		
		if (this._posChanged) {
			this.update();
		}

		//Create delegate 
		var $this = this;
		var afterSavedCallback = function(bOk) {
			$this.flagChange(true);
			
			//Callback
			if (callback) {
				callback(bOk);
			}
			
			if (bOk && bToastr)
				toastr.success("View saved successfully !");
		 }; 

		//---------------------------
		// Updating views 
		//---------------------------
		jdata["study"]	 = this.study(); 
		jdata["name"]	 = this.name();
		jdata["content"] = this._tcontent; 
 
		//Save json file 
		if (this._type == _SHARED_VIEW) { 
			SaveFile(_SHARED_VIEW_FILE, _oAppScope._sharedViews, afterSavedCallback); 
		}
		else {
			SaveToProfile(_VIEW_FILE, _oAppScope._personalViews, afterSavedCallback); 
		}
	}; 
	
	/**
	 * Create widget html element
	 */
	this.getWidgetElt = function(dWdt) {
		
		//Th widget id
		var wdtId 	= dWdt.id;
		if (!wdtId) return "";
		
		//Complete information with shared
		var dDefault = getCommonOrPersonalWidget(wdtId);
		if (dDefault) {
			if (!hasValue(dWdt["search"]) )
				dWdt["search"] =  $.extend(true, {}, dDefault.search);
			
			$.each(_DEFAULT_VALUE, function(key, value) {
				if (!dWdt[key]) {
					if (dDefault[key]) value = cleanText(dDefault[key]);
					dWdt[key] = value;
				}
			});
		}
		
		//Get dom Id
		var domId = uniqId();
		
		//Update view
		this.linkToContent(domId, dWdt);
 
		//Create widget
		return widgetHTML(dWdt.label, wdtId, domId, dWdt.color);
	}
	 
	/*
	 * Because of loading image is so long 
	 * Don't reload view if data content was not change
	*/ 
	this.isContentChange = function(id, newJData) {
		var oldJData = this._dataWidgets[id];
		if (oldJData && newJData) {
			if (JSON.stringify(oldJData) == JSON.stringify(newJData))
				return false;
		}
		return true;
	}
	 	
	/** Set html content */
	this.htmlContent = function(id, nview, jData) {

		if (!jData) //Reload
			jData = this._dataWidgets[id];
		else { 
			this._dataWidgets[id] = jData;
		}
  
		var cid = "#"+id+" .ibox-content"; 
		if (!jData) {
			$(cid).html(_NO_DATA_MESS);
			$("#"+id+" .nbElt").hide();
			$(cid).css("overflow", "hidden");
			return;
		}

		var view = nview.toLowerCase().trim();

		var sContent = "";
		var maxNum = 8;
		if (view === "grid") { 
			sContent = widgetGridPresentation(jData);
		} 
		else if ( view === "link"){
			maxNum = 19; 
			sContent = widgetLinkPresentation(jData);
		} 
		else {
			maxNum = 13; 
			sContent = widgetListPresentation(jData);
		}
		
		//SET HTML content
		$(cid).html(sContent);
		
	    if (jData.length > maxNum) 
	    	$(cid).slimScroll({height : '90%'});
	    else 
	    	$(cid).css("overflow", "hidden");
 
        var nb = jData.length;
        if (nb>0) {
        	$("#"+id+" .nbElt").html(nb);
        	$("#"+id+" .nbElt").show();
        } 
	}
	

	
	/** Set html content */
	this.draw = function(id, type, jData) {

		var _PERCENT = "Percentage of completion";
		
		if (!jData) //Reload
			jData = this._dataWidgets[id];
		else { 
			this._dataWidgets[id] = jData;
		}
  
		var cid = "#"+id+" .ibox-content"; 
		$("#"+id+" .nbElt").hide(); 
		
		if (!jData) {
			$(cid).html(_NO_DATA_MESS); 
			$(cid).css("overflow", "hidden");
			return;
		}
		 
		var tabData  = ['dossier'];
		var tabFiles = [];
		var tabPath = [];

		var getFilename = function(path) { 
			tabPath.push(path);
			
			if (path.endsWith("/")) path = path.susbtring(0, path.length-1);
			
			var i = path.lastIndexOf("/?") ;
			if (i<0) i = path.lastIndexOf("?");
			if (i>0)path = path.substring(0, i);
			
			i = path.lastIndexOf("/");
			return path.substring(i+1); 
		}
		var filenameOf = function(x) {
			var path = tabFiles[x];
			return getFilename(path); 
		}
		
		var getPath = function(d) {
			return tabPath[d];
		}
		
		var maxLng = 0;
		$.each(jData, function(idx, obj) {
			var path = obj.path; 
			var filename = getFilename(path);
			tabFiles.push(filename);
			var n = filename.length * 4;
			if (maxLng<n) maxLng = Math.floor(n);
			
			var percent = obj[_PERCENT];
			if (!percent) percent = "0";
			tabData.push(percent);
		});
		//if (maxLng>80) maxLng = 80;
		
		var sTypeView = type.toLowerCase().trim();
		if ( $.inArray(sTypeView, _CHART_TYPE)< 0){  
			sTypeView = 'bar';
		}
		
		var sColor = $(".text-navy").css("color");

		var oChart = this._charts[id];
		if (oChart) {
			oChart.unload();
			//oChart.destroy();
//			oChart.load({ categories: tabFiles, columns: [tabData] });
		}
//		else {
			var dChart = {
		            bindto: cid
		            , data: { columns: [tabData] 
		            		 , type: sTypeView
		            		}
		            , axis: {
		                x: { type: 'category'
		                    , tick: { rotate: -40, multiline: false }
		                    , height: maxLng  
		                } 
		                , y: { label: { text: '%' } }
		            }//axis
		            , legend: { show: false }
		            , grid: { x: {show: false}, y: {show: true} }
		            , size: { height: 350 }
		            , color: { pattern: [sColor] }
		            , padding: { top: 10, right: 15, bottom: 0 }
		        }; ///End data
			
			if (sTypeView == 'bar') dChart['bar'] = { width: { ratio: 0.4 } };
			
			var myChart = c3.generate(dChart);
			myChart.load({categories: tabFiles});
			
			//Save chart
			this._charts[id] = myChart;
		//}

	};//end draw
  
}//==========================End class view ==================== */


/** ---------------------------------------------------------------
 * 				VIEW HANDLER
 *------------------------------------------------------------------*/

/**
 * Check if unique view name
 * @param sViewName
 * @returns {Boolean}
 */
function viewIsUniqueName(sViewName) {
	var name = $(".viewName:contains('"+sViewName+"')").text();
	return (name !== sViewName);
}

/**
 * Remove Shared View
 * @param viewId 
 */
function viewRemoveShared(viewId) { 
	
	$.each(_oAppScope._sharedViews.views, function(idx, dView)  {
		 
		if (dView.id != viewId) return true; //continue;
		
		if (isUserAdmin() || dView.id.indexOf("_"+_oAppScope._login+"_")>0) { 
			
			//Remove from shared view
			_oAppScope._sharedViews.views.splice(idx, 1);
			
			//Save to shared-view.json 
			SaveFile(_SHARED_VIEW_FILE, _oAppScope._sharedViews, function(bOk) {		
				if (!bOk) {
					//If failed => Restore
					_oAppScope._sharedViews.views.splice(idx, 1, dView);
				}
				else {
					//Clear page if selected view is removed
					viewClean(viewId);
				}
				_oAppScope.$apply();
			});
		}
		else {
			toastr.warning("Only administrator can remove a shared view !");
		}
		return false; //break
	} );
}

/**
 * Create new view object
 * @param name : the view name
 * @returns
 */
function viewGetNew(name, tabContent) {
	if (!tabContent) tabContent = [];
	
	var dView = {  "name"  		: name 
			     , "id"    		: viewId() 
				 , "study" 		: getStudy() 
				 , "content" 	: tabContent
				 , "type" 		: ""
	};
	
	//Change angular view item
	_oAppScope._personalViews.views.push(dView); 
 
	//Return index
	var oView = new View(dView);
	oView._wasChanged = true;  
	
	return oView;
}

function viewRename() {
	if (!_oSelectedView) return;

	var isShared = false;
	if (isSharedView()) {
		isShared = true;
		if (!isUserAdmin()) {
			toastr.warning("You cannot rename a shared view !");
			return;
		}
	}
	var curName = _oSelectedView.name();
	bootbox.prompt({ size: "small"
		    , title : "New name of the view ?"
		    , value : curName
			, callback: function(sViewName) {
				if (sViewName !== null && sViewName.trim() !== ""
					&& curName != sViewName) { 
					_oSelectedView.rename(sViewName, isShared);
				}
				else if (curName == sViewName) {
					toastr.warning("The view : "+ sViewName+" already exists", "Please, give another one");
					return false;
				}
			}
	}); 
}

/**
 * Create new view (empty page)
 */
function viewCreateNew() {

	var editBox = '<form class="form-horizontal"> '
		+ '<fieldset> ' 
		+'<div class="form-group"> ' 
		+	'<label class="col-md-3 control-label" for="name">View Name :</label> ' 
		+	'<div class="col-md-9"> ' 
		+		'<input id="viewName" name="name" type="text" placeholder="View name" '
		+		' class="form-control"> ' 
		+	'</div> ' 
		+'</div> ' 

		+'<div class="form-group"> ' 
		+	'<label class="col-md-3 control-label" for="view">Study path :</label> ' 
		+	'<div class="col-md-9"> '
		;

	var study = getStudy();	
	editBox +=	'<select id="viewstudy" class="form-control">'; 
	$.each(_oAppScope._lStudies, function(i, std) {
		if (study == std)
			editBox += '<option value="'+ std +'" selected>'+ std +'</option>';
		else
			editBox += '<option value="'+ std +'">'+ std +'</option>';
	}); 		 
	editBox +=	 '</select> ';
	editBox +=' 	</div> ' 
		+ '	</div> '  
		+ '</fieldset>'
		+ '</form>';
 
	bootbox.dialog({
		title: "Create a new view",
		size : "medium",
		message: editBox, 
		buttons: {
			cancel: { label: "Cancel", className: "btn-default" },
			successs: {
				label: "Ok", className: "btn-primary",
				callback : function (e) {
					var sViewName = $("#viewName").val();

					if (sViewName) { 
						//Check unique view name
						if (!viewIsUniqueName(sViewName)) { 
							toastr.warning("The view name: "+sViewName+" already exists"
											, "Cannot create view", _fixedOption );
							return false; //Re-prompt
						}
						
						//Change study
						var study = $('#viewstudy').val();
						$('#study').text(study);

						//Create the view
						var oView = viewGetNew(sViewName);

						//Load the new view to create empty boxes
						loadSelectedView(oView);

						//Save view setting
						if (_oSelectedView) {
							_oSelectedView.posChange();
							_oSelectedView.store();
						}
						
						//---
						//Toggle Personnal View menu if closed
						//--- 
						if (! $("#collapseView").hasClass("in")) { 
							$("#collapseView").addClass("in");
						}  
					}
				}
			}
		}
	});
}

/**
 * Save view
 * @param bShowConfirm
 */
function viewSave(callback) {
	if (!_oSelectedView) {
		if (callback) callback(false);
		return;
	}

	if ( !isUserAdmin() && isSharedView()) {
		toastr.info("Cannot save shared view. Use SaveAs instead !");
		return;
	}

	if (!_oSelectedView.study()) {
		
		var std = getStudy();
		if (std)
			_oSelectedView.updateStudy(std);
		else { 
			if (callback) {
				callback(false);
			}
			else
				toastr.warning("Please, select a study folder before !");
			return;
		}
	}

	_oSelectedView.flagChange();
	_oSelectedView.store(callback, true);
}

/**
 * View save As
 */
function viewSaveAs() { 
	if (!_oSelectedView) return;

	bootbox.prompt({  
		size: 'small',
		title: "Name of the new view ?", 
		callback: function(sViewName){
			//Toggle 
			if (! sViewName) return;

			//Check unique view name
			if (! viewIsUniqueName(sViewName)) { 
				toastr.warning("The view : "+ sViewName+" already exists", "Cannot create same view");
				return;
			}

			//Clone the current view content
			var tcontent = $.extend(true, [], _oSelectedView._tcontent);
			
			//Change widgets Ids, Keep common && personal
			$.each( tcontent, function(x, obj) {
				var tGroup =  obj.widgets; 
				if (tGroup) { 
					//Invert for, because of deleting
					$.each(tGroup, function(y, wdgt) {
						//Keep common && personal
						if (!isCommon(wdgt.id) && !isPersonal(wdgt.id))
							obj.id = getUniqId(wdgt.id);
					}); 
				}
				else if (!isCommon(obj.id) && !isPersonal(obj.id)) {
					obj.id = getUniqId(obj.id);
				}
			});

			//Create the new view with this content
			var oView = viewGetNew(sViewName, tcontent);
			oView.store(function afterSave(bOk) {
				if (bOk) {
					//Load the new view & select activating
					loadSelectedView(oView); 
				}
			});
		}//end function
	});//end bootbox
} 

/**
 * Share view
 */
function viewShare() { 
	if (!_oSelectedView) return;

	if (isSharedView()) {
		toastr.info("This view is already shared");
		return;
	}

	var shareCallBack = function(tabUser) {
		if (!tabUser || tabUser.length==0) return;

		var isShareToAll = ($.inArray(ALL, tabUser) >= 0);
		 
		var tabUri = [];
		var viewfileUri = _PROFILE_ROOT_URI;
		if (isShareToAll) {
			viewfileUri += _SHARED_VIEW_FILE;  
			tabUri.push(viewfileUri);
		}
		else {
			$.each(tabUser, function(w, user) {
				tabUri.push(viewfileUri + user + "/" + _VIEW_FILE);
			});
		}  
		
		//Duplicate this view
		var viewToShare = $.extend(true, {}, _oSelectedView._data);

		//------
		// If shared to common => Get new Ids 
		// Il faut dissocier les 2 vues, car visible en meme temps sur la page
		// If for a person : keep all (tracabilite)
		//------------ 
		if (isShareToAll) {
			viewToShare["id"] = viewId(viewToShare.id); // + "_shared"; 
			
			//Change Personal/owner widgets Ids, but Keep common
			$.each(viewToShare.content, function(z, obj) {
				var tGroup =  obj.widgets; 
				if (tGroup) { 
					//Invert for, because of deleting
					$.each(tGroup, function(y, wdgt) {
						//Keep common && personal
						if (!isCommon(wdgt.id) )
							obj.id = getUniqId(wdgt.id);
					}); 
				}
				else if (!isCommon(obj.id)) {
					obj.id = getUniqId(obj.id);
				}
			});
		}  
		
		$.each(tabUri, function(ix, fileUri) {
		
			//Read view.json of the target
			$.getJSON(_DATA_URI + _oAppScope._project + fileUri, function(viewJson) {
				
				//Ensure that the view has uniq id
				var vId = viewToShare.id;
				while (JSON.stringify(viewJson).indexOf("\""+vId+"\"")>0) {
					vId = viewId(vId);
				}
				viewToShare.id = vId; 
				
				//Append 
				viewJson.views.push(viewToShare);
				
				//Save after project
				SaveFile(fileUri, viewJson, function(bOk) {
					if (bOk) {
						toastr.success("View ["+_oSelectedView.name()+"] was shared with : " 
											   + fileUri.substring(0, fileUri.indexOf("/")));
	
						if (isShareToAll) { //Push to change view
							_oAppScope._sharedViews.views.push(viewToShare);
							_oAppScope.$apply();
						}	
					} 
				});
	
			}).error(function(err) {
				toastr.error("Failed to get view for: " + err);
			}); 
			
		});//end each
	}
	
	//-
	//- Get list of logged users
	//-
	if (!_oSelectedView._wasChanged) 
		getUserLists(shareCallBack); 
	else {
		bootbox.confirm({ size:"small"
			, message: "This view has changes<br>Save it before sharing ?"
				, callback: function(bOk) {
					if (bOk) {
						_oSelectedView.store();
					}

					//Get list of users
					getUserLists(shareCallBack);  
				} 
		});
	}
}

function viewClean(viewId) {
	//Clear page if selected view is removed
	if (_oSelectedView && (_oSelectedView._id == viewId)) {

		//Clear view Page
		for (var j=0; j<3; j++) {
			$("#column-"+j).html("");
		}
		
		_oSelectedView.flagChange(true); //Reset save icon
		_oAppScope.selectView(null);
	}
}

//--
//Remove  VIEW
//--
function viewRemovePersonal(viewId) {
	
	//Duplicate current view
	var dViews = $.extend(true, {}, _oAppScope._personalViews); 
	 
	//Save callback
	var SavedCallback = function(bOk) {	
		if (bOk) {
			_oAppScope._personalViews = dViews;
			
			//Clear page if selected view is removed
			viewClean(viewId);
		}

		//Update view
		_oAppScope.$apply();
	}
	
	//!!! View name Is Unique by user, get real index from json view 
	var tViews = dViews.views;
	for (var i=0; i<tViews.length; i++){ 
		if (tViews[i].id === viewId) { 
			//Remove this
			dViews.views.splice(i, 1); 
			//Save the user json file
			SaveToProfile(_VIEW_FILE, dViews, SavedCallback);
			break;
		}
	}  
}

/**
 * Update all widget : remove or update content
 * @param wdtId
 * @param bRemove
 */
function viewUpdateAllWidget(wdtId, bRemove) {	

	//String to change
	var strId = "\""+wdtId+"\""; 
	$.each(_oAppScope._personalViews.views, function(idx, tView) {
		
		//Continue
		if (JSON.stringify(tView).indexOf(strId)<0 ) return true; //Continue

		var m = tView.content.length - 1;
		
		//Invert for, because of deleting
		for (var j=m; j>=0; j--) {	
			var tContent = tView.content[j];

			if (JSON.stringify(tContent).indexOf(strId)<0 )  continue;
			
			var tWidgets =  tContent.widgets; 
			if (tWidgets) {
				var n = tWidgets.length - 1;
				
				//Invert for, because of deleting
				for (var i=n; i>=0; i--) {
					var dWidget = tWidgets[i];
					
					if (dWidget.id == wdtId) {
						if (bRemove) {
							//Delete this from array
							tWidgets.splice(i, 1); 
						}
					}
				} //end for
			}
			else if (tContent.id == wdtId) {
				if (bRemove) {
					tView.content.splice(j, 1);
				}
			}
		}//end for 
	});

	//SAVE the VIEW file view.json
	SaveToProfile(_VIEW_FILE, _oAppScope._personalViews, function(bOk) {
		   if (!bOk) return;
		
			//Refresh all box, after save 
		   if (_oSelectedView) { 
			   var lstDomId = _oSelectedView.getComponentIds(wdtId);
			   $.each(lstDomId, function(i, eltId) {
				   if (bRemove) {
					   $("#"+eltId).remove();
					   _oSelectedView.deleteDomFrom(eltId);
				   }
			   });
			   
			   //View is already saved, reset flag
			   _oSelectedView.flagChange(true); //End flag
		   }

		   //-----------------------------------------
		   // Apply removing to MENU gui && scope data
		   //-----------------------------------------
		   widgetMenuRemove(wdtId);
	}); //

} //end viewUpdateAllWidget

//=================================================END========================================================
