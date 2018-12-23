bindClass("android.app.AlertDialog");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceListView");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceCategory");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceList");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceText");

var showSettings = function() {
    var suffixitem = getEvent().getItem();
    var suffix = suffixitem.getTag("data");
    if (suffix) {
        suffix = JSON.parse(suffix);
        var item = getCurrentScript();
        var dt = item.getTag(suffix);
        var arrplayers = ["vlc", "mx", "bs"];
        if (dt) {
            dt = JSON.parse(dt);
        }
        else {
            dt = {
                "playeri": 0,
                "players":arrplayers[0]
            };
        }
        var context = getActiveScreen().getContext();

        // create various preferences
        var prefMainCategory = new LLPreferenceCategory(0, "Main");
        var prefPlayer = new LLPreferenceList(0, "Player", arrplayers, !dt.playeri?0:dt.playeri, 0);
        var prefCustom = new LLPreferenceText(0, "Custom", dt.players, dt.players);

        // create the list view, it will hold preferences created above
        var listView = new LLPreferenceListView(context, null);

        // assign preferences to the list view
        listView.setPreferences([
            prefMainCategory,
                prefPlayer,
                prefCustom
        ]);

        // create a dialog and set the list view as the main content view
        var builder=new AlertDialog.Builder(context);
        builder.setView(listView);
        builder.setTitle("Settings");
        builder.setPositiveButton("Save",{onClick:function(dialog,id) {
            try {
                dt.playeri = prefPlayer.getValueIndex();
                if (dt.playeri<0)
                    dt.playeri = 0;
            }
            catch (err) {
                dt.playeri = 0;
            }
            if ((dt.players = prefCustom.getValue()).indexOf(".")<0)
                dt.players = arrplayers[dt.playeri];
            item.setTag(suffix,JSON.stringify(dt));
            dialog.dismiss();
        }});
        builder.setNegativeButton("Cancel", null);
        builder.show();
    }
    else
        alert("Please call this script with non-null data!");
};
showSettings();
