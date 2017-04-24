<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"	
	import="java.nio.charset.*" 	   
	import="org.apache.commons.fileupload.*"
	import="org.apache.commons.fileupload.servlet.*"
	import="org.apache.commons.fileupload.disk.*"
%>
<%@include file="./v-login.jsp"%> 
<%  
	//--------- IF CANNOT GET DAO: STOP ----------
	if ( !_sErrorMessage.isEmpty() ) {
		response.sendError(HttpServletResponse.SC_UNAUTHORIZED
							, "Connection Failed<br>" + _sErrorMessage);
		return;
	}
 
	//---- ACTION ---------
	String action = request.getParameter("action");
	
	//-------------------------------
	//		LOGOUT
	//--------------------------------
	if ("logout".equals(action)) { 
		//Get the caller for <error> or logout
		//String caller = request.getHeader("Referer"); 
				
		String homePage = _HOME_PAGE;
		if (session.getAttribute("HOME") != null ) {
			homePage = (String)session.getAttribute("HOME"); 
		} 
		homePage +="?project="+_PROJECT+"&login="+_LOGIN;
		
		//Disable all inputs of the session
		session.invalidate();
		
		//System.out.println("__Logout__");
		response.setStatus(HttpServletResponse.SC_MOVED_TEMPORARILY);
		response.setHeader("Location", homePage); 
		return;
	}
	
	//-------------------------------
	//	SAVE A FILE TO the PROJECT / USER PROFILE
	//--------------------------------
	if ("save".equals(action)) { 
		String sFilePath = "";
		try {
			//!!!! Always get path from _PROJECT_PATH
			String jsonFileName = request.getParameter("path");
			if (jsonFileName == null)
				throw new Exception("Unknown json file name");
			
			String jData = request.getParameter("data");
			if (jData == null)
				throw new Exception("Unknown json data");
		 
			//Get _PROJECT_PATH : $ROOT/datas/[project]/
			ServletContext ServletContext = request.getSession().getServletContext();
			String sProjectPath = ServletContext.getRealPath(_DATA_PROJECT_URI);  
			
			sFilePath = sProjectPath +  "/" + jsonFileName;
			FileWriter file  = new FileWriter(sFilePath);
			file.write(jData); 
			file.flush();
			file.close();
		
			response.setHeader("Cache-Control", "no-cache");
			response.setContentType("application/text; charset=utf-8");
			response.getWriter().print("success : true");

		} catch (Throwable ex) {
			response.sendError(HttpServletResponse.SC_UNAUTHORIZED
								, "Not found: " + sFilePath + " <br>" + ex);
		}
		return;
	}
  	
	JSONObject jProfile = new JSONObject();
	PrintWriter writer = response.getWriter();
	response.reset();
		
	try { 
		//--------------------------------
		//		UPLOAD PROFILE json
		//-------------------------------- 
		if ("profile".equals(action)) { 
 				//Get user path
 				ServletContext ServletContext = request.getSession().getServletContext();
 		 		String userPath 	= ServletContext.getRealPath(_DATA_PATH+_PROJECT+ "/"+_LOGIN);
 		 		String profilePath  = userPath + "/" + _PROFILE_FILE;
 				
 				//Load last profile json
 	 			try {
 	 				Path path = Paths.get(profilePath);
 	 				List<String> lTxt = Files.readAllLines(path, StandardCharsets.UTF_8);
 	 				String jsonStr = org.apache.commons.lang3.StringUtils.join(lTxt, " ");
 	 				JSONTokener tokener = new JSONTokener(jsonStr);
 	 				jProfile = new JSONObject(tokener);
 	 			} 
 	  			catch (IOException io) {
 	 			}
 	 
 	 			//Current profile avatar
 	 			String prevAvatar = (String)jProfile.get("avatar"); 
 	 			
 	 			//Multipart
 	 			if (ServletFileUpload.isMultipartContent(request)) {
 	 				FileItemFactory factory = new DiskFileItemFactory();
 	 				ServletFileUpload upload = new ServletFileUpload(factory);

 	 				boolean bDeletePrevious = false;
 	 				try {
 	 					List<FileItem> multiparts = upload.parseRequest(request);
 	 					boolean hasChange = false;
 	 					for (FileItem item : multiparts) {
 	 						
 	 						//- FILE
 	 						if (!item.isFormField()) {
 	 							//Get the avatar filename
 	 							String filename = new File(item.getName()).getName();
 								 
 	 							//Add avatar : Write to file
 	 							if (!filename.isEmpty()) {
 	 								item.write(new File(userPath + File.separator + filename));
 	 								jProfile.put("avatar", filename);
 	 								hasChange = true; 
 	 								
 	 								bDeletePrevious = !prevAvatar.equals("avatar.jpg");
 	 							}
 	 							
 	 						//- Settings (name, email etc ...)
 	 						} else {
 	 							String fieldName = item.getFieldName();
 	 							String value = item.getString();
 	 							
 	 							//Remove avatar => set default
 	 							if (fieldName.equals("avatar") && value.trim().isEmpty()) {
 	 								if ( (new File(userPath + "/avatar.jpg")).exists()) {
 	 									value = "avatar.jpg"; 
 	 								} 
 	 								bDeletePrevious = !prevAvatar.equals("avatar.jpg");
 	 							}
 	 							
 	 							if (!value.equals(jProfile.get(fieldName))) {
 	 								hasChange = true;
 	 								jProfile.put(fieldName, value);
 	 							}
 	 						}
 	 					}//end for
 	 					
						// Delete last avatar, if not default
						if ( bDeletePrevious ) {
							try {
								File fAvatar = new File(userPath + File.separator + prevAvatar);
								fAvatar.delete();
							} catch (Exception io) {
								//nothing, pas grave
							}
						}

 	 					//Save profile
 	 					if (hasChange) {
 		 					FileWriter file = new FileWriter(profilePath);
 		 					file.write(jProfile.toString());
 		 					file.flush();
 		 					file.close();
 	 					}
 	 				} catch (Exception e) {
 	 					//writer.println("{error: true, errorMessage: '" + e.getMessage() + "'}");
 	 					response.sendError(HttpServletResponse.SC_EXPECTATION_FAILED, "Failed<br>" + e.toString());
 	 				}
 			}//end multipart
		}

		//Send json 
		writer.println(jProfile);
		response.setContentType("application/json;charset=utf-8");
		writer.flush();

 	} catch (Throwable exp) {
 		response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Failed<br>" + exp.toString());
	}
%>

