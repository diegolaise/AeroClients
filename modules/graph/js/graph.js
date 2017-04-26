//=================================================================
//
// 				DRAWING HANDLER / FUNCTIONS
// 
//==================================================================
var _TempColumn = {}; 

/**
 * Initialize graph
 * @param activeDataPath
 * @param tDatas
 */
function initGraph(activeDataPath, tDatas, bOnlyUpdate, callback) {
	
	//Reset instances if only update
	_INSTANCES = {};

	//-----------------------------------
	// Clean Variable globals
	//-----------------------------------
	$("#main").html("");
	 
	//Reset canvas
	if (_SVG) _SVG.reset();
	
	//Reset temporary column
	_TempColumn = {};
	
	//Reset all elements
	_ELT_BY_COL 	= {}; 
	_MIN_MAX_BORDER = {}; 
	
	var oActiveData = null;
	if (tDatas) {
		$.each(tDatas, function(idx, jdata) {
			var path  = jdata["path"];
	
			var oEntry = getEntry(path);
			if (!oEntry) {
				oEntry = new Entry(jdata); 
	
				//Add this to INSTANCES
				_INSTANCES[path] = oEntry;
				
				//Update list
				$graphScope.updateList(oEntry);
			} 
	  
			//Get container 
			if (activeDataPath == "") {
				var cont = createContainers(oEntry, 0);
				if (oActiveData == null) {
					oActiveData = cont.topBox();
				}
			}
			else if (path == activeDataPath) {
				oActiveData = oEntry;
			} 
		});
	}
	  
	//Draw the active data;
	if (oActiveData) {
		drawActiveData(oActiveData, callback);
	}
	else if (callback) {
			callback(oActiveData);
	}
	else {
		return oActiveData;
	}
}

/**
 * Draw the active data
 * @param oDataInitial : can be an entry or container
 * @param bOnlyUpdate
 */ 
function drawActiveData(oDataInitial, callback) {
	
	//- WAIT ----
	wait(); 
	
	_ACTIVE_DATA = oDataInitial;  

	_IS_HIDDEN_PARENT = true;
	_IS_HIDDEN_CHILD  = true;
	 
	//Get All entries
	var tabEntry = _ACTIVE_DATA.allEntries(); 
	var nbEntries = tabEntry.length;
	var N = (2 * nbEntries);
	var X = 0;
	var IDX = 0;
	
	var lastEntries;
	if (nbEntries>1) {
		lastEntries = sortLastPath( Object.keys(_INSTANCES));
	}
	
	//Draw callback
	var endDrawing =  function(ilevel) {
		if (--N>0) {
			if (++X==2) {
				X = 0; 
				drawData(++IDX);
			}
			return;
		}
		else {
			callback(_ACTIVE_DATA);
		}
		
		if ( !_IS_HIDDEN_PARENT ) 
			$(".menu-p").show(); 
		else {   
			//NO PARENTS
			$(".menu-p").hide();  
			$("#reorderParent").hide();
			$("#reorderAll").hide(); 
		} 
		
		if ( !_IS_HIDDEN_CHILD ) 
			$(".menu-c").show();
		else {   
			//NO CHILDREN 
			$(".menu-c").hide();   
			$("#reorderChild").hide();
			$("#reorderAll").hide();
		} 
		
		//Center Active data
		initialOrder(_ACTIVE_DATA);

		//Redeploy level -2 for Report sdma.html file
		if ( _ACTIVE_DATA.isEntry() &&_ACTIVE_DATA._path.indexOf("_sdma.html")>0) { 
			 
			var tabParents = _ACTIVE_DATA.oParents();
			$.each(tabParents, function(i, obj) {
				   var obj = tabParents[i];
				   if (obj)	{
					   if (obj._pLinks.length>0) {
						   expandEntry(obj, false, updateEvents);
						   
						   //!!! Draw only the first element => break;
						   return false; //break
					   }
				   }
			});	   
		}
		else {
			//Add event for all
			updateEvents(0);
		} 
		
		//Hide Square Checks for start
		$(".exportItem.menu-p").hide();
		$(".exportItem.menu-c").hide(); 
	}
	
	//----------------------------------
	// Draw & expand active data
	//----------------------------------
	var drawData = function(iEdx) {
		var oActiveData = tabEntry[iEdx];
		
		//Draw active data  
		oActiveData.draw(0, lastEntries); 
		if (iEdx == 0) {
			saveElement(_ACTIVE_DATA);
		} 
	
		//Tab number
		var tab = [];
		
		//Hide show PARENTS menu   
		var nbP = oActiveData._pLinks.length; 
		tab.push(nbP);
		
		var nbC = oActiveData._cLinks.length;
		tab.push(nbC);

		var oBoxGp = oActiveData._container;
		var num = 0;
		if (oBoxGp) num = oBoxGp.handleEntryNumber(); //false
				
		for (var i=0; i<2; i++) {
			var nb = tab[i];
			var bIsChild = (i>0);
			
			if ( nb == 0 ) {   
				oActiveData.connector(bIsChild).hide(); 
				endDrawing();
				continue;
			}
			
			if ( (!oBoxGp || !oBoxGp.isGroup() || (num <= _MAX_ENTRIES))
				&& oActiveData.isVisible() ) {
				
				if (bIsChild) 
					_IS_HIDDEN_CHILD = false;
				else 
					_IS_HIDDEN_PARENT = false;
				
				//Expand only first element
				if (num<2) {
					expandEntry(oActiveData, bIsChild, endDrawing);
				}
				else {
					endDrawing();
				}
			}
			else {
				endDrawing(); 
			}
		}
	}//End drawData
	
	//------------------- DRAW ---------------------
	drawData(IDX); 
}

/**
 * Toggle plus, minus connector
 * @param $span
 * @param bIsChild
 */
