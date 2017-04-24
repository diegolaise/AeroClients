/**=============================================================
 * 
 * 	PROFILE SETTING
 *   
 ===============================================================*/

function editprofile(updateCallBack) {
	
	//Get login
	var login = _oAppScope._login;
  
	//ACTION : upload profile
	var sUrl = PROFILE_URL() + "?action=profile&login="+login;
	
	// -------------------------------------
	//				HTML
	// -------------------------------------
	var profileBox = '<form id="profile-form" class="form-horizontal" method="post" '
					+ 'action="'+sUrl+'" enctype="multipart/form-data">'

		+ '<input type="hidden" id="login" name="login" value="'+login+'">'
        
        + '<div class="form-group">'
            + '<label class="col-lg-2 control-label">Fullname :</label>'
            + '<div class="col-lg-10">'
                + '<input type="text" class="form-control" id="fullname" name="fullname" placeholder="Fullname"'
                + ' value="'+_oAppScope._profile.fullname+'">'
            + '</div>'
        + '</div>'
 
        + '<div class="form-group">'
            + '<label class="col-lg-2 control-label">Mail :</label>'
            + '<div class="col-lg-10">'
                + '<input type="text" class="form-control" id="mail" name="email" placeholder="email"'
                	+ ' value="'+_oAppScope._profile.email+'">'
            + '</div>'
        + '</div>'

        + '<div class="form-group">'
        	+ '<label class="col-lg-2 control-label">Role :</label>'
        	+ '<div class="col-lg-10" title="The user sdma role">'
            	+ '<input type="text" class="form-control" id="role" name="role" placeholder="Your role"'
            		+ ' value="'+_oAppScope._profile.role+'" disabled>'
            + '</div>'
        + '</div>'
        
        + '<div id="image_preview" class="form-group" style="padding:0px;margin-bottom:0px;">'
        	+ '<label class="col-lg-2 control-label">Avatar :</label>'

        	+ '<div class="col-lg-10 thumbnail" style="padding:0px;margin-bottom:0px;">' 
        			+ '<ul>' 
                    + ' <li style="margin-left:15px;"><img src="'+_oAppScope.getAvatar()+'" alt="" '
                    + ' style="height:100px;max-width:100px;width:expression(this.width>100?100:true);"><li>'
                    
                    + '<li class="caption" title="Remove to restore">'
                        + '<input id="avatar" type="text" name="avatar" class="form-control" value="'+_oAppScope._profile.avatar+'">'
                        + '<p></p>'
                        + '<button type="button" class="btn btn-default hidden">Restore last</button>'
                    + '</li>' 
                    + '<ul>' 
            + '</div>'
            
        + '</div>'
        
	      + '<div class="form-group" style="padding:0px;margin:0px; 0px">'
	          + '<label class="col-lg-2 control-label"></label>'
	
	          	+ '<div class="fileinputs col-lg-10" style="padding:0px">'
	      		+ 	'<input type="file" name="image" class="file" accept="image/*" '
	      		+ 		'style="border:none;padding:5px;margin:0px;">'	                  		
	      		+ 	'<div class="fakefile">'
	      		+ 		'<input readonly><button class="btn">Load</button>'
	      		+ 	'</div>'
	      		+ '</div>'
	          
	      + '</div>'
	      
	    + '</fieldset>'
	+ '</form>';

	//-------------------------
	// SHOW
	//---------------------------
	bootbox.dialog({
		title: "Profile Settings for : " + login,
		message: profileBox,
		buttons: { 
			 cancel: { label: "Cancel", className: "btn-default" }
		    , success: {
	            label: " SAVE    ",
	            className: "btn-primary", //col-xs-3 col-xs-offset-7 
	            callback: function (e) { 
                    e.preventDefault();
                    
                    //!!  Remove fakefile => cause error on submit
                    $('.fileinputs .fakefile').remove();
                    
                    var $form = $('#profile-form');
                    var formdata = (window.FormData) ? new FormData($form[0]) : null;
                    var dataContent = (formdata !== null) ? formdata : $form.serialize();

                    $.ajax({
                        url				: $form.attr('action')
        				, beforeSend	: function(xhr) {
        					xhr.setRequestHeader("Authorization", "Basic " + _oAppScope._logStr); 
        					xhr.setRequestHeader("WWW-authenticate", "database"); 
        				} 
                        , type			: $form.attr('method') 
                        , contentType	: false 	// obligatoire pour de l'upload
                        , processData	: false 	// obligatoire pour de l'upload
                        , dataType		: 'json'    // type du retour attendu
                        , data			: dataContent 
                        
                        , success		: function (response) {
                        	toastr.success("Profile saved !");
                        	_oAppScope._profile = response;
                        	_oAppScope.$apply();
                        } 
                        , error		: function(err) {
                    		console.log("Failed to save profile<br>" + JSON.stringify(err,null,"\t"));
                    		toastr.error("Failed to save profile");
                    	}
                    });	
	            	
	            } //end callback
		    }//end success	
		    
		}//end buttons
	});//
 
}///End function

/** Select a file */
$(document).delegate( '#profile-form input[name="image"]', 'change', function(e) {
    var files = $(this)[0].files;
    if (files.length > 0) {
        var file = files[0],
            $image_preview = $('#image_preview');

        //Setfile path
        var path = $('#profile-form').find('input[name="image"]').val();
        $( '#profile-form .fileinputs .fakefile input').val(path);
        
        // Show image
        $image_preview.find('img').attr('src', window.URL.createObjectURL(file));
        
        // Show clear button
        $image_preview.find('.caption button').removeClass('hidden');
       
        //Show filename 
        $('#avatar').val(file.name);
        $image_preview.find('.caption p:first').html(file.size +' bytes');
    }
});

/** Restore initial image */
$(document).delegate( '#image_preview button[type="button"]', 'click', function(e) {
    e.preventDefault();

    //Clear file
    $('#profile-form').find('input[name="image"]').val(''); 
    $('#profile-form .fileinputs .fakefile input').val('');
    
    //Restore image
    $('#image_preview').find('img').attr('src', _oAppScope.getAvatar());
    $('#avatar').val(_oAppScope._profile.avatar);
    
    //Hide button clear
    $('#image_preview').find('.caption  button').addClass('hidden');
});

$(document).delegate( 'div.fakefile button', 'click', function(e) {
	 e.preventDefault();
	 $('#profile-form input[name="image"]').trigger( "click" );
});

$(document).delegate( 'div.fakefile input', 'click', function(e) {
	 e.preventDefault(); 
});

