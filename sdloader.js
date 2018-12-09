//se nella cartella c'è un _init va installato solo quello, eseguito con data = cartella su sd e poi cancellato. init installerà gli altri script (cft deleteScript e getEvent().getData())
var scriptFolder = "/sdcard/LightningLauncher/script";
var importPath = "/";

bindClass("java.io.FileReader");
bindClass("java.io.BufferedReader");
bindClass("java.io.File");
bindClass("java.lang.StringBuilder");
bindClass("android.widget.Toast");
bindClass("java.util.regex.Matcher");
bindClass("java.util.regex.Pattern");
var activeScreen = getActiveScreen();
var context = activeScreen.getContext();
writeToLogFile("Loading from sd\n", false);

function read(filePath) {
    try {
        var r = new BufferedReader(new FileReader(filePath));
        var s = new StringBuilder();
        var l;
        while ((l = r.readLine()) != null) s.append(l + "\n");
        return s;
    } catch (e) {
        alert(e);
        return "";
    }
}

function updateScripts(folder) {
    var lstupd = {"@":[]};
    folder.listFiles().forEach(function(file) {
        var fileName = file.getName();
        var length = fileName.length;
        if (file.isDirectory()) {
            updateScripts(file);
        } else if (fileName.substring(length - 3, length) == ".js") {
            var baseName = fileName.slice(0, -3);
            if (baseName.charAt(0)=='_') {
                var p = Pattern.compile("^_([^_]+)_(.*)"),m = p.matcher(baseName);
                if (m.find()) {
                    var rname = m.group(1);
                    var dt;
                    if (typeof lstupd[rname] == "undefined") {
                        lstupd[rname] = 0;
                    }
                    if (lstupd[rname]<(dt = file.lastModified()))
                        lstupd[rname] = dt;
                }
                else
                    lstupd["@"].push({"f":baseName,"date":file.lastModified()});
            }
            else
                lstupd["@"].push({"f":baseName,"date":file.lastModified()});
        }
    });
    var folderPath = folder.getPath();
    var basePath = folderPath.substring(scriptFolder.length);
    var processScript = function(baseName,tagName,lmdate) {
        writeToLogFile("Loading bn = "+baseName+" bp = "+basePath+" tag = "+tagName+" dt = "+lmdate+"\n", true);
        var tagScript = getScriptByPathAndName(basePath, tagName);
        var tagdate;
        if (tagScript == null) {
            writeToLogFile("sdloader: "+tagName+" not found creating\n", true);
            Toast.makeText(context, "creating new script: " + tagName, Toast.LENGTH_SHORT).show();
            tagdate = 0;
        } else {
            tagdate = tagScript.getTag("lmdate");
        }
        if (lmdate > tagdate || typeof tagdate == "undefined") {
            updatedScripts.push(tagName);
            var installScript;
            if (tagScript==null || tagName!=baseName)
                installScript = createScript(basePath, baseName, "", 0);
            else
                installScript = tagScript;
            var txt;
            installScript.setText(txt = read(folderPath + "/" + baseName + ".js"));
            //writeToLogFile(baseName+" Script "+txt+"\n", true);
            if (tagName!=baseName) {
                if (tagScript==null)
                    tagScript = createScript(basePath, tagName, "", 0);

                writeToLogFile(baseName+" Running script\n", true);
                installScript.run(activeScreen,JSON.stringify({"fold":folderPath,"base":basePath,"tag":tagName}));
                //deleteScript(script);
                //script = getScriptByPathAndName(basePath, tagName);
            }
            else
                tagScript = installScript;
            tagScript.setTag("lmdate", time);
        }
    };
    Object.keys(lstupd).forEach(function(key) {
        var obj = lstupd[key],baseName,tagName,dt;
        if (key=="@") {
            for (var i = 0; i<obj.length; i++) {
                baseName = obj[i].f;
                tagName = baseName;
                dt = obj[i].date;
                processScript(baseName,tagName,dt);
            }
        }
        else {
            baseName = "_"+key+"_init";
            tagName = key;
            dt = obj;
            processScript(baseName,tagName,dt);
        }
    });
}
var time = new Date().getTime();
var updatedScripts = [];
var folder = new File(scriptFolder);
var run = function() {
    //var scriptNames = []
    updateScripts(folder);

    if (updatedScripts.length > 0) Toast.makeText(context, "Updated scripts: " + JSON.stringify(updatedScripts), Toast.LENGTH_SHORT).show();
};
var data = getEvent().getData(),v = 0;
if (!data || (v = parseInt(data,10))<=0)
    run();
else
    setTimeout(run,v);
