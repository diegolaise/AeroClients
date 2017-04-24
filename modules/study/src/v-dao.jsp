<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" 

    import="java.util.*"  
    import="java.io.*"
    
    import="org.json.*"  
    import="java.util.concurrent.*"
      
    import="javax.xml.namespace.QName"
    import="com.phoenixint.analysislibrary.domain.ALProperty"

	import="com.phoenixint.analysislibrary.persistence.search.*" 
	import="com.phoenixint.analysislibrary.domain.Link"
%>
<%@include file="./v-common.jsp"%>
<%!
//*=================================================
//				DAO FUNCTIONS
//==================================================*/
 
//-------------------------------------------
//Get path to JSONObject for javascript GUI
//------------------------------------------
public JSONObject toJson(String sfullpath) {
	return toJson( new CacheablePath(sfullpath)); 
}

/** Get avancement % of a file */
public String getFilePercent(String sPath) throws Exception {
	CacheablePath cpath = new CacheablePath(sPath);
	
		String value = "0";
		try {
			AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao();
			String resUid = dao.pathToResourceUid(cpath);
			
			QName[] tabQNames = { new QName("General", "Percentage of completion") }; 
			List<ALProperty> tabProps =  dao.getProperties(resUid, Arrays.asList(tabQNames));
							
			if (tabProps!=null && tabProps.size()>0) {
				ALProperty prop = tabProps.get(0); 
				QName qName = prop.getDataClassQName();
				String name = qName.getLocalPart();
				value = prop.getContent();
			} 
		} catch (Exception e) {}
		
		return  value; 

}

//-------------------------------------------
//Get path to JSONObject from cacheable
//------------------------------------------
public JSONObject toJson(CacheablePath cpath) { 
	JSONObject json = new JSONObject();
	try {
		String fullPath = cpath.toString(); 
		json.put("href", _FileUrl + fullPath); // file content Href
		 
		String filename = cpath.getBaseName(); 
		json.put("path", filename);
		
		if (fullPath.endsWith("/")) fullPath = fullPath.substring(0, fullPath.length()-1);
		json.put("path", fullPath);
		
		json.put("img" , ""); //TODO do in JS, much simple 
		
		String version = cpath.getVersion();
		if (version==null) version = "";
		json.put("version", version);


	}
	catch (JSONException jex) {}
	return json;
}

//------------------------------------------------------------
//Get last (MAX) version of a path and all others version
//@param path : full path
//------------------------------------------------------------
public String getLastVersion(String sRootParam) throws Exception {
	String version = getMaxVersion(sRootParam, null);
	if (version!=null && !version.isEmpty())
		return "?ver=" + version;
	return "";
}
//------------------------------------------------------------
//Get MAX version of a path and all others version
//@param path : full path
//------------------------------------------------------------
public String getMaxVersion(String sRootParam, ArrayList<String> lstVesrion) throws Exception {

	int iMaxVersion = 0;
	
	UnifiedSearchRequest uPS = new UnifiedSearchRequest(); 
	uPS.setDeep(false); 	//Non Recursive
	
	CacheablePath cPath =  new CacheablePath(sRootParam);
	
	//The Root path : mandatory
	CacheablePath folderPath  = cPath.getParent(true); 
	uPS.setTarget(folderPath);
	
	//Get path whithout version
	String filename = cPath.getBaseName();
	//print("Basename of " + sRootParam + " is " + filename);
	//-> Search by Name Globing & version
	uPS.setFilenamePattern(filename); 

	AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao();
	SearchResult<String> lstRes = dao.searchFiles(uPS);  
	for (String path : lstRes.getResults()) {
		CacheablePath cRes = new CacheablePath(path);
		if (cRes.isVersion()) {
			String version = cRes.getVersion();
			if (lstVesrion!=null) lstVesrion.add(version);
			try {
				int iv = Integer.parseInt(version);
				if (iv>iMaxVersion) iMaxVersion = iv;
			} catch (NumberFormatException nx) {}
		}
	} 

	return (iMaxVersion>0  ? (""+iMaxVersion) : ""); 
}

