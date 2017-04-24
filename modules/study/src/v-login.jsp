<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"  
	import="com.phoenixint.analysislibrary.domain.ALUser"  
	import="static com.phoenixint.analysislibrary.localization.LocalizedStrings.*" 
%>
<%@include file="v-common.jsp"%> 
<%@include file="/localize_header.jsp"%>
<% 
	//==================================================================
	//				ALWAYS AUTHENTICATE
	//==================================================================
	String trace =  "\nTry Login ...";
 	ALUser authUser = ALLoginModule.tryLogin(request, response);
	if (authUser == null) {
		_sErrorMessage = "Login Cancelled or Failed !"; 
	}
	else {  
		_LOGIN = authUser.getName();
		
		//------------------
		// INIT USER profile
		//-------------------
		if ( session.getAttribute("init"+_LOGIN) == null) {
			trace += "\nGet User role of: " + _LOGIN;
			String sUserRole 	=  (authUser.hasRole("Administrators") ? "admin" : "user");
			 
			trace += "\nCheck profile of: " + sUserRole;
			try {
				checkUserProfile(request, _LOGIN, sUserRole);
				
				if (_SessionId==null) _SessionId = ""+System.currentTimeMillis();
				session.setAttribute(_SessionId, _LOGIN);
			}
			catch (Exception ex) {
				_sErrorMessage = "Failed to create Profile !" + trace + " <br>ERROR: " + ex;
			}  
		}
		session.setAttribute("init_"+_LOGIN, "OK");
	} 
	
} catch  (Exception exp) {
	_sErrorMessage =  "" + exp +  _sErrorMessage;
%>
<%@include file="/localize_footer.jsp" %>
