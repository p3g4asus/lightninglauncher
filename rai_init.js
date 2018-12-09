function rai_init(id,prog) {
    installer_do(function(data) {
        var pre = "var IDSH = '"+id+"';\n"+
                "var PROG_NAME = '"+prog+"';\n"+
                "var script = getScriptByPathAndName(null, 'rai_main');\n"+
                "eval(script.getText());\n";
        var script = installer_load(data.fold+"/../rai_main", "/"+id+"/"+id,Script.FLAG_APP_MENU, null,pre);
        pre = "var IDSH = '"+id+"';\n"+
                "var PROG_NAME = '"+prog+"';\n"+
                "var script = getScriptByPathAndName(null, 'rai_tap');\n"+
                "eval(script.getText());\n";
        installer_load(data.fold+"/../rai_tap", "/"+id+"/"+id+"_tap",0, null,pre);
        installer_sh_runscript(id,"i.tap","setplayer",id, data);
        return script;
    });
}

var script = getScriptByPathAndName(null, "installer");
eval(script.getText());
