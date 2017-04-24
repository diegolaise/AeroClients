<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"
	import="com.phoenixint.analysislibrary.persistence.search.UnifiedSearchRequest"
	import="com.phoenixint.analysislibrary.persistence.search.SearchResult" 
%> 
<%@include file="v-login.jsp"%> 
<%!
//=========================================================
//_GET_TREEVIEW : cascade get tree info
//=========================================================
void ALtreeInfo(String sPath, JSONArray jsResult, int iLevel, boolean bFolderOnly) throws Exception {

	//Skip USER folder
	//if (!sPath.endsWith("/")) sPath += "/";
	if (bUserSkipped(sPath)) return; 
	 
	CacheablePath cpath = new CacheablePath(sPath);
	String filename  = cpath.getBaseName();
	
	//No doublons
	//if (jsResult.toString().indexOf("" + filename +"")>0) return; 
 	AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao();
    //TreeInfo info = dao.getTreeInfo(cpath, false); 
	//boolean isFile = (info.getNumFolders() == 0);	
	boolean isFile   = filename.indexOf(".")>0; 
	if (bFolderOnly) {
		if (isFile) return;
	}
	
	JSONObject json = new JSONObject();  
	json.put("text", filename);
	json.put("href", sPath);
	json.put("tags", "0"); //['0']
	jsResult.put(json); 
	
	if (isFile) return; //Skip files for all -> No children to search
	  
	//Add nodes for folder
	JSONArray jNodes = new JSONArray();
	json.put("nodes", jNodes);
			
	//End of level search 
	if (iLevel==0) return;
	 
	UnifiedSearchRequest uPS = new UnifiedSearchRequest();
	uPS.setTarget(cpath);  
	uPS.setDeep(false); //Non Recursive
	
 	uPS.setMatchFilenameOrContent(false);
 	//if ( bFolderOnly )  uPS.setFilenamePattern("*!(*ver=*)"); else
 	uPS.setFilenamePattern("*"); 
    //if ( bFolderOnly ) uPS.setLimit(0L);
/*     if (bFolderOnly) {
		//import="com.phoenixint.analysislibrary.utils.Range"
	    Range<Long> rg = new Range<Long>();
	    rg.setStart(0L); rg.setEnd(1L);
	    uPS.setSizeRange(rg);
    } */
	
	SearchResult<String> lstRes = dao.searchFiles(uPS); 
	Collection<String> lstStrRes = lstRes.getResults();
 
	//That means : was already seached but is an empty folder
	//Permet de ne pas lancer une rquette pour rien
	if (lstStrRes.size() == 0) 
		jNodes.put(new JSONObject());
	else {
		int nextLevel = iLevel - 1;
		for (String path : lstStrRes) {  
			if ( !path.equals(sPath)
				&& path.indexOf("?ver=")<0) {
				//Don't add rootPath (Folder) don't have version 
				ALtreeInfo(path, jNodes, nextLevel, bFolderOnly); 
			}
		} 
	}
	
}//END treeInfo

//=========================================================
//	List only FIRST level folder child
//=========================================================
public JSONArray childFolders(String sRootPath, boolean bAll) throws Exception {
	
	JSONArray jResArr = new JSONArray();
	
	AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao();
	  
	String sFolderPath = sRootPath;
	if (!sFolderPath.endsWith("/")) sFolderPath += "/";
	
	UnifiedSearchRequest uPS = new UnifiedSearchRequest();
	//The Root path : mandatory
	uPS.setTarget(new CacheablePath(sFolderPath) );
	uPS.setDeep(false);
	
	//Search by filename
 	uPS.setMatchFilenameOrContent(false);
	uPS.setFilenamePattern("*");
		
/*  	uPS.setMatchFilenameOrContent(false);
 	uPS.setFilenamePattern("*!(*ver=*)"); */

	SearchResult<String> lstRes = dao.searchFiles(uPS);  
	Collection<String> lstStrRes = lstRes.getResults();
	
	for (String path : lstStrRes) { 
		if (path.equals(sFolderPath)) continue; //Avoid self
		if (path.indexOf("?ver=")>0) continue;  //Avoid versionned files
		
		//Avoid shortcuts && non versionned files 
		if (!bAll) {
			TreeInfo info = dao.getTreeInfo(new CacheablePath(path), false);  
			if (info.getNumFolders() == 0) continue;	
		}
		jResArr.put(path);
	} 
	return jResArr;
}

