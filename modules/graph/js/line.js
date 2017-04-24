/**=================================================================
 * 
 * 				Drawing canvas lines
 * 
 *==================================================================*/
(function($) {
	/**
	 * Check if node is inside collapsed or inside hidden scroll
	 * @param $node
	 * @returns collapsed node
	 */
	 function getCollapsed($node) {	
		try {  
			var pCollapsed = $node.parents().filter(function() {
				if ( $(this).css("display") == "none" )
					return $(this);
			});
			
			//Return parent that collapsed
			if (pCollapsed && pCollapsed.hasClass("panel-body")) {
				var $panel = pCollapsed.closest(".panel");
				if ( $panel.is(":visible") )  
					return $panel;
			}
			
			var $slimScroll = $node.parent().parent();
			if ( $slimScroll.hasClass("slimScrollDiv")) {
				
				var ntop = $node.offset().top; //Top of the node 
				if (ntop==0 || ! $node.is(":visible")) return $slimScroll.prev();
				
				var panelBody = $node.closest(".panel-body");
				var maxtop = panelBody.offset().top;
				var bottom = maxtop + panelBody.outerHeight();
				if ( ntop < (maxtop - 4) || ntop > (bottom - 4) ) //4 : padding
					return $slimScroll.prev();
			}
		}
		catch (err) {}
		return null;
	}
	 
	/**
	 * Get nearest node if toggle
	 * @param dom
	 * @returns
	 */
	 function getNode(dom) {			
		var $node = $(dom); 
 
		//Check if toggle => return the header
		var pCollapsed = getCollapsed($node);
		if (pCollapsed) {  
			$node = pCollapsed;
		}

		return $node;
	} 

	 /**
	  * Get absolute position of a div
	  * @param $div
	  * @returns {}
	  */
	 function getPosition($div, max_height, max_width) { 	
	 	var left  = $div.offset().left;
	 	var top   = $div.offset().top; 
	 	
	 	//Secutite
	 	if (top < 10 || top > max_height || left < 10 || left > max_width) return null;	
	 	
	 	//Set top in the middle of the top box
	 	var plus = ($div.outerHeight() / 2);
	 	var id = $div.attr("id");
	 	var $pHeading = $( "#"+id+" .panel-heading" );
	 	if ($pHeading && $pHeading.length>0) {
	 		plus = ($pHeading.outerHeight() / 2);
	 	}
	 	top += plus;

	 	return {"left" : left, "top" : top};
	 };


	/**
	 * Get color from option
	 */
	function lineColor(option) {
		var color = '#666';
		switch (option.status) {
		case 'accepted':
			color = '#0969a2';
			break;

		case 'rejected':
			color = '#e7005d';
			break;

		case 'modified':
			color = '#bfb230';
			break;

		case 'none':
			color = '#666';
			break;

		default:
			color = '#666';
		break;
		}
		return color;
	}
	
	/**
	 * Get line style from option
	 */
	function lineStyle(option) {
		var dash = [0, 0];
		//To decide style of the line. dotted or solid
		switch (option.style) {
		case 'dashed':
			dash = [4, 2];
			break;

		case 'solid':
			dash = [0, 0];
			break;

		case 'dotted':
			dash = [4, 2];
			break;

		default:
			dash = [0, 0];
		break;
		}
		return dash;
	}
	
	/* ----------------------------------------------------------------------
	 * 
	 * This Function is used to creata a canvas and draw line before two div
	 *
	 * ---------------------------------------------------------------------- */ 
	$.fn.connect = function(param) {

		var _me = this;
		var _ctx;
		
		var _transX = 1;
		var _transY = 1;
		
		var _lines = new Array(); //This array will store all lines (option)		
		var _parent = param || document;
		 
		//Initialize Canvas object)
		var _canvas = $('<canvas/>').attr('width', $(_parent).width()).attr('height', $(_parent).outerHeight());
		$('body').append(_canvas);
		
		//_canvas.css("background-color", "red");
		//_canvas.css("border", "1px solid #ddd");
		 
		var _drawed = {};
		
		var _max_height = $(_parent).height();
		var _max_width  = $(_parent).width();

		/* ----------------------------------------------------------------------
		This Function is used to connect two different div with a dotted line.
		option = {
			left_node  : Left Element by ID - Mandatory
			right_node : Right Element ID - Mandatory
			status 	   : accepted, rejected, modified, (none) - Optional
			style      : (dashed), solid, dotted - Optional	
			horizantal_gap - (0), Horizantal Gap from original point
			error      : show, (hide) - To show error or not
			width      : (2) - Width of the line
		}
		* ---------------------------------------------------------------------- */ 
		this.connect = function(option, bToggleSwitch) {
			 
			if (!option || !option.left_node || !option.right_node) { 
				console.log('Mandatory Fields are missing or incorrect');
				return;
			}
			
			var oError = (option.error == 'show') || false;
			
			var oLeft = new Object(); //This will store oLeft elements offset  
			var oRight = new Object(); //This will store oRight elements offset	

			_ctx = _canvas[0].getContext('2d');
			_ctx.beginPath(); 


			try { 
				//If left_node is actually right side, following code will switch elements. 
				var $left  = getNode(option.left_node); 
				if (!$left) return false;  
				 
				var $right = getNode(option.right_node);
				if (!$right) return false; 	

				//Get Left point and Right Point
				//------------------ LEFT ------------------- 
				var lPos = getPosition($left, _max_height, _max_width);
				if (!lPos) return false;
				oLeft.x = (lPos.left * _transX) + $left.outerWidth() ;
				oLeft.y = lPos.top * _transY;
				 
				//------------------ RIGHT -------------------   
				var rPos = getPosition($right, _max_height, _max_width);
				if (!rPos) return false;
				oRight.x = (rPos.left * _transX) + 2;
				oRight.y = rPos.top * _transY;
				 
				//--------- Draw Line
				var _gap = option.horizantal_gap || 0;

				_ctx.moveTo(oLeft.x, oLeft.y);
				if (_gap != 0) {
					_ctx.lineTo(oLeft.x + _gap, oLeft.y);
					_ctx.lineTo(oRight.x - _gap, oRight.y);
				}
				_ctx.lineTo(oRight.x, oRight.y);

				//Line style
				if (!_ctx.setLineDash) {
					_ctx.setLineDash = function() {}
				} 
				else { 
					var dash  = lineStyle(option);
					if ( (option.left_node !== "#"+$left.attr("id")) 
					  || (option.right_node!== "#"+$right.attr("id")) ) dash = [4, 2];
					_ctx.setLineDash(dash);
				}
				_ctx.lineWidth   = option.width || 1;
				_ctx.strokeStyle = lineColor(option);
				_ctx.stroke();
				
				//Add option
				this.add(option);
				
				//Draw -> Open (left/right) connectors (-)
				if (bToggleSwitch) this.switchConnector(option,  true); 
				return true;

			} catch (err) {
				if (oError) alert('Draw error \n' + err);
				console.log("ERROR! drawing " + err); 
			}
			return false;
		};
		 
		/** DRAW */
		this.drawLine = function(option) {		
			//Dont't show line if left/right node is not visible
			if (this.isVisible(option)) {		
				//It will push line to array.
				_lines.push(option);
				this.connect(option);
				return true;
			}
			return false;
		};

		this.isVisible = function(option) {			
			var idLeft = option.left_node;
			if ( ! $(idLeft).is(":visible") ) return false;

			//Dont't show line if right node is not visible
			var idRight = option.right_node;
			if (! $(idRight).is(":visible") ) return false; 

			return true;
		}
 
		this.key = function(opt) {
			return opt.left_node+"|"+opt.right_node;
		};

		/** Add line */
		this.add = function(option) {
			var k1 = this.key(option);
			_drawed[k1] = option; 
		};	
 
		/** Reset ALL */
		this.reset = function() { 
			this.disable(false); 
			if (_ctx) _ctx.clearRect(0, 0, $(_parent).width(), $(_parent).height());
			_drawed = {};	
			_lines = new Array();
		}
 
		/** Check if 2 ids are linked */
		this.isLinked = function(leftId, rightId) {
			var key1 = leftId  + "|" + rightId;
			var key2 = rightId + "|" + leftId;		
			return ((key1 in _drawed) || (key2 in _drawed));
		};
		
		/** Get all right ids of left id */
		this.getRight = function(leftId) {
			var tabLeftId = [];
			$.each(_drawed, function(key, option) {			
				if (key.indexOf(leftId+"|")==0) {
					tabLeftId.push(option.right_node);
				}
			});
			return tabLeftId;
		};

		/** Get all left ids of right id */
		this.getLeft = function(rigthId) {
			var tabRightId = [];
			$.each(_drawed, function(key, option) {
				if (key.indexOf("|"+rigthId)>0) {
					tabRightId.push(option.left_node);
				}
			});
			return tabRightId;
		};

		this._removed = [];
		
		/** Remove a link */
		this.removeLink = function(leftId, rightId, bNotRedraw) {
			var key = leftId + "|" + rightId;
			if (! (key in _drawed))
               key = rightId+ "|" + leftId;
			
			var option = _drawed[key];
			if (!option) return;
			
			var i = $.inArray(option, _lines);
			if (i>=0) _lines.splice(i, 1);
			
			if ($.inArray(key, this._removed)<0) 
				this._removed.push(key);
			
			if (bNotRedraw)
				delete _drawed[key];
			else
				this.redrawLines(); 
		};
		
		this.wasRemoved = function(leftId, rightId) {
			return (   this._removed.indexOf(leftId + "|" + rightId) >= 0
					|| this._removed.indexOf(rightId  + "|" + leftId) >= 0);
		}
  
		/** Check if parent is collapsed */
		this.isCollapsedParent = function($node) {
			if ( getCollapsed($node) ) return true;
			return false;
		}

		/** Toggle connector according to (not)drawn line */
		this.switchConnector = function(entry) {

			var id = entry.left_node; 
			
			var $elt     = $(".droite", $(id)); 
			var bIsChild = ($elt && $elt.length>0);
			
			var nb = 0;
			if (bIsChild) 
				nb = this.getRight(id).length;
			else 
			{
				id = entry.right_node;
				$elt = $(".gauche", $(id)); 
				nb = this.getLeft(id).length;
			}
			 
			//No connector
			if (nb == 0) {
				//Close : add (+)
				$elt.removeClass("glyphicon-minus-sign");
				$elt.addClass("glyphicon-plus-sign");
			}
			else if (! $elt.hasClass("glyphicon-minus-sign") )  {
				//Open : add (-)
				$elt.removeClass("glyphicon-plus-sign");
				$elt.addClass("glyphicon-minus-sign");
			}
 
			return $elt;
		}
		 
		/** Can draw line if it is visible or parent is collapsed */
		this.isCanDrawLine = function(option) {			
			var idLeft = option.left_node;

			if ( ! $(idLeft).is(":visible") 		//If left node is not visible
			  && !this.isCollapsedParent($(idLeft)) //And not collapse
				) return false; 

			var idRight = option.right_node;
			if ( ! $(idRight).is(":visible") 
				&& !this.isCollapsedParent($(idRight))) return false; 

			return true;
		}
		 
		/** Update only if bigger */
		this.updateCanvas = function() { 
			if (!_ctx) return;	
			if (_canvas.attr('width') < $(_parent).width()
				|| _canvas.attr('height') < $(_parent).height() ) {
				this.redrawLines();
			}
		};
		
		/** Redraw all lines */
		this.redrawLines = function(bToggleSwitch) { 
			if (!_ctx) return;

			var wdt = $(_parent).width();
			var hgt = $(_parent).height();
			
			//CLEAR ALL
			_ctx.clearRect(0, 0, wdt, hgt);
			_canvas.attr('width', wdt).attr('height', hgt);
			
			_drawed = {}; 
			_max_height = hgt;
			_max_width  = wdt;
			
			//Redraw all lines
			_lines.forEach(function(entry) {				
				if (_me.isCanDrawLine(entry)) {
					_me.connect(entry, bToggleSwitch); 
				}
				else if (bToggleSwitch) 
				{    //Not draw the line -> close (left/right) (+) connectors 
					_me.switchConnector(entry, true);
				}
			});
		};
		
		this.zoom = function(zoom) { 
			_transX = 1.38;
			_transY = 0.98;
		}
		
		this.color = function(clr) {
			_canvas.css("background-color", clr); 
		}
		
		this.disable = function(bDisable) {
			var op = "1";
			if (bDisable) {
				//_canvas.addClass("hachure");
				op = "0.8";
				this.color("#ddd");
			} else {
				//_canvas.removeClass("hachure"); 
				this.color("transparent");
			}
			$("#main *").prop("disabled", bDisable);
			$("#main *").css("opacity", op); 
		}
		
		//---------------------------------------
		return this;
	};
}(jQuery));