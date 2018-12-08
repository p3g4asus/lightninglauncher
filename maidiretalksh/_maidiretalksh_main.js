bindClass("java.util.regex.Matcher");
bindClass("java.util.regex.Pattern");
var MY_TAG_NAME = "llscript.maidiretalksh";
var maidiretalksh = {};
var self = maidiretalksh;

self.doOnOk = function() {
    var episodes = {"eps":{},"serv":{}};
    var i,k = 1;
    var pre = "https://feed.entertainment.tv.theplatform.eu/f/PR1GhC/mediaset-prod-all-programs?byCustomValue={brandId}{100000836},{subBrandId}{100001195}&sort=mediasetprogram$publishInfo_lastPublished|desc&count=true&entries=true";
    var eps = self.downloadUrl(pre,
    function(s) {
        return JSON.parse(s);
    },null);
    for (i = eps.entries.length; i>=0; i--) {
        try {
            var entry = eps.entries[i];
            var epid = entry.mediasetprogram$episodeId;
            var media = entry.media[0];
            var serv = null;
            if (!episodes.eps[epid]) {
                var datei = media.availableDate;
                var dateo = new Date();
                dateo.setTime(datei);
                var dates = dateo.toJSON().substr(0,10);
                var day = dates.substr(8,2);
                var month = dates.substr(5,2);
                var year = dates.substr(0,4);
                if (parseInt(month)==this.data.month && parseInt(year)==this.data.year) {
                    var datef = day+"-"+month+"-"+year;
                    episodes.eps[epid] = {"date":datef,
                        "fvalue":epid,
                        "k":day,
                        "kk":"Puntata "+datef,
                        "kkk": "",
                        "st":0};
                    serv = [];
                    episodes.serv[epid] = serv;
                    k = 1;
                }
                else
                    continue;
            }
            else {
                serv = episodes.serv[epid];
                k++;
            }
            serv.push({
                "id":media.id,
                "lnk":entry.mediasetprogram$videoPageUrl,
                "fvalue":media.guid,
                "k":""+k,
                "kk":entry.title,
                "kkk":entry.description,
                "dur":Math.ceil(entry.mediasetprogram$duration/60.0),
                "st":0
            });
        }
        catch (errsingle) {
            self.log("ERR","findInfo err "+errsingle.message);
        }
    }
    return episodes;
};

self.addEventHandlers = function(ed) {
    ed.setEventHandler("i.tap", EventHandler.RUN_SCRIPT, this.script_tap.getId());
    ed.setEventHandler("i.swipeUp", EventHandler.RUN_SCRIPT, this.script_longtap.getId());
    ed.setEventHandler("i.swipeRight", EventHandler.RUN_SCRIPT, this.script_swiperight.getId());
};

self.go = function(result) {
    try {
        var cont = this.createfolder(this.desktop,this.data.year+"-"+this.data.month);

        Object.keys(result.eps).forEach(function(key) {
            var ep = result.eps[key];
            var cont2 = self.createfolder(cont,"Servizi "+ep.k);
            self.createShortcut(ep,cont);
            var i = 1,arreps = [];
            result.serv[key].forEach(function(serv) {
                self.createShortcut(serv,cont2);
            });
            self.createShortcut({
                "eps":result.serv[key],
                "k":"Pls",
                "kk":"Puntata "+ep.date,
                "st":0,
                "outfile":self.folddata.fold+"/pls/"+ep.date+".m3u8"
            },cont2);
        });
    }
    catch(err) {
        this.log("ERR0","goerr "+err.message);
    }
};

bindClass("android.app.AlertDialog");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceListView");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceCategory");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceText");

self.showSettings = function(item) {
    var dt = this.data;
    var context = this.screen.getContext();

    // create various preferences
    var prefMainCategory = new LLPreferenceCategory(0, "Main");
    var prefMonth = new LLPreferenceText(0, "Month", dt.month, dt.month);
    var prefYear = new LLPreferenceText(0, "Year", dt.year, dt.year);

    // create the list view, it will hold preferences created above
    var listView = new LLPreferenceListView(context, null);

    // assign preferences to the list view
    listView.setPreferences([
        prefMainCategory,
            prefMonth,
            prefYear
    ]);

    // create a dialog and set the list view as the main content view
    var builder=new AlertDialog.Builder(context);
    builder.setView(listView);
    builder.setTitle("Settings");
    builder.setPositiveButton("Save",{onClick:function(dialog,id) {
        try {
            var year = prefYear.getValue();
            var month = prefMonth.getValue();
            var reNum = Pattern.compile("^[0-9]+$");
            var m,v;
            var fields = "";
            if ((m = reNum.matcher(year)) && m.find() && (v = parseInt(year))>=2018)
                dt.year = v;
            else
                fileds+=" year";
            if ((m = reNum.matcher(month)) && m.find() && (v = parseInt(month))<=12 && v>=1)
                dt.month = v;
            else
                fileds+=" month";
            if (fields)
                alert("Fields invalid: "+fields);
            fields = JSON.stringify(dt);
            self.log("ERR0","saving tag "+fields);
            item.setTag(MY_TAG_NAME,fields);
            dialog.dismiss();
            self.startWorking();
        }
        catch (err) {
            self.log("ERR0","gui err "+err.message);
        }
    }});
    builder.setNegativeButton("Cancel", null);
    builder.show();
};

self.loadData = function() {
    var item = getCurrentScript();
    var pre = self.getScriptPrefix();
    self.folddata = JSON.parse(item.getTag("fold"));
    self.screen = getActiveScreen();
    self.ico = Image.createImage(self.folddata.fold+"/"+pre+".png");
    self.desktop = self.screen.getCurrentDesktop();
    self.script_tap = getScriptByPathAndName(pre,pre+"_tap");
    self.script_longtap = getScriptByPathAndName(null,"sh_longtap");
    self.script_swiperight = getScriptByPathAndName(null,"sh_swiperight");
    var tag = item.getTag(MY_TAG_NAME);
    if(tag == null) {
        this.log("ERR0","TAG not present: creating");
        this.data = {
            year: 2018,       // by how much to increment the value
            month: 4
        };
    } else {
        this.log("ERR0","TAG PRESENT: "+tag);
        this.data = JSON.parse(tag);
    }
    this.showSettings(item);
};
self.startWorking = function() {
    this.getDataFromServer();
};

var script = getScriptByPathAndName(null, "commons");
eval(script.getText());
self.loadData();
