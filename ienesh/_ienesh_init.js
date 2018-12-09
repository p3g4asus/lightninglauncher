var script = getScriptByPathAndName(null, "installer");
eval(script.getText());
installer_do(function(data) {
    var script = installer_load("ienesh_main", "/ienesh/ienesh",Script.FLAG_APP_MENU, data);
    installer_load("ienesh_tap", "/ienesh/ienesh_tap",0, data);
    installer_sh_runscript("ienesh","i.tap","setplayer","ienesh", data);
    return script;
});
