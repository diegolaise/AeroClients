/**=================================================================
 * 
 * 					 Entry Object
 * 
 *==================================================================*/
function Entry(jData) { 
	this._type 	  = "ENTRY";
	this._id	  = "box";
	this._class   = "entry";
		
	this._json  	= jData;
	this._label 	= jData["label"];
	this._path  	= jData["path"];
	this._metadata 	= jData["metadata"] || {}; 
	this._version	= jData["version"];
	this._allVersions= jData["versions"] || [];
	
	this._pLinks	= getArrayObj(jData, "parent");   //parent links paths
	this._cLinks	= getArrayObj(jData, "children"); //child links paths

	this._parents 	= []; //Created parents
	this._children  = []; //Created children
	this._entries   = [];
 
	//His container
	this._container = null;
	
	// Initial Position X, Y
	this._position = {"top" : -1, "left" : -1};
	this._iLevel   = _BEGIN_LEVEL; 
	 
	//======================= METHODS ==========================
 
	/** Get path of this */
	this.get = function(attr) {
		return this._json[attr];
	}

	this.shortPath = function() {
		var i = this._path.indexOf("?");
		if (i<0) return this._path;
		
		return this._path.substring(0,i);
	}
	
	/** Get jquery id */
	this.id = function() {
		return ("#"+this._id);
	}; 
	
	/** If dom is displayed but can be collapsed inside parent */
	this.isDisplayed = function() {
		if ( !this.drawed() ) return false;	
		return ( $(this.id()).is(":visible") );
	}
	
	/** If dom element is displayed and visible */
	this.isVisible = function() {
		if (this._container) {
			if (this._container.isCollapsed())
				return false;
		}
		return this.isDisplayed();
	}
	
	/** Get all entries */
	this.allEntries = function() {
		return [this];
	}
	
	/** Number of visible */
	this.entryNumber = function() { 
		return ( $(this.id()).is(":visible") ? 1 : 0);
	}
	
	/** Return entry number of container group */
	this.handleEntryNumber = function() {  
		if (this._container && this._container.isGroup()) {
			this._container.handleEntryNumber();
		}
		return this.entryNumber(); 
	}
	 
	/** Check if has extended box */
	this.hasExtendedBox  = function() {
		if (this.isChild()) 
			return (this._cLinks.length>0);
		
		return (this._pLinks.length>0);
	}

	/** Check if drawed */
	this.drawed = function() {  
		var id = this.id();
		var b = ( $(id) && $(id).length>0);
		return b;
	}
	
	/** Get jquery object */
	this.jDom = function() {
		if (!this.drawed()) return null;
		return $(this.id());
	}

	this.fromTool = function() {
		return this.metadata("From tool");
	} 
	this.fromProcess = function() {
		return this.metadata("From process");
	} 
	this.type = function() {
		return this.metadata("Type");
	} 
	this.metadata = function(key) {
		if (this._metadata && (key in this._metadata))
			return this._metadata[key];
		return "";
	}
 
	/** Get meta-data popover */
	this.tooltip = function() {
		if (!this._metadata) return "";
		var str = ""; var sep = "";
		$.each(this._metadata, function(key, val) {
			str += sep + "<label style='width:70px;'>"+key+"</label>:&emsp;"+val+"";
			sep = "<br>";
		});
		
		//Don't show all version
		str += "<br><label style='width:70px;'>Versions</label>:&emsp;" + this._allVersions.toString();
		return  str;
	};
	
	this.popath = function() {
		var path = "";
		var p = this._path;;
		while (p.length>30) {
			path += p.substring(0,30) + "<br>";
			p = p.substring(30);
		}
		path += p;
		return path;
	}
	
	/**
	 * Add parent
	 * @param: oP : the parent to add
	 */
	this.addParent = function(oP) {	
		if (!oP) return;
		if ( $.inArray(oP, this._parents)<0 ) {
			this._parents.push(oP); 
			oP._children.push(this);	
		}
	};
 
	/** Get parents lists */
	this.oParents = function() { 
		return this._parents;
	};
		
	/**
	 * Get children
	 */
	this.oChildren = function() { 
		return this._children;
	};

	/**
	 * Add this to a Container
	 * @param oContainer : the parent to add
	 */
	this.setContainer = function(oContainer) {	
		if (oContainer) {
			this._container = oContainer;
		}
	};
	
	/** Number of box to draw for order*/
	this.boxNumToDraw = function() {  
		return 1; 
	}

	/** Set position */ 
	this.setPosition = function(pos) {	
		//Keep initial position for re-Order 
		this._position = pos; 
		
		var $elt = this.jDom();
		if (!$elt) return;
		
		$elt.css("top", pos.top);
		$elt.css("left", pos.left);
		$(this.id()+":last").offset({ top: pos.top, left: pos.left });
	}
	
	this.addEntry = function(oEntry) {}
	
	/** Get real top position */
	this.top = function(bTopContainer) { 
		if (bTopContainer && this._container) {
			return this._container.top();
		} 
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
		if ($elt && $elt.length>0) return $elt.offset().left;
		
		return this._position.left;
	}
	 
	this.height = function() {
		var $elt = this.jDom();
		if ($elt && $elt.length>0) return $elt.outerHeight();
		
		return _BOX_HEIGHT;
	}
	
	this.width = function() {
		if (!this.drawed()) { 
			return ((this._label.length * 7) + _VERSION_BOX);
		}
		return this.jDom().outerWidth();
	}

	/** Read all checked */
	this.readChecked = function(tab) {
		if ( $(this.id() + " input:checkbox").prop("checked") ) {
			if (this._path.indexOf("ver=")<0 && this._version)
				tab.push(this._path + "?ver=" + this._version);
			else
				tab.push(this._path);
		}
	}
	
	/** Check this */
	this.check = function(bCheck) {	
		$(this.id() + " .check").prop("checked", bCheck);
		
		//Uncheck parent if false
		if (this._container) {
			this._container.handleChildChecks(bCheck);
		}
	}
	
	/** Get my first container */
	this.topBox = function() {	
		if (this._container)
		   return this._container.topBox();	
		return this;
	}
	
	/** Check if Can show */
	this.canShow = function() {
		var bFilter = true;

		if ( $("#lastVersion").hasClass("fa-check-circle-o") ) {
			if (this._class.indexOf("no-last")>=0)
				bFilter = false;
		}
		else {
			var tFilter = getUnfilteredList("version");
			if (tFilter.indexOf("v"+this._version)>=0)
				bFilter = false;
			else {
				tFilter = getUnfilteredList("extension");
				if (tFilter.indexOf(this.extension())>=0)
					bFilter = false;
			}
		}
		return bFilter;
	}
	
	/** Show this */
	this.display = function() {
		if (!this.canShow()) return false;
		if (this._container) {
			this._container.display();
		}
		$(this.id()).css("display", "block"); 
		return true;
	}
	
	/** Hide cascade */
	this.mask = function() { 
		//Hide this
		$(this.id()).css("display", "none");
		
		if (this._container) {
			//If all entries are hidden
			if (! this._container.hasVisible())
				this._container.mask();
			else
				this._container.handleEntryNumber();
		}
	}; 
	
	/** Check if children or parent */
	this.isChild = function() {
		return (this._iLevel > 0);
	}
	
	/** Get connector */
	this.connector = function(bIsChild) {
		if (bIsChild || this.isChild()) 
			return $(this.id() + " > span.droite");
		else
			return $(this.id() + " > span.gauche");
	}
	
	this.hasConnector = function() { 
		if ( $(this.id() + " > span.droite").length > 0) return true; 
		if ( $(this.id() + " > span.gauche").length > 0) return true;
		return false;
	}

	/** Get extension */
	this.extension = function() {
		var i = this._label.lastIndexOf(".");
		if (i<0) return "";
		return this._label.substring(i+1);
	}

	/** Get html div of the box */
	this.HTML = function(bContainer) {	 
		var style = '';
		
		var bHasContainer = false;
		if ( (""+bContainer) == "true" )
			bHasContainer = true;
		else if ( (""+bContainer) != "false" )
			bHasContainer = (this._container && this._container.isVisible());
		
		//Calculate class
		if ( !bHasContainer ) {
			
			if (this._class.indexOf("entry-c")<0)
				this._class = this._class.replace("entry", "entry-c");
			
			var pos = initialPosition(this);
			style = 'position:absolute;top:'+pos.top+'px;left:'+pos.left+'px;';
		}
		else
			style = 'position:relative;';
		
		var leftHtmConnector = ' <span class="glyphicon glyphicon-plus-sign gauche" title="'+this._pLinks.length+'"></span>';
		var rightHtmConnector= ' <span class="glyphicon glyphicon-plus-sign droite" title="'+this._cLinks.length+'"></span>';
		
		var rConnector = "";
		var lConnector = "";
		
		var isActive = false;
		var isChild  = false;
		
		var vStyle = "";
		if (this._iLevel == 0) {
			//if (!this._container) 
				this._class += " active";
			isActive = true;
			
			if (this._container && this._class.indexOf("vlast")<0) 
				style += 'display:none;';  
			
			if (this._cLinks.length>0) {
				style += "margin-right:5px;";
				rConnector = rightHtmConnector;
			}
	
			if (this._pLinks.length>0) {
				style += "margin-left:5px;"
				lConnector = leftHtmConnector;
			}
		}
		else {
			//Add parent or child class
			var n = 0;
			isChild = (this._iLevel > n );
			
			//Class for Child or Parent filter
			this._class += (isChild ? " child" : " ancestr");

			if (isChild) {
				if (this._cLinks.length>0) {
					style += "margin-right:5px;";
					rConnector = rightHtmConnector;
				}
			} else {
				if (this._pLinks.length>0) {
					style += "margin-left:5px;"
					lConnector = leftHtmConnector;
				}
			} 
					
			//- FILTER
			if (! this.canShow() ) 
				style += 'display:none;';
			
			if (this.metadata("Creation version") == this._version) 
				style += "background:#EFEFEF;"
			 
			//Color Rose if validated		
			if (this.metadata("Status") == "Validated") 
				style += "color:#2780e3;"; //Bleu #2780e3;
			
			//Version style : Bleu if last
			if ( this._class.indexOf("vlast")>=0 )
 				vStyle = 'style="color:#ff8080;"'; //Rose: #ff8080; Char blue
			  
		} //end if/else active data 
		
		//Class for version
		this._class += " v"+this._version;
		
		//Class for extension
		var ext = this.extension();
		this._class += " "+ext;
		
		//Format style
		if (style) { style = 'style="'+style+'"'; }

		//Create div :  data-trigger="hover" //focus for click => not working
	    return '<div id="'+this._id+'" for="'+this._path+'" class="'+this._class+'" '+style+'>' 
	     
	     		//Left Parent connector
	     		+ lConnector
	     	   
	    	    + ' <span class="version" title="'+this.popath()+'" ' + vStyle
	    	    + ' data-toggle="popover" data-placement="right" data-html="true"'
	    	    + ' data-container="body" data-trigger="hover" data-content="'+this.tooltip()+'">v'+this._version+'</span>'
	     	   
	    	    // Filename
	    	    + ' <span class="filename" title="'+this._path+'">'+ this._label + ' </span>'
	    	    + ( isActive && !bHasContainer ? "" :
	    	       ' <span class="fa fa-external-link toActiveData" title="Set this to actif"></span>'
	    	     )

	    	    //Checkbox
	            + ' <input type="checkbox" class="check check-e" '+ (isActive ? 'checked':'') + '>' 
	           
	            //Right Connector for Children
	            + rConnector
	           
	         + '</div>';
	};
	
	/** Get html */
	this.currentHtml = function() {
		var style = this.jDom().attr("style");
		var myHtml = '<div id="'+this._id+'" for="'+this._path+'" class="'+this._class+'" '+style+'>'
					+ this.jDom().html();
					+ '</div>';
		return myHtml;
	}
	
	/** Reset this to redraw */
	this.reset = function() {
		this._position = {"top" : _MIN_TOP, "left" : _MIN_LEFT};
		this._iLevel   = _BEGIN_LEVEL; 
	}
	
	this.isEntry 	 = function() { return true;}
	this.isGroup 	 = function() { return false;}
	this.isContainer = function() { return false;}

	/**
	 * Draw this entry 
	 * @param iLevel
	 */
	this.draw = function(iLevel, lastPath) {
		
		if ( this.drawed() ) {
			this.display(); 
			return;
		} 
		
		//Calculate absolute position of this 
		this._iLevel = iLevel;
		this._id     = "box" + uniqId() + "-" + this._iLevel;
		
		//Check if last version
		if (lastPath) {
			if (lastPath.indexOf(this._path)>=0)
				this._class += " vlast";
			else
				this._class += " no-last";
		}
		
		//Draw Containers before  
		if ( ! this._container) 
			$("#main").append(this.HTML()); 
		else { 
			
			//Draw container before
			if (!this._container.drawed()) {
				this._container.draw(this._iLevel);
			}
			
			//Append my content
			this._container.append(this.HTML(true)); 
		}  
		
		//Show popover
		$('[data-toggle="popover"]').popover(); 
		
		//If check active : show checkbox
		if ( $("#showCheck").hasClass("fa-toggle-on"))  {
			$(this.id() + " .check").show();
			
			//Check it if check all
			if ( $('#chck').hasClass("fa-check-square-o") 
			  || ( this._class.indexOf('ancestr')>=0 && $('#chckancestr').hasClass("fa-check-square-o") )
			  || ( this._class.indexOf('child')>=0 && $('#chckchild').hasClass("fa-check-square-o") )
			  ) {
				this.check(true);
			}
		} 
	};
	
} //============================ END Class Entry ============================