var _IS_TO_HIDE = false;
function toggleConnector($span, bIsChild) {
	if (! $span) return;
	
	_IS_TO_HIDE = false; 
	
	//Show children
    var $elt   = $span.closest("div");
    var oEntry = getObject($elt);
    
	//------------ HIDE ---------------
    var css = $span.attr("class");

	var bToCLose = (css.indexOf("minus")>0);
    if ( bToCLose ) {  
    	 _IS_TO_HIDE = true;
    	 
    	if (_IS_BUSY) {
    		setTimeout( function() {
    			toggleConnector($span, bIsChild);
    			_SVG.redrawLines();
    		}, 500);
    		return false;
    	}
 	
    	toggleToPlus($span);  
        closeEntry(oEntry, bIsChild);  
    }
    else { 
		//Toggle to minus
		expandEntry(oEntry, bIsChild, updateEvents);
    }
};    

/**
 * Get entry from its path
 * @param path : the entry path
 * @param callbackFunct : the callback when get data
 */
function getEntryData(path, isChildren, callbackFunct) {	
	var entry = getEntry(path);
	if (entry) {
		if (callbackFunct) {
			callbackFunct(entry);
		}
		return;
	}
	console.log("Call $graphScope.expandEntry: " + path)
	$graphScope.expandEntry(path, (isChildren ? "children" : "parent"), function (obj, err) { 
		if (err) { 
			var errorMessage = JSON.stringify(err.responseText);
			bootbox.alert(""+ data.responseText);
			if (callbackFunct) {
				callbackFunct(null);
			} 
		}
		else {
			var oEntry = new Entry(obj);
			_INSTANCES[path] = oEntry;

			//console.log("Entry get: " + path);
			if (callbackFunct) {
				callbackFunct(oEntry);
			} 
		}
	}); 

}
 
/**
 * Recursive hide parents or children
 * @param oEntry
 */
function closeEntry(oEntry, bIsChild) {
	if (!oEntry) return;

	if (oEntry.isGroup() || oEntry.isContainer()) {
		$.each(oEntry._entries, function(x, entry) {
			closeEntry(entry, bIsChild);
		});
		return;
	}

	var eId = oEntry.id();
	var tabToClose = (bIsChild ? _SVG.getRight(eId) : _SVG.getLeft(eId)); 
	for (var i=0; i<tabToClose.length; i++) {

		var  id = tabToClose[i]; 
		//Remove left /right link
		if (bIsChild) 
			_SVG.removeLink(eId, id, true);
		else
			_SVG.removeLink(id, eId, true);

		//If all links to the id are not hidden, keep it
		var tabNext = (bIsChild ? _SVG.getLeft(id) : _SVG.getRight(id));
		if (tabNext && tabNext.length>0) continue;

		//Recursive hiding only if hide
		var cPath     = $(id).attr("for"); 
		var oLinkedBox = getEntry(cPath);
 
		
		if ( oLinkedBox.isEntry() ) { 
			//- Close ENTRY
			var cont = oLinkedBox._container;
			if (!cont) { //1)
				//Recursive close and mask it
				closeEntry(oLinkedBox, bIsChild); 
				oLinkedBox.mask(); 
			}
			else {
				//if the entry has container, check if don't have link to this group 
				//It means that the entry is a component of other entries, 
				//So, don't close it
				var cid = cont.id(); 
				var tabLnk = (bIsChild ? _SVG.getLeft(cid) : _SVG.getRight(cid));
				if (!tabLnk || tabLnk.length==0) {
					closeEntry(oLinkedBox, bIsChild); 
					oLinkedBox.mask();  //cont.handleEntryNumber() //is handled by mask
				}
			} 
		}
		else { 
			//- Close a GROUP
			var closeThis = true;
			
			//Check if don't have linked child
			if (oLinkedBox._entries.length < _MAX_ENTRIES) {
				$.each(oLinkedBox._entries, function(x, obj) {
					var ed = obj.id();
					var tabNextUp = (bIsChild ? _SVG.getLeft(ed) : _SVG.getRight(ed));
					if (tabNextUp && tabNextUp.length>0) {
						closeThis = false;
						return false; //Break
					}
//					else { //Non, car: Si je pointe sur le groupe => je ne pointe pas a l'interieur
//						//Use recursive close
//						closeEntry(obj, bIsChild);
//						entry.mask();
//					}
				});
			}
			if (!closeThis) 
				oLinkedBox.handleEntryNumber();
			else {
				closeEntry(oLinkedBox, bIsChild);
				oLinkedBox.mask();
			} 
		} 
	} 
}

/**
 * Create containers for entry
 * @param oEntry
 * @param id 
 * @param iLevel
 * @param bOnlyGroup
 * @returns
 */
function createContainers(oEntry, iLevel, oPrecedent) {
	var cont; //Container principal (From)
	var contId = "";
	 
	var fromTool = oEntry.fromTool();
	contId = fromTool;
	if (fromTool) {
		fromTool += " | ";
		contId += "-";
	}
	var fromProcess = oEntry.fromProcess();
	var contLabel = fromTool + oEntry.fromProcess();
	contId += oEntry.fromProcess();

	// If has container FROM 
	if (contLabel) {
		//Container Id
		contId = contId.toLowerCase().trim();
		contId = contId.replace(/  /g, "");
		contId = contId.replace(/ /g, "-");
 
		//Construct the container id
		var cId = contId + "-" + iLevel;
		
		//Create or get a new container
		cont = getContainer(cId, contLabel); 
		cont._iLevel = iLevel;
	}

	//Add separator to container id for group
	if (contId) contId += "_";

	// Container Type
	var returnContainer = "";
	var gpLabel = oEntry.type();
	if (gpLabel) {
		var gKey= gpLabel;
		gKey = gKey.toLowerCase().trim();
		gKey = gKey.replace(/ /g, "-");
		gKey = gKey.replace("(", "");
		gKey = gKey.replace(")", "");
		
		gKey = contId + gKey + "_" + iLevel;
		if (oPrecedent) gKey += "_" + oPrecedent._id;

		var cGroup = getGroup(gKey, gpLabel); 
		cGroup.addEntry(oEntry); 
		cGroup._iLevel = iLevel;

		//If has container
		if (cont) {
			cont.addEntry(cGroup);
		}
		
		//Return the group if has group
		returnContainer = cGroup;
	}
	else if (cont) {
		//Return the container, if has container
		cont.addEntry(oEntry);
		returnContainer = cont;
	} 
	
	return returnContainer;
}

