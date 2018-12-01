var script = getScriptByPathAndName(null, "installer");
eval(script.getText());
installer_do(function(data) {
    return installer_load("devicedl_main", "devicedl",Script.FLAG_APP_MENU, data);
});