//====================================================================
//_GET_METADATA : Get Metadatas of a file
//====================================================================
public JSONObject getMetadatas(String sRootParam) throws Exception {
	//-- DEFAULT FILE PROPERTIES --------------------
	QName[] DEFAULT_PROPERTY_NAMES = {  
				  new QName("Tool and Process", "From tool")
				, new QName("Tool and Process", "From process")
				, new QName("Tool and Process", "Creation version")
				, new QName("General"		  , "Description")
				, new QName("General"		  , "Type")
				, new QName("Data Validity"	  , "Data Origin")
				, new QName("Data Validity"	  , "Status")
				, new QName("Data Validity"   , "Study Type")
				, new QName("Study Context"	  , "Aircraft")
				, new QName("Study Context"	  , "Program")
	};
	return getProperties(sRootParam, Arrays.asList(DEFAULT_PROPERTY_NAMES));
}//END  getMetadatas

/** Get list of Snames from Jsom metadada */
public List<QName> getListOfQnames(JSONArray jArray) throws Exception{

	List<QName> lQNames = new ArrayList<QName> ();
	
	for (int i=0; i<jArray.length(); i++) {
		try {
		    JSONObject dProps = jArray.getJSONObject(i);

			String namespace = dProps.get("Namespace").toString().trim();
			String name 	 = dProps.get("Name").toString().trim();

			if ( !namespace.isEmpty() && !name.isEmpty() ) { 
				QName qn = new QName(namespace, name);//!prefix cannot be null
				lQNames.add(qn); 
			} 
 
		}
		catch (Exception e)
		{}
	} 

	return  lQNames;
}//End getPropertyContraints

/** Read Properties Quelconque */
public JSONObject getProperties(String path, List<QName> tabQNames) throws Exception {

	JSONObject jMetadata = new JSONObject();
	
	AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao();
	
	//Get the reource UID
	CacheablePath cpath = new CacheablePath(path);
	
	if (cpath.getVersion()==null) {
		//Get last Version
		String fullPath = path + getLastVersion(path);
		cpath = new CacheablePath(fullPath);
		//print("Fullpath is " + fullPath);
	}
	//else print("Basename of " + path + " ===>  " + cpath.getBaseName());
	
	String resUid = dao.pathToResourceUid(cpath);
	List<ALProperty> tabProps =  dao.getProperties(resUid, tabQNames);
	
	if (tabProps != null) {
		for (ALProperty prop : tabProps) {
			QName qName = prop.getDataClassQName();
			String name = qName.getLocalPart();  
			jMetadata.put(name, prop.getContent()); 
		}
	}

	return jMetadata;
}//END  getProperties


