<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" 

	import="java.util.*" 
	import="java.io.*"
	import="java.util.regex.Pattern"
	
	import="java.nio.file.*"
	import="java.nio.charset.*"
	import="org.json.*"

    import="com.phoenixint.analysislibrary.persistence.*" 
    
	import="com.phoenixint.analysislibrary.domain.ALUser"
    import="com.phoenixint.analysislibrary.security.ALLoginModule"
	import="static com.phoenixint.analysislibrary.localization.LocalizedStrings.*"
	
	import="com.phoenixint.analysislibrary.security.logging.LoginLogger"
%>
<%!/*----BEGIN UTILS FUNCTION----*/
	//==================================================================
	//				CONSTANTS
	//==================================================================
	String _HOME_PAGE 	 = "/sdma/index.jsp"; 

	/**The current project*/
	String _PROJECT 	 = "viewer"; 	 //Current project 
	
	/**The User DATA path*/ 
	String _DATA_PATH 	 = "/datas/";
	
	/**The user profile filename*/
	String _PROFILE_FILE = "profile.json"; 
	
	/**The default data path*/ 
	String _DEFAULT_PROFILE_URI = "/sdma/"+ _PROJECT + _DATA_PATH + "default";
	
	/**The data project folder context*/
	String _DATA_PROJECT_URI 	= _DATA_PATH + _PROJECT + "/"; 
	
	//==================================================================
	//				GLOBAL VAR
	//==================================================================
	/** Error message */
	String _sErrorMessage 	= ""; 
	String _LOGIN 			= null; 
	String _FileUrl 		= ""; 
	String _SessionId		= null;
	
	//==================================================================
	//Skip 99-USERS Folder & TRASH
	//==================================================================
	public boolean bUserSkipped(String path) {
		if (path == null) return true;
		String sPath = path.toUpperCase().trim();
		if  (   sPath.indexOf("/99-USERS/") > 0
			 || sPath.indexOf("/99_USERS/") > 0 
			 || sPath.indexOf("/USERS/") > 0) {
				return (sPath.indexOf("/TRASH/")>=0);
			}
		return false;
	}

	//==================================================================
	//Check valis value not null && not empty
	//==================================================================
	public boolean isValid(String value) {
		return (value!=null && !(value.toString().trim().isEmpty()));
	}

	//==================================================================
	///** In a Pattern only use last word for search */
	//================================================================== 
	public String formatPattern(String searchPath) {

		String[] tab = searchPath.split("\\|");
		String searchPattern = "";

		for (String sP : tab) {
			String sPattern = sP.replace("*", " ");
			sPattern = sPattern.replace("/", " ").trim();
			sPattern = sPattern.trim();

			//Get the last folder name in the path
			String[] tPattern = sPattern.split(" ");
			for (int i = tPattern.length - 1; i >= 0; i--) {
				String sPath = tPattern[i].trim();

				if (!sPath.isEmpty()) {
					if (!sPath.startsWith("*"))
						sPath = "*" + sPath;
					if (!sPath.endsWith("*")) ///!!Needed sinon ne filtre pas les fichier versionne
						sPath += "*";
					searchPattern += " " + sPath;
					break;
				}
			}
		}
		return searchPattern.trim();
	}

	//==================================================================
	//* Format widcard globing for search parameter
	//==================================================================
	public String getGlobing(String sIntext, int iVersion) {
		String searchExt = clearText(sIntext);
		if (searchExt.isEmpty())
			return "*";

		//Configure list of filename properly
		//must eq:  *.xls? *.doc* *.ppt?
		//Warning! separation is blank
		searchExt = searchExt.replace(",", "|");
		String[] tab = searchExt.split("\\|");

		searchExt = "";
		for (String elt : tab) {
			String reg = elt.trim();
			if (reg.isEmpty())
				continue;

			//!!WARNING!! for : searchP.filenamePattern
			//    "*.xlsx?ver=1 *.pptx?ver=2" => OK  
			//    ".pptx?ver=2 " => NOK
			if (!reg.startsWith("*"))
				reg = "*" + reg;

			//Si version active
			// .dat => ne ramene que les .dat, donc ne ramenne rien
			// Il faut => ".dat*"  pour ramener les .dat?ver=xxx
			searchExt += " " + reg;
/* 			if (iVersion == 0) //Only versionned files
				searchExt += "?*";
 			else  */
 			if (iVersion > 0) //Only this version
				searchExt += "?ver=" + iVersion;
			else if (!reg.endsWith("*")) //Add * => else file whithout version will not be filtered
				searchExt += "*";
		}

		return searchExt.trim();
	}

	//==================================================================
	// Escape special car, but keep cars : * - _ =  
	//==================================================================
	public static String escapeRE(String str) {
		//return  Pattern.quote(str);
		//Pattern escaper = Pattern.compile("([^a-zA-z_0-9*\\-_=/])");
		Pattern escaper = Pattern.compile("([.?])");
		return escaper.matcher(str).replaceAll("\\\\$1");
	}

	//==================================================================
	//	  Get Regular expression
	// (?i)(.)*(((.)*\.LCAS)|(fbds))(.)*
	//==================================================================
	public String getRegExp(String searchFolder) {
		return getRegExp(searchFolder, -1);
	}
	public String getRegExp(String searchFolder, int iVersion) {
		if (searchFolder == null)
			return "";

		String regularExpression = searchFolder.trim();
		if (regularExpression.isEmpty())
			return regularExpression;

		//Replace all , by OR
		regularExpression = regularExpression.replace(",", "|");

		String[] tabItem = regularExpression.split("\\|");
		String searchPattern = "";
		String sep = "";
		for (String exp : tabItem) {
			//Escape les caracteres speciaux
			String txt = exp.trim();
			//txt = escapeRE(txt);

			// Ajouter * avant chaque regle, 
			// Sauf si elle commence par "/" => car indique un chemin exact
			if (!txt.startsWith("*") && !txt.startsWith("/"))
				txt = "*" + txt;

			if (iVersion <= 0) {
				// !! ATTENTION  !!
				// Ajouter * apres chaque regle afin de remonter les fichiers avec version
				// Sauf si on a besoin d'une version particuliere : ?ver=xxx
				if (!txt.endsWith("*") && txt.indexOf("?ver=") < 0)
					txt += "*";
			} 
/* 			else if (txt.indexOf("?ver=") < 0) {
				// Remove final *
				if (txt.endsWith("*"))
					txt = txt.substring(0, txt.length() - 1);

				//Append version
				txt += "?ver=" + iVersion;
			} */

			//txt = escapeRE(txt);
			searchPattern += sep + "(" + txt + ")";
			sep = "|";
		}

		//Remplacer tou les * par la regex (.)*
		//=> n'importe quoi ( . : any character  * : 0 or more times) */
		regularExpression = escapeRE(searchPattern);
		regularExpression = regularExpression.replace("*", "(.)*");
		return regularExpression;
	}

	//==================================================================
	//   Clear text parameter to avoid search null* 
	//==================================================================
	public String clearText(String sIntext) {
		if (sIntext == null)
			return "";
		if (sIntext.trim().isEmpty())
			return "";

		String sOutText = sIntext.replaceAll("\\n", "");
		sOutText = sOutText.replaceAll("\\r", "");
		sOutText = sOutText.replaceAll("\\t", "");
		sOutText = sOutText.replaceAll("\"", "");
		sOutText = sOutText.replaceAll("'", "");
		sOutText = sOutText.trim();
		if (sOutText == "," || sOutText == "|")
			return "";
		return sOutText;
	}

	//==================================================================
	//   Get Intersection of list
	//==================================================================
	public <T> List<T> intersection(List<T> ilist1, List<T> ilist2) {
		List<T> list = new ArrayList<T>();

		List<T> list1 = ilist1;
		List<T> list2 = ilist2;

		//Get the shortest list, for faster
		if (list2.size() < list1.size()) {
			list1 = ilist2;
			list2 = ilist1;
		}

		for (T t : list1) {
			if (list2.contains(t)) {
				//Get Unique
				if (!list.contains(t))
					list.add(t);
			}
		}
		return list;
	}

	//==================================================================
	//		Get distict on a List (enlever les doublons)
	//==================================================================
	public <T> List<T> distinct(List<T> list) {
		Set<T> hs = new HashSet<T>();
		hs.addAll(list);
		List<T> resList = new ArrayList<T>();
		resList.addAll(hs);
		return resList;
	}

	//==================================================================
	//		 Get distict element from 2 Lists
	//==================================================================
	public <T> List<T> distinct(List<T> list1, List<T> list2) {
		List<T> list = new ArrayList<T>();

		List<T> listInit;
		List<T> listCompare;

		//Get the longest list, for faster
		if (list2.size() < list1.size()) {
			list.addAll(list2);

			listInit = new ArrayList<T>(list2);
			listCompare = new ArrayList<T>(list1);
		} else {
			list.addAll(list1);

			listInit = new ArrayList<T>(list1);
			listCompare = new ArrayList<T>(list2);
		}

		list.removeAll(listCompare);
		listCompare.removeAll(listInit);
		list.addAll(listCompare);
		return list;
	}

	//==================================================================
	//	Copy recusrsivelly file
	//==================================================================
	public void copyFiles(File fDefault, String targetFolder) throws Exception {
		for (File source : fDefault.listFiles()) {

			String newFile = targetFolder + "/" + source.getName();
			try {
				Files.copy(source.toPath(), Paths.get(newFile));
				
				//Copy recursuvelly
				if (source.isDirectory()) {
					copyFiles(source, newFile);
				}
			} catch (Exception e) {
				//System.out.println("Unsucessful. What a surprise! \n  -> " + e);
			}
		}
	}
	 
	//==================================================================
	//			Create User profile if not exists
	//==================================================================
	public void checkUserProfile(HttpServletRequest request, String login, String role) throws Exception { 
		 
		//Get Profile context : $ROOT/datas/$project/$login
		ServletContext ServletContext = request.getSession().getServletContext(); 
		String sProfileContext  = _DATA_PROJECT_URI + login;  
		String sFullUserPath 	= ServletContext.getRealPath(sProfileContext); 
		
		//--------------------------------------
		// If new User folder => Duplicate the default folder
		//-------------------------------------------
		File targetFolder = new File(sFullUserPath);
		if (! targetFolder.exists() ){
			 
			//Create the directory
			targetFolder.mkdirs(); 
			
			//The default data folder path  
			String defaultFolder = ServletContext.getRealPath(_DEFAULT_PROFILE_URI);
			File fDefault = new File(defaultFolder);
			copyFiles(fDefault, sFullUserPath);

			//Initialize 'profile.json' && update the login value 
			try {
				String profilePath  = sFullUserPath + "/" + _PROFILE_FILE;
				Path path = Paths.get(profilePath);
				List<String> lTxt = Files.readAllLines(path, StandardCharsets.UTF_8); 
				String jsonStr = "";
				for (String lg : lTxt) jsonStr += " " + lg;
				 
				JSONTokener tokener = new JSONTokener(jsonStr);
				JSONObject jProfile = new JSONObject(tokener);
				
				//Set login
				jProfile.put("login", login); 
				jProfile.put("role", role); 
				
				FileWriter pfile = new FileWriter(profilePath);
				pfile.write(jProfile.toString(4)); 
				pfile.flush();
				pfile.close();
			} catch (Exception x) {}
		} 
	} 
%> 
<%
//---------------------
//- INIT LOGIN
//---------------------
_LOGIN = null;
_SessionId = request.getParameter("sessionId"); 
if (_SessionId!=null) { 
	Object obj = session.getAttribute(_SessionId); 	
	if (obj!=null && (obj instanceof String)) { 
		_LOGIN = (String)obj;
	}
} 

//------------------
// INIT File URI
//---------------------
String url = request.getRequestURL().toString(); 
String _AL_URL = url.substring(0, url.length() - request.getRequestURI().length()) + request.getContextPath() + "/";
_FileUrl = _AL_URL + "content/files";
%>

