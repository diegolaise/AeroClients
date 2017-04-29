'use strict';
 
angular.module('Tree')
.factory('TreeService', ['$http', '$resource', 'SERVER_URL', function ($http, $resource, SERVER_URL) {

	var service = {};
	
	var _D_NODES = {};
	var _IN_CALL = {};
	
	var _http = $resource(SERVER_URL + "/getTreeDatas/:path/:folder/:level");

	/**
	 * Get Tree nodes for a path
	 */
	service.getTreeNodes = function(foldePath, folderOnly, callback, errorHandler) {
		
		if (_D_NODES[foldePath]) {
			if (callback) { 
				callback( _D_NODES[foldePath] ); 
				
				var tabs = _D_NODES[foldePath];
				if (tabs.length==1)
					tabs = tabs[0].nodes;
					
				$.each(tabs, function(i, node) {
					if (node.tags == "0") { 
						console.log(" -> Sub Call: " + node.href);
						getTreeNodes(node.href, false); 
					} 
				});
			}
			return _D_NODES[foldePath];
		}
		
		if (foldePath in _IN_CALL) {
			_IN_CALL[foldePath] = callback;
			return;
		}
		
		_IN_CALL[foldePath] = callback; 
		
		var startTime = (new Date()).getTime();		 
		_http.get({path: foldePath, folder:folderOnly, level:1}, function(jtab) {  
				console.log("- " + foldePath + " : " + (((new Date()).getTime() - startTime)/1000) );
				
				//console.log(" -> End: " + foldePath);
				_D_NODES[foldePath] = jtab;
				
				if (!callback) {
					callback = _IN_CALL[foldePath];
				}

				if (foldePath in _IN_CALL) {
					delete _IN_CALL[foldePath];
				}
				
				if (callback) {
					callback(jtab); 
				}
			},
			function (err) {  
				console.log("ERROR: failed to load paths for: " + err);
				if (errorHandler) {
					errorHandler(err);
				}
			}
		);	
	};//END getTreeNode

	/**
	 * Show tree in bootbox
	 */
	service.showTree = function(bFolderOnly, endTreeFct) {
		
		$("#main").css({opacity: "0"});
	 
		//Tree root
		var rootFolder =  "/Projects/";
		
		//--------------------------------------
		// Call & SHOW TREE
		//-------------------------------------- 
		service.getTreeNodes(rootFolder, true, function(json) { 
			    if (!json) {
			    	return;
			    }
			
				//============= TREE FRM ==============
				var treeFrm = '<form class="form-horizontal"> ' +
				'<fieldset> ' +
		
					'<div class="form-group"> ' +
					
						'<div class="col-md-6"> ' + 
							'<input type="text" class="form-control" id="tree-search" placeholder="Search ..." value="">'+ 
						'</div> ' +
			
						'<div class="col-md-3">' +
						'	<input type="checkbox" id="chk-exact-match" value="false"><span style="padding:5px">Exact Match</span></br>' +
						'	<input type="checkbox" id="chk-ignore-case" value="false"><span style="padding:5px">Ignore Case</span>' +
						'</div>' + 
		
					'</div>' +
			
					'<div class="form-group"> ' +
						'<div id="treeview-searchable" class="col-md-12"></div>' + 
					'</div>' +
			
					'<div id="selectable-output"></div>' + 
		
				'</fieldset> ' +
				'</form> ';
				//=================================================================
		
				bootbox.dialog({ title: "Select file"
					, message: treeFrm
					, className: "widget-tree"
						, closeButton : true
						, buttons: {
							cancel: { label: "Cancel"
									, className: "btn-default" 
								    , callback: function () {   
								    	$("#main").css({opacity: "1"});
								    	if (endTreeFct) {
								    		endTreeFct(null);
								    	}
								    }
							},
							success: {
								label		: "OK",
								className	: "btn-primary btn-large", 
								callback: function () {
									$("#main").css({opacity: "1"});
		
									var selectedPath = $('#selectable-output').html().trim();
									if (selectedPath) {
										selectedPath = selectedPath.replace(/#/, "");
										
										//Load a new Active data
										//_oAppScope.changeActiveData(selectedPath, true); 
										if (endTreeFct) {
											endTreeFct(selectedPath);
										}
										
										$("#actdata").removeClass("ic-enabled");
										$("#actdata").addClass("ic-disabled");
									} 
								}
							} 
						}
				});//end bootbox
		
				//Create tree
				var $treeInstance = $("#treeview-searchable").treeview({
					showBorder: false
					//, color: "#428bca" 
					, expandIcon  : "glyphicon glyphicon-folder-close"
					, collapseIcon: "glyphicon glyphicon-folder-open"
					, folderOnly  : false /*set folder only to false when open node*/
					, data		  : json 
					, onNodeSelected: function(event, node) {
						//select only file
						if (node.tags == "1") {
							$('#selectable-output').html(''+node.href+'');
						}
						else {
							$('#selectable-output').html('');
						}
					}
					, onNodeUnselected: function(event, node) { $('#selectable-output').html(''); }
					, getNodeChild    : service.getTreeNodes
				});
		
				//Searche in tree
				var treeSearch = function(e) {
					var pattern = $("#tree-search").val();
					var options = {
						ignoreCase: $("#chk-ignore-case").is(":checked"),
						exactMatch: $("#chk-exact-match").is(":checked"),
						revealResults: true 
					};				
					$treeInstance.treeview("search", [pattern, options]); 
				}
	  
				$("#tree-search").on("keyup", treeSearch); 
				
				//Handle clearing
				$("#tree-search").on("mouseup", function() {
					var pattern = $("#tree-search").val();
					if (!pattern) return false;
					 
					setTimeout(function() { 
						if ($("#tree-search").val().trim() == "") { 
							treeSearch();
						}
					}, 10); 
				});	
				
				$(".widget-tree input[type='checkbox']").on("click", function() {
					treeSearch();
				});
		
				$(".widget-tree .modal-header").css("background", "#fff");
				$(".widget-tree .modal-body").css("background", "#ddd");
				
				var hgt =  $("body").outerHeight() - 160;
				$(".widget-tree .modal-body").css("height", hgt);  
				$(".widget-tree #treeview-searchable").css("height", hgt - 120); 

		});   
	}; //end service get Tree Node

	return service;
}]
);