/**
 * Expand parents or children of an Entry
 * @param oEntry
 * @param bIsChild : number of level to draw 
 * @param callback
 */
function expandEntry(oEntry, bIsChild, callback) {
	  
	var tabToCreate = (bIsChild ? oEntry._cLinks : oEntry._pLinks);
	if (!tabToCreate) {
		return;
	}
	
	var iTotalToCreate  = tabToCreate.length;
	if (iTotalToCreate ===0 ) {
		return;
	}
	
	//- WAIT
	wait();
	 
	//---- TOGGLE MINUS -----  
	toggleToMinus(oEntry.connector(bIsChild));
	
	//Get Ordered last parent
	var lastCreatedList = sortLastPath(tabToCreate);

	//Next column index
	var iLevel = oEntry._iLevel + (bIsChild ? 1 : (-1));
	
	//Callback function
	var NbEntryCreated = 0; //index of entry created  
	var tOrphanEntries = [];
	var tEntries 	   = [];
	var tBoxToCreate   = [];
	
	//-----------------------------------------------
	// DRAW CALLBACK
	//-----------------------------------------------	
	var drawCallback = function(oEntryToDraw) {  
		//Add add Parent
		if (bIsChild) {
			oEntryToDraw.addParent(oEntry);
		}
		else {
			oEntry.addParent(oEntryToDraw);
		}
		
		//Create Childs containers  
		var boxContainer = createContainers(oEntryToDraw, iLevel, oEntry); 
		
		// DRAW child or parent entry (create HTML)
		oEntryToDraw.draw(iLevel, lastCreatedList);
		NbEntryCreated++;  /////NEXT CREATED
		
		if (!boxContainer) {
			tOrphanEntries.push(oEntryToDraw); //Entry without container
			
			if (_IS_TO_HIDE) { 
				oEntryToDraw.mask();
				wait(true); 
				return;
			}
		}
		else {
			//Entries to create
			tEntries.push(boxContainer); 
			
			var ct = boxContainer._container; //Group
			if (!ct) {
				ct = boxContainer; //Container
				tEntries.push(oEntryToDraw);
			}
			
			if (_IS_TO_HIDE) { 
				ct.jDom().hide();
				wait(true); 
				return;
			}
			
			//Save the container to create
			if ($.inArray(ct, tBoxToCreate)<0) {
				tBoxToCreate.push(ct); 
			}

			//Handle Group number
			boxContainer.handleEntryNumber();
			
//			var num = boxContainer.handleEntryNumber();			
//			if ( !_IS_IE && num == _MAX_ENTRIES) {
////				boxContainer.panelBody().slimScroll({height : '100%'}); 
////				boxContainer.panelBody().css("height", "115px");
//				$(".slimScrollDiv").css("margin-top", "-4px");
//			}
			
		}  

		//Append version, extension
		$graphScope.updateList(oEntryToDraw);
		
		//If not all created : do nothing
		if (NbEntryCreated < iTotalToCreate) { 
			wait(_IS_TO_HIDE);
			nextActiveData();  //// call NEXT CREATED
			return; //break
		}
		
		//-------------------------------------------
		// ALL ENTRY CREATED : DRAW BOXES & Position
		//-------------------------------------------
		//- Order box according to theirs contents number
		var orderedBoxes = [];
		if (tBoxToCreate.length==1) {
			orderedBoxes = tBoxToCreate;
		}
		else {
			$.each(tBoxToCreate, function(j, box) { 
				var nb = box.boxNumToDraw();
				bFound = false;	
				$.each(orderedBoxes, function(k, sbox) {
					if (nb < sbox.boxNumToDraw()) {
						//Insert before
						orderedBoxes.splice(k, 0, box);
						bFound = true;
						return false; //Break
					}
				});
				if (!bFound) {
					orderedBoxes.push(box);
				}
			});
		}
		
		//Get all containers to draw
		var tabContainers = tOrphanEntries;
		$.each(orderedBoxes, function(k, cont) {
			if (cont.isGroup()) {
				tabContainers.push(cont);
			}
		    else { 
			   //Push only its own entries
			   $.each(cont._entries, function(z, entry) {
				   if ( $.inArray(entry, tEntries)>= 0){
					   tabContainers.push(entry);
				   }
			   });
		   }
		});
		 
		$.each(tabContainers, function(ix, oBoxToLink) {
			
			if (! oBoxToLink.isVisible()) {
				return true; //continue
			}
			
			var bCollapse = false;
			
			//Add IE scrolling only at the end
			var num  = oBoxToLink.entryNumber();
			//var num  = oBoxToLink.handleEntryNumber(); //_IS_IE);
			if (num > _MAX_ENTRIES) {
				if (oBoxToLink._container && oBoxToLink._container._entries.length>1) {
					bCollapse = true; 
				}
			}
			 
			var cont   = oBoxToLink._container;
			if (!cont) {
				cont = oBoxToLink;
			}
			
			var idx = indexOf(cont); 
			if ((idx<0 || cont._position.top <= 0))
			{  
				var pos = (bIsChild ? getChildPos(cont, oEntry) : getParentPos(cont, oEntry));
				cont.setPosition(pos);
				if (idx<0) {
					saveElement(cont);
				}
			}
			else if (!bCollapse) { 
				moveNextToDown(cont); 
			} 
			else {
				EventG_HeadingClick($(oBoxToLink.id() + " .panel-heading"));
				resetPosition(iLevel);
			}
			
			if (oBoxToLink.isContainer()) { 
				$.each(oBoxToLink._entries, function(x, entry) {
					 drawLine(oEntry, entry, bIsChild); 
				});				
			} 
			else if ( oBoxToLink.isEntry() ) {
				drawLine(oEntry, oBoxToLink, bIsChild);
			}
			else { 
				var gpBox = getUnifiedGroup(oBoxToLink); 

				if (gpBox == oBoxToLink) {
					drawLine(oEntry, oBoxToLink, bIsChild);
				}
				else { 
					if (gpBox != null) { 
						oBoxToLink = gpBox;
					}

					oBoxToLink.display();
					oBoxToLink.handleEntryNumber();

					$.each(oBoxToLink._entries, function(i, obj) {
						if ( tabToCreate.indexOf(obj._path)>=0 ) {
							drawLine(oEntry, obj, bIsChild);
						}
					});

					//Move after
					if (gpBox != null) {   
						moveNextToDown(oBoxToLink);
					}
				} 
			}  
		});

		//Do Callback
		if (callback) {
			callback(iLevel); 
		}
		
	}//----------- End drawCallback -----------------

	//-----------------------------------------------
	// Create all parent/children of active data
	//----------------------------------------------- 
	var nextActiveData = function() {
		if (NbEntryCreated >= iTotalToCreate) {
			return; //End
		}
		
		var pPath = tabToCreate[NbEntryCreated];
 
		//Get entry to create if exists
		var oNodeCreated = getEntry(pPath);		
		if (!oNodeCreated || !oNodeCreated.drawed()) {  
			getEntryData(pPath, bIsChild, drawCallback); 
		}
		else {   
			 
			if (bIsChild){
				oNodeCreated.addParent(oEntry);
			} 
			else {
				oEntry.addParent(oNodeCreated);
			}
			
			 //Show entry, if was just hidden, redraw -> draw the line
			 if ( oNodeCreated.canShow() ) {
				 
				 //SHOW
				 oNodeCreated.display();
				 
				 if (_SVG.wasRemoved(oEntry.id(), oNodeCreated.id())) {
					 drawLine(oEntry, oNodeCreated, bIsChild);
					 oNodeCreated.handleEntryNumber();
				 }
				 else if ( oNodeCreated._container 
						 && _SVG.wasRemoved(oEntry.id(), oNodeCreated._container.id())) {
					 drawLine(oEntry, oNodeCreated._container, bIsChild);
					 oNodeCreated.handleEntryNumber();
				 }
				 else {
					connectChildOrParent(oEntry, oNodeCreated, bIsChild);
				 }
			 }

			 //--- Callback for cascade expand ///////
			 var afterExpand = function() {
				NbEntryCreated++;  /////NEXT CREATED
				
				if (NbEntryCreated >= iTotalToCreate) { 
					if (callback) {
						callback(iLevel); 
					}
				}
				else {
					nextActiveData(); /// Call Next Created
				}
			 }
			 
			 //For If toggle minus (-) left => show parent cascade
			 var $span = oNodeCreated.connector();
			 if (isVisible($span) && $span.attr("class").indexOf("minus")>0) {
				expandEntry(oNodeCreated, bIsChild, afterExpand);
			 } 
			 else {
				 afterExpand();
			 }
		}
	} ////END nextActiveData
	
	if (_IS_TO_HIDE) { 
		wait(true);  
	}
	else {
		nextActiveData();
	}
	
	//Update last number
	$(".badger", $("#lastVersion").parent()).html(lastCreatedList.length);
}

