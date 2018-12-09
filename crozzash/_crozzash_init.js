var script = getScriptByPathAndName(null, "installer");
eval(script.getText());
installer_do(function(data) {
    var script = installer_load("crozzash_main", "/crozzash/crozzash",Script.FLAG_APP_MENU, data);
    installer_load("crozzash_tap", "/crozzash/crozzash_tap",0, data);
    installer_sh_runscript("crozzash","i.tap","setplayer","crozzash", data);
    return script;
});
