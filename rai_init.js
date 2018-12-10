function rai_init(id,prog) {
    installer_do(function(data) {
        var pre = "var IDSH = '"+id+"';\n"+
                "var PROG_NAME = '"+prog+"';\n"+
                "var script = getScriptByPathAndName(null, 'rai_main');\n"+
                "eval(script.getText());\n";
        var script = installer_load(null,"/"+id+"/"+id,Script.FLAG_APP_MENU,data,pre);
        pre = "var IDSH = '"+id+"';\n"+
                "var PROG_NAME = '"+prog+"';\n"+
                "var script = getScriptByPathAndName(null, 'rai_tap');\n"+
                "eval(script.getText());\n";
        installer_load(null,"/"+id+"/"+id+"_tap",0,data,pre);
        installer_sh_runscript(id,"i.tap","setplayer",id,data);
        return script;
    });
}

var script = getScriptByPathAndName(null, "installer");
eval(script.getText());
