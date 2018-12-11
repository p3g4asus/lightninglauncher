function mediaset_init(id,brand,subbrand,fileadd) {
    installer_do(function(data) {
        var post = "";
        if (fileadd && !(post = installer_read(data.fold+"/",fileadd)))
            post = "";
        var pre = "var IDSH = '"+id+"';\n"+
                "var BRAND_ID = "+brand+";\n"+
                "var SUBBRAND_ID = "+subbrand+";\n"+installer_string_script_import(null,'mediaset_main')+post;
        var script = installer_load(null,"/"+id+"/"+id,Script.FLAG_APP_MENU,data,pre);
        pre = "var IDSH = '"+id+"';\n"+
                "var BRAND_ID = "+brand+";\n"+
                "var SUBBRAND_ID = "+subbrand+";\n"+installer_string_script_import(null,'mediaset_tap')+post;
        installer_load(null,"/"+id+"/"+id+"_tap",0,data,pre);
        installer_sh_runscript(id,"i.tap","setplayer",id,data);
        return script;
    });
}

var script = getScriptByPathAndName(null, "installer");
eval(script.getText());