//==================================================================
//Search folder by name : faster than getChildFolders
//==================================================================
public ArrayList<String> searchFolders(String sRootPath, String searcExpressions) {
	
	String[] tabSearch = searcExpressions.split(",");
	 
	AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao();
	  
	String sFolderPath = sRootPath;
	if (!sFolderPath.endsWith("/")) sFolderPath += "/";

	ArrayList<String> lstFolders = new ArrayList<String>();
	
	for (String searchPattern : tabSearch) {	
		 
		UnifiedSearchRequest uPS = new UnifiedSearchRequest();
		uPS.setTarget(new CacheablePath(sRootPath) );
		uPS.setDeep(true); 
		
		//-> Search by content or name & version : much quick 
		uPS.setMatchFilenameOrContent(true);
		uPS.setFilenamePattern(formatPattern(searchPattern));

		try {
			SearchResult<String> results  = dao.searchFiles(uPS);  
			Collection<String> allResults = results.getResults();
			
			//Filter according to child/parent list
			String foldRegExp = getRegExp(searchPattern);
			//print("Search RegExp : " + foldRegExp);
			
			//System.out.println("\t\tsearch for: " + searchFolder + " Matches to: " + foldRegExp);
			for( String path : allResults) {
				if (path.equals(sFolderPath)) continue; //Skip self
				if (path.indexOf("?ver=")>0) continue;  //Skip files (versionned)
				if (bUserSkipped(path)) continue; 		//Skip USER Trash folder  
				if (! path.matches(foldRegExp) )  continue; //SKIP unmatched
				
				//Get folder only 
				TreeInfo info = dao.getTreeInfo(new CacheablePath(path), false);  
				if (info.getNumFolders() == 0) continue; //Skip files 
				 
				//print("Found ==> " + path); 
				
				if (lstFolders.size()==0) 
					lstFolders.add(path);
				else {
					boolean bAdd = true;
					
					// Avoid inclusion
					for(int i=lstFolders.size()-1; i>=0; i--) { 
						String otherPath = lstFolders.get(i);
						//print("<br><br>otherPath " + otherPath);
						
						if ( path.length()>=otherPath.length() && path.startsWith(otherPath)) {
							bAdd = false;  //don't add
							break;
						}
						else if ( otherPath.length()>=path.length() && otherPath.startsWith(path)) {
							bAdd = false;
							if (lstFolders.contains(path)) 
								lstFolders.remove(i);
							else { 
								lstFolders.set(i, path);
							} 
						} 
					} 
					if (bAdd) lstFolders.add(path);
				}
			}
		} catch (Exception e) {
			//System.out.println("Error: " + e);
		}
	}  
	return lstFolders;
}

//--------------------------
//- Get all recusive sub-Folders with folder pattern
//--------------------------
public JSONArray getAllSubfolders(String sRootPath, String searchPattern) throws Exception {

	//Construct RegEx for pattern
	// replace * by : ([a-zA-Z0-9_\-/\s]+) or ([a-zA-Z0-9_\-/.\s]*)	 
	String pathRegEx = "";
	String globing = ""; 
	
	if (searchPattern != null && !searchPattern.trim().isEmpty()) {
   	String[] tabSearch = searchPattern.split(",");
		for (String sP : tabSearch)  globing += " " + formatPattern(sP); 
		
		pathRegEx = searchPattern.replace(",", "|");
		//print("pathRegEx : <br>" + pathRegEx);
		if (pathRegEx.contains("|")) {
			pathRegEx = "(" + pathRegEx.replace("|", ")|(")  + ")";
		}
		pathRegEx = pathRegEx.replace("*", "([a-zA-Z0-9_\\-/\\s]*)"); 
	}
	
	//return searchSubFolders(sRootPath, "*", pathRegEx);
			
	String sFolderPath = sRootPath;
	if (!sFolderPath.endsWith("/")) sFolderPath += "/";
	
	ArrayList<String> lstFolders = new ArrayList<String>();
	
	UnifiedSearchRequest uPS = new UnifiedSearchRequest();
	uPS.setTarget(new CacheablePath(sRootPath) );
	uPS.setDeep(true); 
	
	//-> Search by content or name & version : much quick
	//uPS.setMatchFilenameOrContent(true); uPS.setFilenamePattern("*");  
	uPS.setMatchFilenameOrContent(false); uPS.setFilenamePattern(globing.trim()); //FASTER ??

	try {
		AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao();
		SearchResult<String> results  = dao.searchFiles(uPS);  
		Collection<String> allResults = results.getResults(); 

		//System.out.println("\t\tsearch for: " + searchFolder + " Matches to: " + foldRegExp);
		for( String path : allResults) {
			if (path.equals(sFolderPath)) continue; //Skip self
			if (path.indexOf("?ver=")>0) continue;  //Skip files (versionned)
			if (bUserSkipped(path)) continue; 		//Skip USER folder  
			if (! path.matches(pathRegEx) )  continue; //SKIP unmatched
			
			//Get folder only 
			TreeInfo info = dao.getTreeInfo(new CacheablePath(path), false);  
			if (info.getNumFolders() == 0) continue; //Skip files  

			if (lstFolders.size()==0) 
				lstFolders.add(path);
			else {
				boolean bAdd = true;
				
				// Avoid inclusion
				for(int i=lstFolders.size()-1; i>=0; i--) { 
					String otherPath = lstFolders.get(i);
					//print("<br><br>otherPath " + otherPath);
					
					if ( path.length()>=otherPath.length() && path.startsWith(otherPath)) {
						bAdd = false;  //don't add
						break;
					}
					else if ( otherPath.length()>=path.length() && otherPath.startsWith(path)) {
						bAdd = false;
						if (lstFolders.contains(path)) 
							lstFolders.remove(i);
						else { 
							lstFolders.set(i, path);
						} 
					} 
				} 
				if (bAdd) lstFolders.add(path);
			}
		}
	} catch (Exception e) {
		//System.out.println("Error: " + e);
	}
	return new JSONArray(lstFolders);
}

