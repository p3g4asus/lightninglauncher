function mediaset_init(id,brand,subbrand) {
    installer_do(function(data) {
        var pre = "var IDSH = '"+id+"';\n"+
                "var BRAND_ID = "+brand+";\n"+
                "var SUBBRAND_ID = "+subbrand+";\n"+
                "var script = getScriptByPathAndName(null, 'mediaset_main');\n"+
                "eval(script.getText());+\n";
        var script = installer_load(null,"/"+id+"/"+id,Script.FLAG_APP_MENU,data,pre);
        pre = "var IDSH = '"+id+"';\n"+
                "var BRAND_ID = "+brand+";\n"+
                "var SUBBRAND_ID = "+subbrand+";\n"+
                "var script = getScriptByPathAndName(null, 'mediaset_tap');\n"+
                "eval(script.getText());+\n";
        installer_load(null,"/"+id+"/"+id+"_tap",0,data,pre);
        installer_sh_runscript(id,"i.tap","setplayer",id,data);
        return script;
    });
}

var script = getScriptByPathAndName(null, "installer");
eval(script.getText());