//----------------- END FUNCTIONS -----------------------------
%>
<% 	//==================================================================
	//					HANDLE PATH REQUESTS
	//==================================================================

	String _LIST_FILES 	  = "listFiles";
	String _LIST_PATH 	  = "listPaths";
	
	String _CHILD_FOLDERS = "ALchildFolders"; 
	String _SUB_FOLDERS   = "ALchildFiles"; 
	String _TREE_VIEW     = "ALtreeView";

	//--------- IF CANNOT GET DAO: STOP ----------
	if ( !_sErrorMessage.isEmpty() ) {
		response.sendError(HttpServletResponse.SC_UNAUTHORIZED
							, "Connection Failed<br>" + _sErrorMessage);
		return;
	}

	//--------- ACTION ----------
	String action = request.getParameter("action");   

	try {  
		//Root Path
		String sPathUri = request.getParameter("path");
		if (sPathUri==null || sPathUri.trim().equals(""))
			throw new Exception("No search 'root path' parameter was given");
 
	    //--------------------------
		//- Get Local Files list
		//--------------------------
		if (_LIST_FILES.equals(action)) {
			
			String folder = request.getParameter("folder");
			boolean bFolderOnly = "true".equalsIgnoreCase(folder);
			
			JSONArray jArray = new JSONArray();
			  
			String fPath = request.getSession().getServletContext().getRealPath(sPathUri);
			
			File directory = new File(fPath);
			if (directory.exists()) {
				if (folder==null)
					jArray = new JSONArray(directory.list());
				else {
					for (File f : directory.listFiles()) {
						if ( (bFolderOnly && f.isDirectory())
							|| (!bFolderOnly && f.isFile())
						) jArray.put(f.getName());
					}
				}
			} 
			response.getWriter().println(jArray);
		}
		else if ("dir".equals(action)) {
			
			JSONArray jArray = new JSONArray();
			  
			String fPath = request.getSession().getServletContext().getRealPath(sPathUri);
			
			File directory = new File(fPath);
			if (directory.exists())  
				jArray = new JSONArray(directory.list());	
			
			response.getWriter().println(jArray);
		}
		else if (_LIST_PATH.equals(action)) {
			
			JSONObject jAllFiles = new JSONObject();
			
			String[] tabPath = sPathUri.split(",");  
			for (String path : tabPath) {
				String fPath = request.getSession().getServletContext().getRealPath(path);
				
				File directory = new File(fPath);
				if ( !directory.exists()) continue;
				
				jAllFiles.put(path, new JSONArray(directory.list()) ); 
			}
 
			response.getWriter().println(jAllFiles);
		}

		//-----------------------------------
		//	 AL get First child folders only : STUDY
		//-----------------------------------
		if (_CHILD_FOLDERS.equals(action)) {
			JSONArray jArray = new JSONArray();
			jArray = childFolders(sPathUri, false);
			response.getWriter().println(jArray);
		}
		
		//-----------------------------------
		//	 AL get All childs folder content (recursive)
		//-----------------------------------
		if (_SUB_FOLDERS.equals(action)) {
			JSONArray jArray = new JSONArray();
			jArray = childFolders(sPathUri, true);
			response.getWriter().println(jArray);
		}

	    //--------------------------
		//- Get TREE VIEW
		//--------------------------
		else if (_TREE_VIEW.equals(action)) { 
			String sFolderOnly = request.getParameter("folder");
			if (sFolderOnly==null) sFolderOnly = "false";
			
			String sLevel = request.getParameter("level");
			int iLevel = 1;
			if (sLevel!=null) {
				try {
					iLevel = Integer.parseInt(sLevel);
				} catch( NumberFormatException x) {iLevel = 1;}
			}
			
			JSONArray jArray = new JSONArray(); 
			ALtreeInfo(sPathUri, jArray, iLevel, "true".equals(sFolderOnly));	
			response.getWriter().println(jArray);
		}
		
	    //------------------------------------
	    //	RESPONSE
	    //------------------------------------  
		response.setContentType("application/json;charset=utf-8");
		response.getWriter().flush(); 
		return;	
	} 
	catch (Throwable ex) {  
		response.sendError(HttpServletResponse.SC_BAD_REQUEST, ex.getMessage());
	}
%>