//========================================================================
//		Get property constraints
//========================================================================
public ArrayList<PropertyConstraint> getPropertyContraints(JSONArray jArray) throws Exception{

	ArrayList<PropertyConstraint> pConstraints = new ArrayList<PropertyConstraint>();
	HashMap<String, List<Constraint>> hash = new HashMap<String, List<Constraint>>(); 
	for (int i=0; i<jArray.length(); i++) {
		try {
		    JSONObject dProps = jArray.getJSONObject(i);
		
			String value = dProps.get("Value").toString().trim();
			if (value.isEmpty()) continue;
			 
			String namespace = dProps.get("Namespace").toString().trim();
			String name 	 = dProps.get("Name").toString().trim();

			List<QName> qNames = new ArrayList<QName>(); 
			if ( !namespace.isEmpty() && !name.isEmpty() ) { 
				QName qn = new QName(namespace, name);//!prefix cannot be null
				qNames.add(qn); 
			} 
			//Value
			TextConstraint ctr = new TextConstraint(new String[]{value}); 
			
			List<Constraint> constraints = null; 
			String skey = namespace+":"+name;
			if (hash.containsKey(skey)) {
				constraints = hash.get(skey);
				constraints.add(ctr);
			}
			else {
				constraints = new ArrayList<Constraint>();
				constraints.add(ctr);
			
				PropertyConstraint prop = new PropertyConstraint(qNames, constraints); 
				pConstraints.add(prop);
				
				hash.put(skey, constraints);
			}
		}
		catch (Exception e)
		{}
	} 

	return  pConstraints;
}//End getPropertyContraints


//==============================================================
//==============================================================
/** ----------------------------------------------
 * Parallel get child or parent of result target 
 *------------------------------------------------*/
