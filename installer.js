bindClass("java.io.FileReader");
bindClass("java.io.BufferedReader");
bindClass("java.lang.StringBuilder");

function installer_checkversion() {
    var screen = getActiveScreen();
    var context = screen.getContext();
    var version = context.getPackageManager().getPackageInfo(context.getPackageName(), 0).versionCode%1000;
    if(version < 305) {
        alert("You need Lightning Launcher V14b6 or later to use this script");
        return false;
    }
    else
        return true;
}

function installer_read(fold,id) {
    try {
        var r = new BufferedReader(new FileReader(fold+id+".js"));
        var s = new StringBuilder();
        var l;
        while ((l = r.readLine()) != null) s.append(l + "\n");
        return s;
    } catch (e) {
        alert(e);
        return "";
    }
}

function installer_load(id, name, flag, data, prepend) {

    var idxslh = name.lastIndexOf('/');
    if (idxslh<=0)
        pthfake = '/';
    else
        pthfake = name.substr(0,idxslh);
    name = name.substr(idxslh+1);

    idxslh = id.lastIndexOf('/');
    if (idxslh<=0)
        pthtrue = data.fold+'/';
    else
        pthtrue = id.substr(0,idxslh+1);
    id = id.substr(idxslh+1);
    if (idxslh<=0)
        id = "_"+id;

    // load the script (if any) among the existing ones
    var script = getScriptByPathAndName(pthfake, name);

    // load the script text from the package
    var script_text = (!prepend?"":prepend)+installer_read(pthtrue,id);
    writeToLogFile("Searching base = "+pthfake+" name = "+name+" id = "+id+"\n", true);
    if(script == null) {
        // script not found: install it
        writeToLogFile(name+" Not found: creating\n", true);
        script = createScript(pthfake, name, script_text , flag);
    } else {
        writeToLogFile(name+" FOUND\n", true);
        // the script already exists: update its text
        script.setText(script_text);
        script.setFlag(Script.FLAG_ALL,false);
        script.setFlag(flag,true);
    }

    return script;
}

function installer_sh_runscript(suffix,evt,script,data,folddata) {
    if ((scr = getActiveScreen()) || (scr = getHomeScreen())) {
        var cont = scr.getCurrentDesktop();
        var sli = script.lastIndexOf("/");
        var pth;
        if (sli>0)
            pth = script.substr(0,sli);
        else
            pth = null;
        var scrname = script.substr(sli+1);
        var ico = Image.createImage(folddata.fold+"/"+suffix+".png");
        var sh = cont.addShortcut(scrname, new Intent(), 1, 1);
        if (ico)
            sh.setDefaultIcon(ico);
        sh.setTag("data",JSON.stringify(data));
        var ed = sh.getProperties().edit();
        var script_obj = getScriptByPathAndName(pth,scrname);
        ed.setEventHandler(evt, EventHandler.RUN_SCRIPT, script_obj.getId());
        ed.commit();
        return sh;
    }
    else
        return null;
}

function installer_do(fun) {
    if (installer_checkversion()) {
        var data = null,subdata;
        try {
            data = JSON.parse(subdata = getEvent().getData());
            writeToLogFile("OK parsing "+subdata+"\n", true);
            if (data) {
                var mainscript = fun(data);
                mainscript.setTag("fold",subdata);
            }
            deleteScript(getCurrentScript());
            return true;
        }
        catch (err) {
            writeToLogFile("Err reading data "+err.message+" sub = "+subdata+"\n", true);
        }
    }
    return false;
}