/**
 * Unify group if entries is not to much
 * @param box
 */
function getUnifiedGroup(gpBox) {
	var nbEntries = gpBox._entries.length;
	if (nbEntries > _MAX_ENTRIES) return gpBox;
	
	var id = gpBox._id;
	var uid = id.substring(0, id.lastIndexOf("_"));
	
	var uGroup = gpBox; 
	$.each(_INSTANCES, function(key, iObj) {
		if ( key == id || !key.startsWith(uid) || iObj.isContainer()) return true; 	
		
		//!! Pbm: nbEntries est tout y compris ceuw que l'on affiche pas
		//Donc nombre biaise, mais tant pis
		var num = iObj.entryNumber() + nbEntries;
 		if (num > _MAX_ENTRIES)  return true; //continue

		//Keep this group
		uGroup = iObj;
		moveGroupLines(uGroup, uGroup._entries, uGroup._iLevel>0);

		var n = gpBox._entries.length - 1;
		for (var i=n; i>=0; i--) {
			var entry = gpBox._entries[i];

			var tab = [];
			var $entry = entry.jDom();
			if ( $entry && $entry.hasClass("vlast")) tab.push(entry._path);

			//Remove entry to the actual group
			gpBox.removeEntry(entry); 

			//Append the entry to the new group
			uGroup.addEntry(entry); 

			//--- Redraw the moved entry ---
			entry.draw(entry._iLevel, tab); 
		}

		delete _INSTANCES[id];

		var tabCol = _ELT_BY_COL[""+uGroup._iLevel];
		for (var i=tabCol.length - 1; i>=0; i--) {
			var obj = tabCol[i];
			if (obj._id == id) {
				tabCol.splice(i, 1);
				break;
			}
		}

		//Update entry numbers if group
		uGroup.handleEntryNumber();
		return false;
	});

	return uGroup;
}
 
/**
 * Calculate Initial position of an entry
 * @param oEntry 
 * @returns {position}
 */ 