public boolean findMatchedParentsOrChilds( final boolean bSreachParent 					 //
								, final ArrayList<String> lParentOrChildTosearch //List of parent or child to search
								, List<String> lstResToCheck 		 //List of ressource to check
								, boolean bSerialLaunch
								, HashMap<String, Collection<Link>> hLinkByRes
		 						) throws Exception {

	boolean bFound = false;

	//--------------------------------------
	// LAUNCH SERIAL
	//---------------------------------------
	if (bSerialLaunch) {
		
		LinkDirection lnkType = (bSreachParent ? LinkDirection.From : LinkDirection.To);
		AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao(); 
 		
		//print(" ---- " ); 
 		for (final String sPath : lstResToCheck) { 
 			//FILTER
 			if ( bUserSkipped(sPath) ) continue;
 			
 			//print("    sPath: " + sPath);
 			try { 
				Collection<Link> allLinks =   hLinkByRes.get(sPath);
				
				if (allLinks == null || allLinks.size()==0) {
					String resUid = dao.pathToResourceUid(new CacheablePath(sPath));
					allLinks = dao.getLinks(resUid, lnkType, Inclusion.Include, null);
					//for (Link l : allLinks) print("    lnk: " + l.toString());
					hLinkByRes.put(sPath, allLinks);
				}
	
				//System.out.println("GetParent of: " + sPath);
				List<String> lRes = getTargetChildsOrParents(dao, sPath, bSreachParent, lParentOrChildTosearch, allLinks);
				if (lRes == null) continue;
				
				if (lRes.size() == 0) {
					bFound = true;
					break;
				} 
				
				//If not found relauch threads
				bFound = findMatchedParentsOrChilds(bSreachParent, lParentOrChildTosearch, lRes, bSerialLaunch, hLinkByRes);
				if (bFound) break;
	
			} catch (Exception e) {
				System.out.println("ERROR_Series: " + sPath);
			}
		}
		
		return bFound;
	} //- end serial
	
	//--------------------------------------
	// LAUNCH PARALLEL CopyOnWriteArrayList
	//--------------------------------------
	// Prepare to execute and store the Futures
	int threadNum = lstResToCheck.size();
	ExecutorService executor = Executors.newFixedThreadPool(threadNum);
	List<FutureTask<List<String>>> taskList = new ArrayList<FutureTask<List<String>>>();

	// Start thread for the first half of the numbers
	for (final String resTarget : lstResToCheck) {
		if ( bUserSkipped(resTarget) ) continue;
		
		//print(" Find: " + resTarget); 
		FutureTask<List<String>> futureTask = new FutureTask<List<String>>(
				new Callable<List<String>>() {
					@Override
					public List<String> call() {
						List<String> lRes = null;  
							try {
								lRes = getTargetChildsOrParents(resTarget, bSreachParent, lParentOrChildTosearch);
							} 
							catch (Exception pex) { 
								lRes = new ArrayList<String>();
								lRes.add(resTarget); 
							}  
					
						return lRes;
					}
				}
		);
		taskList.add(futureTask);
		executor.execute(futureTask);
	} //end for

	// Wait until all results are available and combine them at the same time	
	for (FutureTask<List<String>> futureTask : taskList) {
		try {
			List<String> lres = futureTask.get();
			
			if (lres == null) continue;
			if (lres.size() == 0) {
				bFound = true;
			}  
			else {
				//If not found relauch threads 
				bFound = findMatchedParentsOrChilds(bSreachParent, lParentOrChildTosearch, lres, bSerialLaunch, hLinkByRes);
			}
			
			if (bFound) break;
			
		} catch (Exception ex) {
			System.out.println("ERROR_Parallel: " + ex);
		} 
	}
	executor.shutdown();

	//==================
	return bFound;
	
}//END findMatchedParentsOrChilds

//=============================================================================
//		Get target child or parent
//=============================================================================
public ArrayList<String> getTargetChildsOrParents(String sPath   //The concerned resources
												, boolean bSreachParent     //Flag id search parent or children 
												, ArrayList<String> lParentOrChildTosearch //the parent or child filter
												) throws Exception {
	
	if (bUserSkipped(sPath)) return null;
	 
	AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao(); 
	List<QName> lqName = null; //Arrays.asList( new QName[]{ new QName("DAV:", "displayname") });
 
	LinkDirection lnkType = (bSreachParent ? LinkDirection.From : LinkDirection.To);
	String resUid = dao.pathToResourceUid(new CacheablePath(sPath));
	Collection<Link> allLinks = dao.getLinks(resUid, lnkType, Inclusion.Include, lqName); 
	
	return getTargetChildsOrParents(dao, sPath, bSreachParent,lParentOrChildTosearch, allLinks);
}//END

