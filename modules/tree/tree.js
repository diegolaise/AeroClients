/**---------------------------------------------------------------
 * TREE VIEW HANDLER
----------------------------------------------------------------- */
/**
 * Get tree node of a folder
 * @param foldePath
 * @param callback
 */
var _D_NODES = {};
var _IN_CALL = {};

var getTreeNodes = function (foldePath, folderOnly, callback) {
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
	//console.log("Call: " + foldePath); 
	
	var sUrl = _oAppScope.httpUrl()+"treeInfo.jsp?path="+foldePath
						+ "&level=1&folder="+folderOnly +_oAppScope.params("&");

	var startTime = (new Date()).getTime();
	$.ajax({ type		: "GET"
		, url			: sUrl
		, beforeSend	: function(xhr) {
			xhr.setRequestHeader("Authorization", "Basic " + _oAppScope._logStr); 
			xhr.setRequestHeader("WWW-authenticate", "database");
		},  
		dataType	: "json",
		async		: true,
		success		: function (jtab) {  
			console.log("- " + foldePath + " : " + (((new Date()).getTime() - startTime)/1000) );
			
			//console.log(" -> End: " + foldePath);
			_D_NODES[foldePath] = jtab;
			
			if (!callback) {
				callback = _IN_CALL[foldePath];
			}
			
			if (callback) {
				callback(jtab); 
			}
			
			if (foldePath in _IN_CALL)
				delete _IN_CALL[foldePath];
			
			//Anticiper le niveau suivant -> gain de temps
			if (folderOnly) 
			{
				var tabs = jtab;
				if (jtab.length==1)
					tabs = jtab[0].nodes;
					
				$.each(tabs, function(i, node) {
					if (node.tags == "0") { 
						//console.log(" -> Sub Call: " + node.href);
						getTreeNodes(node.href, false); 
					} 
				});
			}
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {  
			console.log("ERROR: failed to load paths for: " + errorThrown);
			if (callback) callback();
		}
	});	
}

$(document).delegate('#filepath', 'click', function (e) {

	$("#main").css({opacity: "0"});
 
	//Tree root
	var rootFolder =  "/Projects/";
	
	//--------------------------------------
	// SHOW TREE
	//-------------------------------------- 
	getTreeNodes(rootFolder, true, function(defaultData) { 
		    if (!defaultData) return;
		
			//============= TREE FRM ==============
			var treeFrm = '<form class="form-horizontal"> ' +
			'<fieldset> ' +
	
				'<div class="form-group"> ' +
				
					'<div class="col-md-6"> ' + 
						'<input type="text" class="form-control" id="tree-search" '
						+ ' placeholder="Search ..." value="">'+ 
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
	
			bootbox.dialog({
				title: "Select another active file"
				, message: treeFrm
				, className: "widget-tree"
					, closeButton : true
					, buttons: {
						cancel: { label: "Cancel", className: "btn-default"
							, callback: function () {   
								$("#main").css({opacity: "1"});
							}
						},
						success: {
							label: "OK",
							className: "btn-primary btn-large",
							callback: function () {
								$("#main").css({opacity: "1"});
	
								var selectedPath = $('#selectable-output').html().trim();
								if (selectedPath) {
									selectedPath = selectedPath.replace(/#/, "");
									
									//Load a new Active data
									_oAppScope.changeActiveData(selectedPath, true); 
									$("#actdata").removeClass("ic-enabled");
									$("#actdata").addClass("ic-disabled");
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
				, folderOnly  : false /*set folder only to false when open node*/
				, data: defaultData 
				, onNodeSelected: function(event, node) {
					//select only file
					if (node.tags == "1")
						$('#selectable-output').html(''+node.href+'');
					else
						$('#selectable-output').html('');
				}
				, onNodeUnselected: function(event, node) { $('#selectable-output').html(''); }
			});
	
			var treeSearch = function(e) {
				var pattern = $("#tree-search").val();
				var options = {
					ignoreCase: $("#chk-ignore-case").is(":checked"),
					exactMatch: $("#chk-exact-match").is(":checked"),
					revealResults: true 
				};
				//var results = 
					$searchableTree.treeview("search", [pattern, options]); 
				//$("#btn-search").hide();
			}
  
			//$("#btn-search").on("click", treeSearch);
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

	}); //-- END showTreeFrm function 
 
});