function initialPosition(oEntry) {
	//----------------
	// If Active data
	//----------------
	if (oEntry._iLevel == 0) {  
		//Get top position
		var top = ($(document).height() - oEntry.height()) / 2;
		
		var idx = _BEGIN_COL_IDX;
		if (oEntry._cLinks.length == 0) 
			idx += 2;
		else if (oEntry._cLinks.length == 1) 
			idx += 1;
		
		if (oEntry._pLinks.length == 0) 
			idx -= 2;
		else if (oEntry._pLinks.length == 1) 
			idx -= 1;
		
		var left  = idx * (_BOX_WIDTH + _BOX_HGAP);
		
	 	var pos = {"top" : top, "left" : left}
	 	oEntry.setPosition(pos);
	 	
	 	//Push this
	 	_TempColumn[""+oEntry._iLevel] = [oEntry];
		return pos; 
	}
	
	//Get activeColumn 
	var bIsChild = (oEntry._iLevel > 0);
 
	//Get Precedent
	var iPrecLevel = oEntry._iLevel + (bIsChild ? -1 : 1);
	 
	//--------
	var TOP  = _MIN_TOP; 
	
	var tabPrec   = _ELT_BY_COL[""+iPrecLevel];
	var oAncestor;
	
	if (tabPrec && tabPrec.length>0) {
		oAncestor = tabPrec[0];
		//Get ancestor who has max width
		if (tabPrec.length>1) {
			$.each(tabPrec, function(x, obj) {
				if (obj.width() > oAncestor.width())
					oAncestor = obj;
				
				//Get MinTop
				var top = obj.top(true);  
				if (top >= _MIN_TOP && top < TOP)
					TOP = top;
			});
		}
	}
	 
	var LEFT = _MIN_LEFT;  
	
	//Get sibling
	var sLevel = ""+oEntry._iLevel;
	var tab    = _TempColumn[sLevel]; 
	
	if ( !tab && oAncestor) {//First Element in level
		_TempColumn[sLevel] = [oEntry];
		  
		if (bIsChild)
			LEFT = oAncestor.left() + oAncestor.width() + _BOX_HGAP;
		else
			LEFT = Math.max(_MIN_LEFT, oAncestor.left() - _BOX_HGAP - (oEntry.width() + 100));
	}
	else { 
		//Get bottom sibling  
		var oSibling = tab[tab.length - 1]; 
		TOP = oSibling.top(true) + oSibling.height() + _BOX_VGAP; 
	 
		if (bIsChild)
			LEFT = oSibling.left();
		else 
			LEFT = oAncestor.left() - _BOX_HGAP - (oEntry.width() + 100);
		
		//Append
		tab.push(oEntry); 
	} 
	
	//-----------------------
	// Scroll body to right if needed
	//-----------------------
	if (bIsChild) growPanelWidth(oEntry, LEFT);
	
	//Return pos
	return {"top": TOP, "left": LEFT};
}

/**
 * Grow the panel if its width is lower than the right of the entry
 * @param oEntry
 * @param LEFT
 */
function growPanelWidth(oEntry, LEFT) {
	//Grow to the wrapper width if it is smaller
	//that le right of the entry to create 
	var mainWidth = $("#wrapper").outerWidth();
	var right = LEFT + oEntry.width() + _BOX_HGAP;
	if (mainWidth < right) { 
		var plus = (right - mainWidth) + _BOX_HGAP;
		
		$("#wrapper").css( "width", (mainWidth + plus)+"px");
		scrollToRight();
	}
}

/**
 * Calculate position of an entry
 * @param oEntry
 * @param oParent 
 * @returns {___anonymous11353_11377}
 */
function getChildPos(oEntry, oParent) {

	//Get the max right of parent column
	var LEFT = oParent.left() + oParent.width() + _BOX_HGAP;
	var maxRight = _MIN_MAX_BORDER[""+(oEntry._iLevel - 1)];
	if (maxRight) {
		maxRight += _BOX_HGAP;
		LEFT = Math.max(LEFT, maxRight);
	} 

	//Scroll to the right if container is smaller
	if (oEntry.isChild()) growPanelWidth(oEntry, LEFT);
	 
	//Calculate Top
	var TOP = getEntryTop(oEntry, oParent); 

	return {"top" : TOP, "left" : LEFT};
}

/**
 * Calculate parent position of an entry
 * @param oEntry : entry to position
 * @param oChild : the entry on right
 * @returns {___anonymous11353_11377}
 */
function getParentPos(oEntry, oChild) {

	var right = -1;
	
	//Get first element of level
	var tab = _ELT_BY_COL[""+oEntry._iLevel];
	if (tab) {   
		var oSibling = tab[0]; 
		right = oSibling.left() + oSibling.width();
	}
	else { 
		var minLeft = _MIN_MAX_BORDER[""+oChild._iLevel];
		if (!minLeft) 
			minLeft = oChild.left();
		else 
			minLeft = Math.min(minLeft, oChild.left());

		//First element of this column
	    right = minLeft - _BOX_HGAP;
	} 
	var LEFT = right - oEntry.width();
	
	//Get last element in the same column
	var TOP = getEntryTop(oEntry, oChild); 
	
	return {"top" : TOP, "left" : LEFT};
}

/**
 * 
 * @param oPrecedent
 * @param tPrecedent
 * @returns
 */
function hasExtendedPrevious(oPrecedent, tPrecedent) {
	var idx = $.inArray(oPrecedent.topBox(), tPrecedent);
	for (var i=idx-1; i>=0; i--) {
		var op = tPrecedent[i]; 
		if (op.hasExtendedBox()) {
			return op;
		}
	} 
	return null;
}

/**
 * Temporary top position
 * @param iLevel
 * @param top
 * @returns
 */
function getTempCenterTop(iLevel, top) {
	var TOP = top;
	if (!top) TOP = _MIN_TOP;
	 
	var tab = _TempColumn[""+iLevel]; 
	if (tab && tab.length>0) {
		//Get max height of all column entry
		var height = 0;  
		$.each(tab, function(col, entry) {
			if (entry._iLevel == iLevel)
				height += entry.height() + _BOX_VGAP;
		});
 
		//Begin to top center of precedent 
		TOP  = Math.max(_MIN_TOP, (top - (height/2)));
	}
	return TOP;
}

/**
 * Center top of a box
 */
function getCenterTop(oPrecedent, bIsChild) { 
	
	var pId = oPrecedent.id();
	var tab = (bIsChild ? _SVG.getRight(pId) : _SVG.getLeft(pId));
	
	if ( !tab || tab.length <=1 ) {
		var top = oPrecedent.top();
		return getTempCenterTop(oPrecedent._iLevel, top);
	}
	
	//Get max height of all column entry
	var iLevel =  oPrecedent._iLevel + (bIsChild ? 1 : - 1);
	var height = 0; 
	var tabCont = [];
	for (var i=0; i<tab.length; i++) { 
		var  id   = tab[i];
		var cPath = $(id).attr("for"); 
		var oBox = getEntry(cPath);
		if (!oBox) continue; 
		
		var cont = oBox.topBox();
		if ( $.inArray(oBox._container, tabCont)<0) {
			tabCont.push(cont);
			if (cont._iLevel == iLevel)
				height += cont.height() + _BOX_VGAP; 
		}
	} 
 
	//Begin to top center of precedent 
	var TOP  = Math.max(_MIN_TOP, (oPrecedent.top() - (height/2)));

	return TOP;
}