/** =============================================================================
*
* =============================================================================*/
public ArrayList<String> getTargetChildsOrParents( AnalysisLibraryDAO dao
		, String sPath  			//The concerned resources
		, boolean bSreachParent	//Flag id search parent or children
		, ArrayList<String> lParentOrChildTosearch //the parent or child filter
		, Collection<Link> allLinks) throws Exception {

	//Skip files in USER folder
	if (bUserSkipped(sPath)) return null;

	ArrayList<String> lstRecursiveLaunch = null;
	
	for (Link lnk : allLinks) {

		String resUid = (bSreachParent ? lnk.getResource2Uid() : lnk.getResource1Uid() );
		String resPath = dao.resourceUidToPath(resUid);
		if (bUserSkipped(resPath)) continue;
		
		if (lParentOrChildTosearch.contains(resPath)) {
			//FOUND : break;
			return (new ArrayList<String>());
		}

		//Else add this to new parent/child to search
		if (lstRecursiveLaunch == null) {
			lstRecursiveLaunch = new ArrayList<String>();
		}
		lstRecursiveLaunch.add(resPath);

	} //END for link

	return lstRecursiveLaunch;
}//END

//========================================================================
//SEARCH : searchByFilename
//========================================================================
public JSONArray searchByFilename(String sRootPath
									, String sPropertyJson 		// _PROPERTY_ pattern
									, String sVersion	  			// _VERSION_
									, String folderRegEx // Folders _PATTERN_ containers
									, String searchNamesGlob	 // last   _PATTERN_  globing
									, boolean bGetResult    	 //If Get result for GUI
) throws Exception {

	if (bUserSkipped(sRootPath)) return new JSONArray(); 
	
	AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao();

	//The Root path : mandatory
	UnifiedSearchRequest searchP = new UnifiedSearchRequest();
	searchP.setTarget(new CacheablePath(sRootPath));

	//Recursive
	searchP.setDeep(true);

	//Search only matched filename 
	if (searchNamesGlob == null || searchNamesGlob.isEmpty()) {
		searchNamesGlob = "*";
	}
	searchP.setMatchFilenameOrContent(true);
	searchP.setFilenamePattern(searchNamesGlob);

	//------------------------------------
	// Search RESULT METADATA attributes
	// property=Value:xxx|Name:xxx|Namespace:xxx, ...
	//------------------------------------ 
	if (sPropertyJson != null && !sPropertyJson.trim().isEmpty()) {
		JSONTokener tokener = new JSONTokener(sPropertyJson);
		JSONArray jArray = new JSONArray(tokener);
		List<PropertyConstraint> pConstraints = getPropertyContraints(jArray);

		//Add to search
		searchP.setPropertyConstraints(pConstraints);
	} //End sPropertyJson property constraints

	SearchResult<String> lstRes = dao.searchFiles(searchP);
	Collection<String> lstStrRes = lstRes.getResults();
 
	if (lstStrRes.size() == 0)
		return (new JSONArray());

	boolean hasFolder = (folderRegEx != null && !folderRegEx.isEmpty());

	// "0" :Last  "-1" :All   "": Active (entry whithout ?ver=)  
	boolean bGetActive = sVersion.isEmpty(); //ActiveData
	boolean bGetLastVersion = (sVersion.equals("0")); //Last 
	boolean bGetAll = (sVersion.equals("-1")); //All data 

	//--- RES ---------------
	//ArrayList<String> lstResult = new ArrayList<String>();
	JSONArray jResArr = new JSONArray();
	//------------------------

	//- Save res found by version, for last
	HashMap<String, String> hResFound = new HashMap<String, String>();

	for (String fullPath : lstStrRes) {
		CacheablePath cPath = new CacheablePath(fullPath);

		//- CHECK FOLDER if OK
		if (hasFolder) {
			CacheablePath cfolderPath = cPath.getParent(true);
			String folder = cfolderPath.toString();
			if (!folder.matches(folderRegEx))
				continue;
		}
		//Get path
		String path = cPath.toString();
		if (bUserSkipped(path)) continue; 

		//Get version
		String version = cPath.getVersion();
		if (version == null || version.isEmpty()) {
			// "0" :Last  "-1" :All   "": Active (entry whithout ?ver=) 
			if (bGetLastVersion)
				version = "0";
			else
				version = ""; 
		} 
		else //Get path whithout version (keep last '/')
			path = path.substring(0, path.indexOf("?ver="));

		if (bGetLastVersion) {
			String lastVer = hResFound.get(path);

			//print("lastVer: " + lastVer);
			if (lastVer == null //First 
			    || Integer.parseInt(version) > Integer.parseInt(lastVer)) {
				hResFound.put(path, version);
			}
			// Get specific version, 
			// if iVersion<0, keep only non versionned => active data //TODO : verfier s'il remonte
		} 
		else if (bGetAll || version.equals(sVersion)) {
			//Format
			if (fullPath.endsWith("/")) fullPath = fullPath.substring(0, fullPath.length() - 1);

			if (bGetResult) {
				JSONObject json = toJson(fullPath);  
				jResArr.put(json);
			} 
			else {
				jResArr.put(fullPath);
			}
		}
	}

	if (bGetLastVersion) {
		for (String path : hResFound.keySet()) {
			String version = hResFound.get(path);

			String fullPath;
			if (version.equals("0") || version.equals("-1") || version.isEmpty())
				fullPath = path;
			else
				fullPath = path + "?ver=" + version;

			if (bGetResult){
				jResArr.put(toJson(fullPath));
			} 
			else {
				jResArr.put(fullPath);
			}
		} //end for
	}//end bGetLastVersion
  
	return jResArr;
}//end search folder

