<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%> 
<%@include file="v-dao.jsp" %> 
<%
	//------------ BEGIN JSP ------------	
	System.out.println("\n[Call search.jsp]");

	if (!_sErrorMessage.isEmpty()) {
		throw new Exception(_sErrorMessage);
	}

	//------------Serial launch------------
	boolean bLaunchSerial = true; //parallel trop lent
	
	/*----BEGIN REQUEST----*/
	JSONArray jArrayResults = new JSONArray();
	
	try { 
		
		//------------Study : Root Path------------
		String sStudyPath = clearText(request.getParameter("study"));
		if (sStudyPath == null || sStudyPath.isEmpty())
			throw new Exception("No search 'root path' parameter was given");

		 String 	data	 = request.getParameter("data");
		 JSONTokener tokener = new JSONTokener(data);
		 JSONObject jParameter = new JSONObject(tokener); 
		 			
		//------------ Get version ------------
		int iVersion = -1;
		
		//Check version, in not empty and not active
		try {
			String searchVersion = jParameter.getString("_VERSION_");
			if ( ! "all".equalsIgnoreCase(searchVersion) ) {
				try {
					iVersion = Integer.parseInt(searchVersion.trim());
				} 
				catch (NumberFormatException en) {
					iVersion = 0; //Max (Last) version, or something not integer
				}
			}
		} catch (JSONException xv) {
			iVersion = 0; //No version attribute => Get last
		}
	
		//------------ Target Result Files pattern------------ 
		
		String searchFolderPattern	= ""; String fsep = "";
		String filenamePattern 		= ""; String sep  = "";
		
		//------------------ RESULT PATTERN ----------------------
		try { 
			JSONArray jPattern	= jParameter.getJSONArray("_PATTERN_");
			
			for (int i=0 ; i<jPattern.length(); i++){
				
				String fold = jPattern.getString(i).trim(); 
				if (fold.isEmpty()) continue;
				 
				int j = fold.lastIndexOf("/");
				if (j>0)  {
					String folder = fold.substring(0, j+1).trim();
					if (!folder.isEmpty()) {
						searchFolderPattern += fsep + folder; 
						fsep = "|";
					}
					
					String file = fold.substring(j+1).trim();
					if (!file.isEmpty()) {
						filenamePattern += sep + file; 
						sep = "|";
					}
				}
				else {
					filenamePattern += sep + fold; 
					sep = "|";
				}
			}
		}
		catch (JSONException px) {}
		
		//------------ Folder RegEx ------------  
		String folderRegEx	= "";
		if ( !searchFolderPattern.trim().isEmpty()) {
			folderRegEx = getRegExp(searchFolderPattern, iVersion);
		} 
		
		//------------ Filename Globing ------------  
		String searchNamesGlob = "*";
		if ( !filenamePattern.trim().isEmpty()) {
			searchNamesGlob = getGlobing(filenamePattern, iVersion);
		}
		
		//------------ RESULT Property ------------
		String sPropertyJson = "";
		try {
			JSONArray jProperty	= jParameter.getJSONArray("_PROPERTY_");
			sPropertyJson = jProperty.toString();
			
			String metadata = clearText(sPropertyJson);
			if (metadata.isEmpty()) sPropertyJson = "";
		} 
		catch (Exception e1) {}
  	
		//-------------------------------------------
		//Test if nedd to get direct value (whithout parent/child spec))
		boolean bGetDirectResult = true;

		//------------Get PARENT PATTERN ------------
		ArrayList<String> tPatterns = new ArrayList<String>();
		ArrayList<String> oPatterns = new ArrayList<String>();
		ArrayList<ArrayList<PropertyConstraint>> lPatternProps = 
									  new ArrayList<ArrayList<PropertyConstraint>>();
		try {
			JSONArray jParrent = jParameter.getJSONArray("_PARENT_"); 
			
			for (int i=0 ; i<jParrent.length(); i++){ 
				JSONObject json = jParrent.getJSONObject(i);
				String sfiles = clearText(json.getString("_files_"));
				
				oPatterns.add(sfiles); 
				tPatterns.add(getRegExp(sfiles)); 
					
				JSONArray jParentProp =  json.getJSONArray("_properties_");  
				ArrayList<PropertyConstraint> pConstraints = getPropertyContraints(jParentProp);
				lPatternProps.add(pConstraints);

				if ( isValid(sfiles) || pConstraints.size()>0) {
					bGetDirectResult = false; 
				}
			}
		} catch (Exception e2) {} 
		
		//Set number of parent here;
		int nbParent = tPatterns.size();
		
		//------------Get child patterns------------  
		try {
			JSONArray 	jChild	= jParameter.getJSONArray("_CHILD_");  
			for (int i=0; i<jChild.length(); i++){
				
				JSONObject json = jChild.getJSONObject(i);
				String sfiles = clearText(json.getString("_files_"));
				oPatterns.add(sfiles);  
				tPatterns.add(getRegExp(sfiles)); 

				JSONArray jChildProp =  json.getJSONArray("_properties_");  
				ArrayList<PropertyConstraint> cConstraints = getPropertyContraints(jChildProp);
				lPatternProps.add(cConstraints);
 
				if ( isValid(sfiles) || cConstraints.size()>0)
					bGetDirectResult = false; 
			}
		} catch (Exception e3) {} 
 
		//----------------------------------------
		//
		//  Search by filename if no child & parent
		//
		//----------------------------------------	
		//Check if has Results constraints
		boolean bNoResConstraint = (searchFolderPattern+filenamePattern+sPropertyJson).isEmpty();
		
		if ( bGetDirectResult ) {
			if (bNoResConstraint) {
				throw new Exception("Cannot get all datas<br>More specification are needed!");
			}
			
 			jArrayResults = searchByFilename(sStudyPath
 											, sPropertyJson
											, ""+iVersion
											, folderRegEx
											, searchNamesGlob
											, true);
		}
		else {
			 
			int iNbParentOrChild  = 0;		 //Number of Parent or children founds
			
			ArrayList<ArrayList<String>> lstAllParentOrChild = new ArrayList<ArrayList<String>>();
			
			int numberOfPattern = oPatterns.size();
			
			//----------------------------------------
			//- Do search the exact parent/children file(s)
			//- and then recursivelly search if 
			//- jPossibleResults has theses parent/child
			//----------------------------------------	
			for (int idx=0; idx<tPatterns.size(); idx++) {
				
				//Current pattern
				String sCurrentFilter = tPatterns.get(idx);
				
				//Flag to Search parent or child
				boolean bSearchParent = (idx<nbParent); 

				//Search the last file/folder name in the path to search
 				String filePattern = oPatterns.get(idx).trim(); 
				if ( filePattern.isEmpty() ) 
					filePattern = "*";
				else
					filePattern = formatPattern(filePattern); 
							
				ArrayList<String> lParentOrChildTosearch = new  ArrayList<String>();
				ArrayList<PropertyConstraint> lproperties = lPatternProps.get(idx);
				boolean bhasProps = (lproperties!=null && lproperties.size()>0);
					
				//If there is no filter, keep file
				if (!bhasProps && sCurrentFilter.equals(filePattern)) {
					lParentOrChildTosearch.add(sCurrentFilter);
					continue;
				} 
				
				//If there is a filter, search for all occurency of parent/children
				String sFolderPath = sStudyPath;
				if (!sFolderPath.endsWith("/")) sFolderPath += "/";
				
				UnifiedSearchRequest uPS = new UnifiedSearchRequest();
				uPS.setTarget(new CacheablePath(sFolderPath) );
				uPS.setDeep(true);
				uPS.setMatchFilenameOrContent(true);
				uPS.setFilenamePattern(filePattern);
				if (bhasProps) uPS.setPropertyConstraints(lproperties);
			
				AnalysisLibraryDAO dao = AnalysisLibraryDAOFactory.getDao();
				SearchResult<String> lstRes = dao.searchFiles(uPS);  
				for (String path : lstRes.getResults() ) {
					if (sCurrentFilter.isEmpty() || path.matches(sCurrentFilter)) {
						lParentOrChildTosearch.add(path);
					}
				}

				//Get total of parents or children
				iNbParentOrChild += lParentOrChildTosearch.size();
				
				//Always append list even id its is ampty
				// => that allow to know where is the index for children search 
				lstAllParentOrChild.add(lParentOrChildTosearch);	
			}
			
			//----------------------------------------------
			//	If found values of parent or children
			//----------------------------------------------
			if (iNbParentOrChild>0) {

				//If don't have Result constraints
				// Get all children (if bSearchParent) or Parents (if child search)
				// of founded parents or children
				if (bNoResConstraint) { 
					
					ArrayList<String> lParents  = new ArrayList<String>();
					ArrayList<String> lChildren = new ArrayList<String>();
					
					int ix = -1;
					//The result resource must has all parent/children given (AND)
					for (ArrayList<String> lParentOrChildTosearch : lstAllParentOrChild) {
						//Inverser : if parent found => get children
						boolean bSearchParent = (++ix >= nbParent); 
						
						CopyOnWriteArrayList<String> lstRes = 
									getAllParentOrChildrenFor(lParentOrChildTosearch, bSearchParent);
						
						//Don't add empty list
						if (lstRes.size()==0) continue;
						
						if (bSearchParent)
							lParents.addAll(lstRes);
						else
							lChildren.addAll(lstRes);

					} //end for lParentOrChildTosearch
					
					//Do intersection, between Parent and children if have children
					List<String> finalList;
					
					if (nbParent == 0) 				    //No parent => child only
						finalList = distinct(lChildren);
					else if (numberOfPattern > nbParent) //Parents and child => intersect
						finalList = intersection(lParents, lChildren);
					else 								//Parent only
						finalList = distinct(lParents);
					
					for (String res : finalList) {
						jArrayResults.put(toJson(res)); 
					} 
				}
				else { 
					
 					//Filter all possible results, according to search folder & search filename/extension
					JSONArray jPossibleResults = searchByFilename(sStudyPath, sPropertyJson
																			, ""+iVersion
																			, folderRegEx
																			, searchNamesGlob
																			, false);
		  									
					HashMap<String, Collection<Link>> hLinkByRes = new HashMap<String, Collection<Link>>();
					 
					//Get recursivelly, parents or children of matched result
					for (int k=0; k<jPossibleResults.length(); k++) {
						
						String path = jPossibleResults.getString(k);
						
						ArrayList<String> lAreadySearchedParents = new ArrayList<String>();
						ArrayList<String> lAreadySearchedChilds  = new ArrayList<String>();
						boolean bFoundMatchedRes = true;
						
						//The result resource must has all parent/children given (AND)
						for (int it=0; it < lstAllParentOrChild.size(); it++) { 
							 
							 //The list of parent/child targetted
							 ArrayList<String> lParentOrChildTosearch = lstAllParentOrChild.get(it);
							 
							//If no parents with this criteria found, no need to filter
							if (lParentOrChildTosearch.size()<=0) continue; 

							//Search parent or child
							boolean bSearchParent = (it < nbParent);
							
							//Remove already searched for this resources
							if (bSearchParent) {
								lParentOrChildTosearch.removeAll(lAreadySearchedParents);
								lAreadySearchedParents.addAll(lParentOrChildTosearch);
							}
							else {
								lParentOrChildTosearch.removeAll(lAreadySearchedChilds);
								lAreadySearchedChilds.addAll(lParentOrChildTosearch);
							}
							
							if (lParentOrChildTosearch.size()==0) continue;
							
							//Start to check this resource 
							ArrayList<String> lstResToCheck = new ArrayList<String>();
							lstResToCheck.add(path);
							if ( ! findMatchedParentsOrChilds( bSearchParent //, iVersion
													 , lParentOrChildTosearch
													 , lstResToCheck
													 , bLaunchSerial
													 , hLinkByRes)) {
								bFoundMatchedRes = false;
								break;
							}
						} //end for lParentOrChildTosearch
						
						//Append this res if all parent/children are matched
						if (bFoundMatchedRes) {
							jArrayResults.put(toJson(path)); 
						}
					
					}//end for each k jPossibleResults 
					
				}//end if bNoResConstraint
			}
	 
		} //---- End if bGetDirectResult ---
		
		//------------ Get RESULT Metadatas------------
		try {
			JSONArray jMetadata	= jParameter.getJSONArray("_METADATA_"); 
			if ( jMetadata!=null && jMetadata.length()>0 ) {
				List<QName> tabQNames = getListOfQnames(jMetadata);
				if (tabQNames.size()>0) {
					for (int i=0; i<jArrayResults.length(); i++) {
						JSONObject jResult = jArrayResults.getJSONObject(i);
						
						String path = jResult.getString("path");
						JSONObject jMeta = getProperties(path, tabQNames);
						
						for(String key : JSONObject.getNames(jMeta) ) {
							jResult.put(key, jMeta.get(key));
						}
					}
				}
			}
		} 
		catch (Exception e1) {}

		//------------------------------------
		// OUTPUT WRITES
 		//------------------------------------
		//Write Response result
		//response.setHeader("Cache-Control", "no-cache");
		response.reset();
		response.setContentType("application/json;charset=utf-8");
		PrintWriter writer = response.getWriter();
		writer.println(jArrayResults);
		writer.flush();
		return;

	} catch (Throwable ex) {
		response.sendError(HttpServletResponse.SC_BAD_REQUEST, "<br>" + ex.getMessage());
	}
%>