/**
 * Final entry top
 * @param oEntry
 * @param oPrecedent
 * @returns {poistion}
 */
function getEntryTop(oEntry, oPrecedent) {
	
	var sLevel 	= ""+oEntry._iLevel;
	var bestTop = oPrecedent.top(true); 

	//Get last element in the same column 
	var tabSibling = _ELT_BY_COL[sLevel]; 
	var tPrecedent = _ELT_BY_COL[""+oPrecedent._iLevel];
	
	//First element
	if (!tabSibling) {	 
		//First element preceding active data
		if (oPrecedent._iLevel == 0) 
			return getTempCenterTop(sLevel, bestTop);
		
		//return bestTop;
		var pos = getFirstPos(oEntry, oPrecedent);
		return pos.top;
	} 
	
	//Begin TOP
	var TOP = bestTop;

	var bIsChild = oEntry.isChild();
	var decalage = -1; 
	var iPrecLevel = oPrecedent._iLevel;
	
	//Calculate supposed left 
	for (var i=0; i<tabSibling.length; i++) { 
		var oSibling = tabSibling[i];
		//if (oSibling == oEntry) continue;
		
		if (decalage > 0) { 
			if (oSibling.top() >= decalage) break;
			
			var pos = { "top": decalage, "left": oSibling.left() };
			oSibling.setPosition(pos);
				
			//Prochain decalage apres moi
			decalage = oSibling.top() + oSibling.height() + _BOX_VGAP;
			continue;
		}  
		
		//Chercher le parent le plus haut du sibling 
		var minParentSibTop = -1;
		var tabPrecedent = (bIsChild ? oSibling.oParents() : oSibling.oChildren());
		$.each( tabPrecedent, function(x, obj) {
			if (obj._iLevel == iPrecLevel) {
				var t = obj.top();
				if (t>0) {
					if (minParentSibTop<0) 
						minParentSibTop = t;
					else if (t < minParentSibTop)
						minParentSibTop = t;
				}
			}
		});
		
		// Le sibling doit toujour etre au dessus (top plus petit)
		// si son parent est au dessus ou egale au mien  
		if ( oPrecedent.top() >= minParentSibTop ) {
			//Je me decale apres ce sibling
			var top = oSibling._position.top;
			if (top > 0 && oSibling != oEntry) {
				TOP = oSibling.top() + oSibling.height() + _BOX_VGAP;
				if (iPrecLevel !== 0)
					TOP = Math.max(TOP, bestTop); 
		    }
			else {
				//Center
				TOP = minParentSibTop + ((bestTop - minParentSibTop)/2) - (oSibling.height()/2);
				//On decale tout le reste
				decalage = TOP + _BOX_VGAP + oSibling.height(); 
			} 
		} 
		else { 
			//Sinon, Je m'insere ici, en gardant le TOP calcule jusqu'ici 
			//et je decale tout mes prochains
			//TOP = Math.max(goodTop, TOP);
			
			//Le Prochain top suppose est :
			var nextTobe = TOP + oEntry.height() + _BOX_VGAP;
				
			//Si le top du sibling est apres, on arrete tout
			// => insertion sans consequence
			if (oSibling.top() >= nextTobe) break;
				
			//Sinon decaler le sibling vers le bas et tous les autres
			oSibling.setPosition({"top": nextTobe, "left": oSibling.left()});
			decalage = nextTobe + _BOX_VGAP + oSibling.height(); 
		}
	}  

	return TOP;
}

/**
 * 
 */
function getTopPrecedent(oBox, bIsChild) {
	var iPrecLevel = oBox._iLevel + (bIsChild ? -1 : 1);
	
	var oPrecedent = null; 
	
	var tabParentOrChild = (bIsChild ? oBox.oParents() : oBox.oChildren());
	$.each( tabParentOrChild, function(x, obj) {
		if (obj._iLevel == iPrecLevel) {
			 if (!oPrecedent || obj.top() <= oPrecedent.top()) {
				oPrecedent = obj; 
			 }
		}
	});
	return oPrecedent;
}

/**
 * Get Initial first position of a box;
 * @param oBox
 * @returns {___anonymous13417_13443}
 */
function getFirstPos(oBox, oChOrParent) {
	var bIsChild = oBox.isChild();  
	var iPrecLevel = oBox._iLevel + (bIsChild ? -1 : 1);
	
	//Get top Parent or Children
	var oPrecedent = oChOrParent;
	if (!oPrecedent) {
		oPrecedent = getTopPrecedent(oBox, bIsChild);
	}
	
	var isFirstCanDeployed = true;
	if (iPrecLevel != 0) {
		var bOk = true;
		var tabPrecedent = _ELT_BY_COL[""+iPrecLevel];
		
		for (var i=0; i<tabPrecedent.length && bOk; i++) {
			var obj = tabPrecedent[i];
			if (obj == oPrecedent) break;
			
			$.each(obj.allEntries(), function(i, entry) {
				if (entry == oPrecedent) {
					bOk = false;
					return false; //break
				}
				
				if (entry.hasExtendedBox()) {
					isFirstCanDeployed = false;
					bOk = false;
					return false; //break
				}
			}) 
		}
	}
	
	//Get TOP
	var TOP;  
	//if its parent is the first can deployed, center top
	if (isFirstCanDeployed) {
		if (oChOrParent) 
			 TOP = getTempCenterTop(oBox._iLevel, oPrecedent.top());
		else
			TOP = getCenterTop(oPrecedent, bIsChild);
	}
	else
		TOP = oPrecedent.top(true);
 
	//Get Left
	var LEFT = _MIN_MAX_BORDER[""+iPrecLevel];
	if (bIsChild) {
		if (iPrecLevel==0)
			LEFT = oPrecedent.left() + oPrecedent.width() + _BOX_HGAP;
		else
			LEFT += _BOX_HGAP;
	}
	else {
		if (iPrecLevel==0)
			LEFT = oPrecedent.left() - _BOX_HGAP - oBox.width();
		else 
			LEFT -= (_BOX_HGAP + oBox.width()); 
	}
	
	return {"top": TOP, "left" : LEFT};
}

/**
 * Reset position of level to initial position
 * @param iLevel
 * @returns {Boolean}
 */
