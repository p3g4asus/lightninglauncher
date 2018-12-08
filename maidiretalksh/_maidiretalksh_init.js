var script = getScriptByPathAndName(null, "installer");
eval(script.getText());
installer_do(function(data) {
    var script = installer_load("maidiretalksh_main", "maidiretalksh",Script.FLAG_APP_MENU, data);
    installer_load("maidiretalksh_tap", "maidiretalksh_tap",0, data);
    installer_sh_runscript("maidiretalksh","i.tap","setplayer","maidiretalksh", data);
    return script;
});