//===========================================================================
// Parallel  Find all parents or child of a list of a file
//===========================================================================
public CopyOnWriteArrayList<String> getAllParentOrChildrenFor(final ArrayList<String> lParentOrChildTosearch
															 , final boolean bSreachParent) {
	
	//All Resustls
	CopyOnWriteArrayList<String> lResults = new CopyOnWriteArrayList<String>();
	
	//--------------------------------------
	// LAUNCH PARALLEL search
	//--------------------------------------
	// Prepare to execute and store the Futures
	int threadNum = lParentOrChildTosearch.size();
	ExecutorService executor = Executors.newFixedThreadPool(threadNum);
	List<FutureTask<ArrayList<String>>> taskList = new ArrayList<FutureTask<ArrayList<String>>>();

	// Start thread for the first half of the numbers
	for (final String path : lParentOrChildTosearch) { 
		//Skip files in USER folder
		if ( bUserSkipped(path) ) continue;
		
		final LinkDirection lnkType = (bSreachParent ? LinkDirection.From : LinkDirection.To);
		
		FutureTask<ArrayList<String>> futureTask = 
			new FutureTask<ArrayList<String>>(
				new Callable<ArrayList<String>>() {
					@Override
					public ArrayList<String> call() {
						ArrayList<String> lRes = new ArrayList<String>();
						try { 
							AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao();   
							LinkDirection lnkType = (bSreachParent ? LinkDirection.From : LinkDirection.To);
							String resUid = dao.pathToResourceUid(new CacheablePath(path));
							Collection<Link> allLinks = dao.getLinks(resUid, lnkType, Inclusion.Include, null); 
							
							for (Link lnk : allLinks) {
								String uid = (bSreachParent ? lnk.getResource2Uid() : lnk.getResource1Uid() );
								String resPath = dao.resourceUidToPath(uid);
								lRes.add(resPath);
							} 
						} 
						catch (Exception e) {
							System.out.println("Error// " + e.getMessage());
						}
						return lRes;
					}
				}
		);
		taskList.add(futureTask);
		executor.execute(futureTask);
	}		 
	
	// Wait until all results are available and combine them at the same time		
	for ( FutureTask<ArrayList<String>> futureTask : taskList){
		try {
			ArrayList<String> lres = futureTask.get();
			if (lres!=null && lres.size()>0) {
				lResults.addAll(lres);
			}
		} catch (Exception ex) {
			System.out.println("ERROR_Parallel: " + ex);
		} 
	}
	executor.shutdown(); 
	
	return lResults;
}//END

//===================================== END DAO FUNCTIONS ====================================
%>