function resetPosition(iLevel) {
	var sLeveL = ""+iLevel;
	
	var tabCol = _ELT_BY_COL[sLeveL];
	if ( ! tabCol ) return false;
 
	//Get first element top
	var oFirst = tabCol[0]; 
	
	var pos  = getFirstPos(oFirst);
	var top  = pos.top;
	var left = pos.left;
	
	var isChild = (iLevel > 0);
	var right = pos.left + oFirst.width(); 
	
	//Reset max border position
	var border = -1; 
	$.each(tabCol, function(i, obj) {
		if (isChild) { 
			var lgt = left + obj.width();
			if (lgt>border) border = lgt;
		}
		else {
			left = right - obj.width();  
			if (border<0 || left<border) 
				border = left;
		}
		
		obj.setPosition({ "top" : top , "left": left });
		
		//Next top
		top += obj.height() + _BOX_VGAP; 
	});
	
	//Set max/min border position
	_MIN_MAX_BORDER[sLeveL] = border;
	
	return true;
}

/**
 * Restore position
 * @param bIsChild
 */
function restorePosition(bIsChild) {	
	var plus = (bIsChild ? 1 : -1); 
	var iLevel = plus; 
	while ( resetPosition(iLevel) ) { 
		iLevel += plus; 
	}
}

/**
 * 
 * @param iLevel
 * @param bUp
 * @returns {Boolean}
 */
function moveBox(iLevel, bUp) {
	var tabCol = _ELT_BY_COL[""+iLevel];
	if ( ! tabCol ) return false;
 
	var netxTop = -1;  
	for (var i=0; i<tabCol.length; i++) {
		var obj = tabCol[i]; 
		
		if (bUp) {
			var top = obj.top() - _BOX_HGAP; 
			obj.setPosition({"top": top , "left": obj.left()});
		}
		else {
			if (netxTop<0) 
				netxTop = obj.top() + _BOX_HGAP; 

			obj.setPosition({"top": netxTop, "left": obj.left()});
				
			//Next decalage
			netxTop += obj.height() + _BOX_VGAP;
		}
	}
	return true; 
}

/**
 * Move all
 * @param bUp : move to up if true
 */
function moveAll(bUp) {
	var iLevel = 0;
	
	//Move active datas
	moveBox(iLevel, bUp);
	
	//Move parents
	var iPLevel = iLevel - 1; 
	while ( moveBox(iPLevel, bUp) ) { 
		iPLevel --;
	}
	
	//Move children
	var iCLevel = iLevel + 1; 
	while ( moveBox(iCLevel, bUp) ) { 
		iCLevel ++;
	}
	
	//---- REDRAW LINES-----
	_SVG.redrawLines();
}

/**
 * Center the active data
 */
function initialOrder(oData) {
	if (!oData.isEntry()) { 
		var tabChild = _ELT_BY_COL["1"];
		if (tabChild) { 
			var rLeft = oData.left() + oData.width() + _BOX_HGAP;
			var left = tabChild[0].left();
			if (left < rLeft) {
				$.each(tabChild, function(i, obj) { 
					obj.setPosition({"top" : obj.top(), "left" : rLeft });
				});	
			}
		}
		
		//Add scroll for needed group
		oData.jDom().find(".group").each(function() {
			var path = $(this).parent().attr("for");
			var group = getEntry(path);
			if (group) group.handleEntryNumber(); //true);
		});
		return;
	}
	
	var actTOP = oData.top(); 
	
	//Reposition of active data
	var centerRight  = actTOP; 
	
	var tabChild = _ELT_BY_COL["1"];  
	if (tabChild && tabChild.length>1) {
		var lastChild = tabChild[tabChild.length-1];
		var bottom = lastChild.top() + lastChild.height();
		
		var firstChild = tabChild[0];
		var top = firstChild.top();
		centerRight = Math.floor( (top + bottom) / 2 );  
	}
	
	//The active data top 
	var centerLeft  = actTOP;
	var tabLeft = _ELT_BY_COL["-1"]; 
	if (tabLeft) {
		var nb = tabLeft.length;
		
		if (nb>1) {
			var firstChild = tabLeft[0]; 
			var ftop = firstChild.top();
			
			var lastChild = tabLeft[nb-1];
			
			if (nb == 2) {
				var ltop = actTOP + (actTOP - (ftop + firstChild.height()));
				lastChild.setPosition({"top" : ltop, "left" : lastChild.left()});
				centerLeft = actTOP;
			}
			else { 
				var bottom = lastChild.top() + lastChild.height(); 
				centerLeft  = Math.floor( (ftop + bottom) / 2 );
			}
		}
	}
	
	var top;  
	var tabMoved; 
	if (centerRight>centerLeft) {
		//Move left down
		top = centerRight;  
		tabMoved = tabLeft;
	}
	else {
		//Move right down
		top = centerLeft; 
		tabMoved = tabChild; 
	}
	
	//Move 
	if (tabMoved) {
		var ecart = top - actTOP;
		$.each(tabMoved, function(i, obj) {
			var left  = obj.left();
			obj.setPosition({"top" : obj.top() + ecart, "left" : left });
		});

	}
	
	//Set position
	oData.setPosition({ "top": top, "left": oData.left() });
}

/**
 * Augmenter vers la gauche (left)
 */
function decalerADroite(nb) { 
	if (!nb || nb===0) nb = 1;

	var decalage = nb * (_BOX_HGAP + _BOX_WIDTH);
	 
	$.each(_ELT_BY_COL, function(key, tab) {
		$.each(tab, function(i, obj) {
			var left = (obj.left() + decalage);
			var pos = {"top": obj.top(), "left": left};
			obj.setPosition(pos); 
		});
		 
		var border = _MIN_MAX_BORDER[key];
		_MIN_MAX_BORDER[key] = border + decalage;
	});
}

/**
 * 
 * @param aGauche
 */
