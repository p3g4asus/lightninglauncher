function mediaset_init(id,brand,subbrand) {
    installer_do(function(data) {
        var pre = "var IDSH = '"+id+"';\n"+
                "var BRAND_ID = "+brand+";\n"+
                "var SUBBRAND_ID = "+subbrand+";\n";
        var script = installer_load(data.fold+"/../mediaset_main", "/"+id+"/"+id,Script.FLAG_APP_MENU, data,pre);
        installer_load(data.fold+"/../mediaset_tap", "/"+id+"/"+id+"_tap",0, data,pre);
        installer_sh_runscript(id,"i.tap","setplayer",id, data);
        return script;
    });
}

var script = getScriptByPathAndName(null, "installer");
eval(script.getText());
