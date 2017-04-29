/**=================================================================
 * 
 * 				Entry Container
 * 
 *==================================================================*/
function Container(id, label, type) { 
	
	this._type 		= type;	
	this._id	 	= id; 	// <div> dom id
	this._label 	= label;// <div> label

//	//If has container
	this._container; 
	this._entries 	= []; 
	this._iLevel   = _BEGIN_LEVEL;  
	// Initial Position X, Y
	this._position = {"top" : -1, "left" : -1};
	 
	//this._class   = "";   
	//this._json  	= {}; 
	this._path  	= id; 
	this._metadata 	= {}; 
	this._version	= "";
	
	this._allVersions = []; 
	this._pLinks	  = []; //parent links paths
	this._cLinks	  = []; //child links paths

	//this._parents   = []; //Created parents
	//this._children  = []; //Created children 
	
	//======================= METHODS ==========================
	/** Get path of this */
	this.get = function(attr) {
		return [];
	}
	
	this.metadata = function(key) { return ""};
	
	/** Add an entry to this */
	this.addEntry = function(oEntry) { 
		oEntry.setContainer(this);
		
		if (this._entries.indexOf(oEntry)<0) 
			this._entries.push(oEntry);

		if (this.isContainer() )
			this.setToActive(this._entries.length);  
	};
	
	this.setToActive = function(num) {
		if (num > 1) 
			$(this.id() + " > .panel-heading .toActiveData").show();
		else
			$(this.id() + " > .panel-heading .toActiveData").hide();
	}
	
	/** Remove an entry to this */
	this.removeEntry = function(oEntry) {   		
		var index = -1;
		$.each(this._entries, function(idx, oe) {
			if (oEntry._id == oe._id) { 
				index = idx;
				return false;
			}
		});

		if (index < 0) return;
		
		this._entries.splice(index, 1); 
		oEntry._container = null; 
		
		$(oEntry.id()).remove();
		
		if (this._entries.length==0) 
			$(this.id()).remove();
		else {
			var $badge = $(this.id() + " .panel-title span.badge");
			var num = parseInt($badge.text()) - 1;
			$badge.text(num);
		}
	};

	/** Reset this to redraw */
	this.reset = function() {
		this._position = {"top" : -1, "left" : -1};
		this._iLevel   = _BEGIN_LEVEL; 
	}

	/**
	 * Add Container
	 * @param oContainer : the parent to add
	 */
	this.setContainer = function(oContainer) {	
		if (!oContainer) return;	
		this._container = oContainer;
	};

	/** JQ dom id */
	this.id = function() {
		return ("#" + this._id);
	};
	
	/** Check if drawed */
	this.drawed = function() {
		var id = this.id();
		try {
			return ($(id).length>0);
		} 
		catch (err) {
			//alert("container len error for: " + id)
		}
		return false
	}
	
	/** Get jquery object */
	this.jDom = function() {
		return $(this.id());
	}
	
	/** If dom is displayed but can be collapsed */
	this.isDisplayed = function() {
		return (this.drawed() && isVisible($(this.id())) );
	}
	
	/** If dom element is displayed and visible */
	this.isVisible = function() {
		if (this._container) {
			if (this._container.isCollapsed())
				return false;
		}
		return this.isDisplayed();
	}
	
	/** Check if dom is collapsed */
	this.isCollapsed = function() {
		return ($(this.id()+" > .panel-body").css("display") == "none");
	}

	/** Get All entries */
	this.allEntries = function() {
		var tabEntry = [];
		for (var i=0; i<this._entries.length; i++) {
			var obj = this._entries[i];
			if (obj.isEntry())
				tabEntry.push(obj)
			else
				tabEntry = tabEntry.concat(obj._entries);
		}
		return tabEntry;
	}

	this.isEntry = function() { return false;}
	this.isGroup = function() { return (this._type == "GROUP");}
	this.isContainer = function() { return (this._type == "CONTAINER");}
	
	this.oChildren = function() { 
		var tab = [];
         $.each(this._entries, function(i, o) {
        	 tab = tab.concat(o.oChildren());
         });
         var tUniqueNames = [];
         $.each(tab, function(i, el){
             if($.inArray(el, tUniqueNames) === -1) tUniqueNames.push(el);
         });
         return tUniqueNames;
	};
	
	/** All parents of all entries */
	this.oParents = function() { 
		var tab = [];
         $.each(this._entries, function(i, o) {
        	 tab = tab.concat(o.oParents());
         });
         var tUniqueNames = [];
         $.each(tab, function(i, el){
             if ($.inArray(el, tUniqueNames) === -1) tUniqueNames.push(el);
         });
         return tUniqueNames;
         //return tab;
	};
	
	/** All parents of all entries */
	this.height = function() {
		if (this.isGroup()) {
			if (this._entries.length>_MAX_ENTRIES) 
				return _MAX_HEIGHT;
		}
		
		//- If drawed
		if (this.drawed()) 
			return this.jDom().outerHeight();
		
		//Supposed height
		var hgt = _HEADER_HEIGHT;
		$.each(this._entries, function(i, oEntry) {
			hgt += oEntry.height() + 5; //ibox padding-bottom
		});
		return hgt;
	}
	
	/** Width of the container */
	this.width = function() {
		if (this.drawed())
			return this.jDom().outerWidth();

			return _BOX_WIDTH;
	}
	
	/** Recursive hiding when close child */
	this.mask = function() {
		var bHide = true;
		if (this.isContainer()) {
			//!!! If only Not last : use for toggle
			if (this._entries.length>1) {
				$.each(this._entries, function(i, oEntry) {
					if (oEntry.isDisplayed()) {
						bHide = false;
						return false; //break
					}
				}); 
			}
		}

		if (bHide) {
			//Hide this jdom
			$(this.id()).hide();
			
			//Hide it's container
			if (this._container) this._container.mask();
		}
	}
	 
	/** Count number of visible child */
	this.entryNumber = function() { 
		//Update Group count 
		try {
			return parseInt(this.panelBody().find(".entry:visible").length); 
		}
		catch (err) {}
		return 1;
	}
	
	this.groupNumber  = function() {
		if (this.isGroup()) return 1;
		
		try {
			return parseInt($(this.id()).find(".panel-primary:visible").length); 
		}
		catch (err) {}
		return 0;
	}
	
	/** Dynamic handle content number */
	this.handleEntryNumber = function() {
		
		if (this.isContainer()) { 
			$.each(this._entries, function(i, obj) {
				if (obj.isGroup()) {
					obj.handleEntryNumber();
				}
			});
			var num = this.groupNumber();
			this.setToActive(num);
			return num; //(this._entries.length);
		}
		
		var num = this.entryNumber();
		$(this.id() + " .panel-title span.badge").text(num);
		
		//Show set to active data
		this.setToActive(num)
		
		//Add scrolling  
		if (num > _MAX_ENTRIES) { 
			if ( $(this.id()).children(".slimScrollDiv").length <= 0 ) {
				this.panelBody().slimScroll({
				  height : "100%"
			    , width  : "100%"
				, railOpacity : 1
				, color : "#ff8080"
				, scrollEvent : function() {_SVG.redrawLines();} 
				}); 
				
				//Show zoom
				$(this.id() + " .toZoomGroup").show();
			} 
		}  
		
		return num;
	}
	
	/** Check if has visible entries */
	this.hasVisible = function() {
		for (var i=0; i<this._entries.length; i++) {
			if (this._entries[i].isVisible())
				return true;
		}
		return false;
	}

	/** Set position */
	this.setPosition = function(pos) {	
		this._position = pos; 
		
		var $elt = this.jDom();
		if (!$elt) return;
		
		$elt.css("top", pos.top);
		$elt.css("left", pos.left);
		$(this.id()+":last").offset({ top: pos.top, left: pos.left });
	}
	
	/** Get top position */
	this.top = function(bTopContainer) {
		if (bTopContainer && this._container)
			return this._container.top();
		
		var $elt = this.jDom();
		if ($elt && $elt.length>0) 
			return $elt.offset().top;
		
		return this._position.top;
	}
	
	/** Get left position */
	this.left = function() {
		if (this._container) {
			return this._container.left();
		}
		var $elt = this.jDom();
		if ($elt && $elt.length>0) 
			return $elt.offset().left;
		
		return this._position.left;
	}
 
	/** Read checked values */
	this.readChecked = function(tab) {
		$.each(this._entries, function(i, oEntry) {
			oEntry.readChecked(tab);
		});	
	}

	/** Check/Uncheck recursive */
	this.check = function(bChecked) {
		// Check/unchek this and its children
		$(this.id()+" input[type='checkbox']").prop("checked", bChecked);
		
		//If uncheck GROUP //=> Uncheck its container immediately
		if (this._container) {
			this._container.handleChildChecks(bChecked);
		}
	}
	
	/** Handle (un)checking parent, if children (un)checked */
	this.handleChildChecks = function(bChecked) {
		
		//If all children are checked, check this
		if (bChecked) {
			//If all children is checked (not checked not exists)
			//Check parent(s)
			if ( $(this.id()+ " .panel-body").find('input:checkbox:not(:checked)').length == 0) {
				$(this.id() + " .panel-heading input[type='checkbox']").prop("checked", bChecked);
			}
		}
		else {
			//If one children is unchecked, uncheck this immediately
			$(this.id()+" > .panel-heading .check").prop("checked", bChecked);
		}
		
		//Recursive
		if (this._container) {
			this._container.handleChildChecks(bChecked);
		}
	}

	/** Get panel body js object */
	this.panelBody = function() {	
		if ($(this.id()).children(".slimScrollDiv").length>0)
			return $(this.id()).children(".slimScrollDiv").children(".panel-body");
		
		var pBody = $(this.id()).children(".panel-body");
		return pBody; 
	}
	
	/** Append child */
	this.append = function(htm) {
		this.panelBody().append(htm);
	}

	/** Number of box to draw  for order */
	this.boxNumToDraw = function() {
		var nb = 1; //Panel Heading
		$.each(this._entries, function(i, obj) {
			nb += obj.boxNumToDraw();
		});
		return nb;
	}
	
	/** Get top container */
	this.topBox = function() {	 
		if (this._container)
			return this._container;
		return this;
	}

	/** Show this */
	this.display = function() {
		if (this._container) 
			this._container.display();
		
		//Show element
		$(this.id()).show(); 
		return true;
	}
	
	/** Check if has extended box */
	this.hasExtendedBox  = function() {
		for (var i=0; i<this._entries.length; i++) {
			var obj = this._entries[i];
			if (obj.hasExtendedBox())
				return true;
		}		
		return false;
	}
		
	/** Get html div of the box */
	this.HTML = function(bContainer) { 	 

		var bHasContainer = false;
		if ( (""+bContainer) == "true" )
			bHasContainer = true;
		else if ( (""+bContainer) != "false" )
			bHasContainer = (this._container && this._container.isVisible());
		
		//Calculate style
		var style = "";
		
		//Body style
		var bStyle = "";
		
		//Checkbox style
		var cStyle = "";
		
		//Panel class
		var pClass 	= "";
		
		if (this.isGroup()) {
			pClass = "panel-primary";
			bStyle = "group";
			cStyle = "check-gp";
		}
		else {
			pClass = "panel-default";
		    cStyle = "check-c";
		}
		
		//Set if parent or children
		var n = 0;
		if (this._iLevel<n)
			pClass += " ancestr";
		else if (this._iLevel>n)
			pClass += " child";
		else
			pClass += " active";
		
		if ( bHasContainer ) {
			pClass += " ibox";
		}
		else { 
			pClass += " ibox-c";  
		
			var pos = initialPosition(this);
			style = 'style="position:absolute;top:'+pos.top+'px;left:'+pos.left+'px;"';
		}
		
		//pClass += " zoomContainer";
		
		//-Panel
	    var htm = '<div id="'+this._id+'" for="'+this._id+'" class="panel '+pClass+'" '+style+'>';
	    
		    //-Panel Heading
		    htm += 	'<div class="panel-heading">';
	    
			    //Checkbox 
			    htm += 	'<input type="checkbox" class="check '+cStyle+'" name="'+this._id+'">'; 
			    
			    //- Title
			    htm += '<span class="panel-title">';
			    if (this.isGroup())
			    	htm += '<span class="badge"></span>';
			    else
			    	htm += '<span class="emsp"> </span>';
			     			    
			    //Label
			    htm += this._label+'</span>';
			    
			    //Append zoom
			    htm += '<span class="emsp"> </span>';
			    if (this.isGroup()) {
			    	htm += '<span class="fa fa-expand toZoomGroup" style="display:none" title="Open in full window"></span>';
			    }
			    
			    //Append set to active data
			    if (this._iLevel != 0 || bHasContainer) 
			    	htm += '<span class="fa fa-external-link toActiveData" style="display:none" title="Set this to actif"></span>';
			    
		    htm += '</div>'; //End panel heading
		    
		    //-Panel body
		    htm += '<div class="panel-body '+bStyle+'"></div>';
		    htm += '<div class="collapseBody"></div>';
		    
	    htm += '</div>'; //End Panel
	    
		return htm;
	};

 
	/** Check if children or parent */
	this.isChild = function() {
		return (this._iLevel>0);
	}
	
	/** Get connector */
	this.connector = function(bIsChild) { 
		return null;
	}
	
	/** Draw this container */
	this.draw = function(iLevel) {  
		//Don't redraw
		if (this.drawed()) { this.display(); return true;}
		
		this._iLevel = iLevel;
		
		//Draw from tool from process
		if (this._container 
			&& this._container.draw(iLevel) //Ensure that container is drawn before
		) {
			var htm = this.HTML(true);
			var label = this._label;
			$.each(this._container._entries, function(i, obj) {
				if ( obj.drawed() && obj._label == label) {
					var id = obj.id();
					$(htm).insertAfter( id );
					htm = "";
					return false;
				}
			})
			if (htm) this._container.append(htm); 
		}
		//Absolute position
		else {
			var htm = this.HTML(false);
			$("#main").append(htm); 
		}
		
		if ( $("#showCheck").hasClass("fa-toggle-on")) {
			//Show all checkboxes
			$( this.id() + " .check").show();	
		}
		return true;
	}
	
} //============================ END Class Entry ============================