function decaler(aGauche) { 
	if (!aGauche)
		decalerADroite(1);
	else {
		var decalage = (_BOX_HGAP + _BOX_WIDTH);
		 
		$.each(_ELT_BY_COL, function(key, tab) {
			$.each(tab, function(i, obj) {
				var left = obj.left() - decalage;
				var pos = {"top": obj.top(), "left": left};
				obj.setPosition(pos);  
			});
			
			var border = _MIN_MAX_BORDER[key];
			_MIN_MAX_BORDER[key] = border - decalage;
		});
	}
	_SVG.redrawLines();
}

function allMatchedEntries(entries, tab) {
	var bAllMatch = true;
	
	//If faut que tout les entree soient dans le tab 
	 $.each( entries, function(i, obj) {
		 var entry = obj._path; 
		 if ( $.inArray(entry, tab)<0 ) {
			 bAllMatch = false;
			 return false;
		 } 
	 });

	 return bAllMatch;
}

function getMatchedEntries(entries, tab) {
	var tabMatched = [];
	 $.each( entries, function(i, obj) { 
		 if ( tab.indexOf(obj._path)>=0 )
			 tabMatched.push(obj);  
	 });

	 return tabMatched;
}

/**
* Connect child or parent that was already created
* @param oEntry
* @param oChildOrParent
* @param bIsChild
* @param outGroup
* @returns {String}
*/
function connectChildOrParent(oEntry, oChildOrParent, bIsChild) {
	 
	var oLineTarget = oChildOrParent; 
 
	//Current group to split
	var oSplitGroup = oChildOrParent._container;
	
 	if ( oSplitGroup && oSplitGroup.isGroup() ) {	
		
		 //var ePath       = oChildOrParent._path;
		 var tabToCreate = (bIsChild ? oEntry._cLinks : oEntry._pLinks);
		 
		 //Chercher ceux qui ne sont pas dans splitGroup
		 var tabToSplit = [];
		 var tabExclude = []; 
		 var tabCommon  = [];
		 
		 var bHasLinkedEntry = false;
		 $.each( oSplitGroup._entries, function(i, obj) {
			 tabToSplit.push(obj._path);
			 var path = obj._path; 
			 if ( $.inArray(path, tabToCreate)<0 )
				 tabExclude.push(obj); 
			 else
				 tabCommon.push(obj); 
			 
			 if (!bHasLinkedEntry) {
				 var tab = (bIsChild ? _SVG.getLeft(obj.id()) : _SVG.getRight(obj.id()));
				 if (tab.length>0) 
					 bHasLinkedEntry = true;
			 }
		 });
		 
		 //Check if has linked group
//		 var cid = oSplitGroup.id();
//		 var tabLnk = (bIsChild ? _SVG.getLeft(cid) : _SVG.getRight(cid));
		 
		 if (tabExclude.length==0) { 
			oLineTarget = oSplitGroup;
			//if ( !bHasLinkedEntry )oLineTarget = oSplitGroup;
		 }
		 else if ( !bHasLinkedEntry ) // && tabLnk.length>0 ) //if (oSplitGroup._entries.length > _MAX_ENTRIES)
		 {   
			 //Search for a new group
			 var groupKey = oSplitGroup._id + "-";
			 var ix = 1; 
			 while ((groupKey+ix) in _INSTANCES) {
				 ix++; 
			 } 
			 groupKey += ix;  
			 
			//Create a new group
			 var outGroup = getGroup(groupKey, oSplitGroup._label); // +" ("+ix+")");
			 outGroup._iLevel = oSplitGroup._iLevel;

			 if (oSplitGroup._container) 
				 oSplitGroup._container.addEntry(outGroup); 

			 var level = oChildOrParent._iLevel; 
			 var tabMoved = (tabExclude.length>tabCommon.length ? tabCommon : tabExclude );

			 //Sortir les exclus et pointer les olds dessus
			 $.each(tabMoved, function(i, obj) { 
				 var tab = [];
				 if (obj.jDom().hasClass("vlast")) tab.push(obj._path);

				 //Remove entry to the actual group
				 oSplitGroup.removeEntry(obj); 

				 //Append the entry to the new group
				 outGroup.addEntry(obj); 

				 //--- Redraw the moved entry ----
				 obj.draw(level, tab);  
			 });

			 if ( !oSplitGroup._container && outGroup._position.top <= 0)
			 {  //Create a New group
				 //Position of the new group : just after the actual group splitted
				 var topPos = oSplitGroup.top() + oSplitGroup.height() + 1; //coller	
				 var left   = oSplitGroup.left();

				 outGroup.setPosition({"top": topPos, "left": left});
				 outGroup.jDom().css("width", oSplitGroup.width());
				 saveElement(outGroup);
			 }
			 else { 
				 //Move next to down
				 moveNextToDown(outGroup);
			 }

			 //Recuperer les entrees qui pointent sur le group
			 //les faire pointer aussi sur le nouveau group
			 var eId = oSplitGroup.id();
			 var tab = (bIsChild ? _SVG.getLeft(eId) : _SVG.getRight(eId));
			 for (var i=0; i<tab.length; i++) {
				 var id = tab[i];
				 var cPath = $(id).attr("for");
				 var oP = getEntry(cPath);
				 if (oP) {
					 drawLine(oP, outGroup, bIsChild);
				 }
			 }  

			 //draw line to the new group 
			 oLineTarget = outGroup; 
			 //oLineTarget.handleEntryNumber();
		 }  
 	} 
	
	//DRAW Line
 	if (oLineTarget) { 
 		drawLine(oEntry, oLineTarget, bIsChild);
 		oLineTarget.handleEntryNumber();
 	}
}

function moveGroupLines(fromBox, toBoxes, bIsChild) {
	 //Recuperer les entrees qui pointent sur le group
	 //les faire pointer aussi sur le nouveau group
	 var eId = fromBox.id();
	 var tab = (bIsChild ? _SVG.getLeft(eId) : _SVG.getRight(eId));
	 
	 for (var i=0; i<tab.length; i++) {
		 var id = tab[i];
		 var cPath = $(id).attr("for");
		 var oP = getEntry(cPath);
		 if (!oP) continue;
		 _SVG.removeLink(id, eId);
		 
		 $.each(toBoxes, function(j, toBox) {
			 
			 drawLine(oP, toBox, bIsChild);
		 }); 
	 }
} 
/**==================================== END ============================================ */
