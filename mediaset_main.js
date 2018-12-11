bindClass("java.util.regex.Matcher");
bindClass("java.util.regex.Pattern");
var MY_TAG_NAME = "llscript."+IDSH;
var mediasetsh = {};
var self = mediasetsh;

self.getK = function(ep,epdetail) {
    if (epdetail)
        return epdetail.idx+"";
    else if (ep.tvSeasonNumber)
        return ep.tvSeasonNumber+"x"+(("0" + ep.tvSeasonEpisodeNumber).slice(-2));
    else
        return ep.title;
};

self.getKK = function(ep,epdetail) {
    return ep.title;
};

self.getFolderTitle = function() {
    return self.data.o.year+"-"+self.data.o.month;
};

self.getKKK = function(ep,epdetail) {
    return ep.description;
};

self.passesFilter = function(pObj,ep,epdetail) {
    var datefull = self.processDateI(ep.mediasetprogram$publishInfo_lastPublished);
    return parseInt(datefull.month,10)==self.data.o.month && parseInt(datefull.year,10)==self.data.o.year;
};

self.filterOk = function(filters) {
    var p = Pattern.compile("^([0-9]+)/([0-9]+)$");
    var m = p.matcher(filters);
    var mo,ye;
    if (m.find() &&
        (mo = parseInt(m.group(1),10))>=1 && mo<=12 &&
        (ye = parseInt(m.group(2),10))>=1990
    )
        return {
            "month":mo,
            "year":ye
        };
    else
        return null;
};

self.processDateI = function (datei) {
    var dateo = new Date();
    dateo.setTime(datei);
    var dates = dateo.toJSON().substr(0,10);
    var day = dates.substr(8,2);
    var month = dates.substr(5,2);
    var year = dates.substr(0,4);
    var datef = day+"-"+month+"-"+year;
    return {
        "dates":dates,
        "dateo":dateo,
        "datei":datei,
        "datef":datef,
        "day":day,
        "month":month,
        "year":year
    };
};

self.doOnOk = function() {
    var episodes = {"eps":{},"serv":{}},bufferep = {};
    var i,k = 1;
    var pre = "https://feed.entertainment.tv.theplatform.eu/f/PR1GhC/mediaset-prod-all-programs?byCustomValue={brandId}{"+BRAND_ID+"},{subBrandId}{"+SUBBRAND_ID+"}&sort=mediasetprogram$publishInfo_lastPublished|desc&count=true&entries=true&startIndex=";
    var entries = [];
    while (true) {
        var eps = self.downloadUrl(pre+k,
        function(s) {
            return JSON.parse(s);
        },null);
        k+=100;
        entries = entries.concat(eps.entries);
        if (eps.entryCount<100)
            break;
    }
    for (i = entries.length; i>=0; i--) {
        try {
            var entry = entries[i];
            var epid = entry.mediasetprogram$episodeId;
            if (!epid)
                epid = media.guid;
            var media = entry.media[0];
            var mainObj = null;
            if (!epid)
                epid = media.guid;
            if (!bufferep[epid]) {
                if (entry.mediasetprogram$episodeId) {
                    var datefull = self.processDateI(entry.mediasetprogram$publishInfo_lastPublished);
                    var epobj = self.downloadUrl("https://feed.entertainment.tv.theplatform.eu/f/PR1GhC/mediaset-prod-ext-programs/guid/-/"+epid,
                    function(s) {
                        return JSON.parse(s);
                    },null);
                    mainObj = {"date":datefull.datef,
                        "fvalue":epid,
                        "k":day,
                        "dur":Math.ceil(epobj.mediasetprogram$duration/60.0),
                        "kk":epobj.title+" ("+datefull.datef+")",
                        "kkk":epobj.description,
                        "idx":1,
                        "st":0};
                }
            }
            else if (episodes.serv[epid]) {
                mainObj = episodes.eps[epid];
                mainObj.idx++;
            }
            else
                continue;
            var pObj = {
                "id":media.id,
                "lnk":entry.mediasetprogram$videoPageUrl,
                "fvalue":media.guid,
                "k":self.getK(entry,mainObj),
                "kk":self.getKK(entry,mainObj),
                "kkk":self.getKKK(entry,mainObj),
                "dur":Math.ceil(entry.mediasetprogram$duration/60.0),
                "st":0
            };
            if (self.passesFilter(pObj,entry,mainObj)) {
                if (mainObj) {
                    episodes.eps[epid] = mainObj;
                    if (episodes.serv[epid])
                        episodes.serv[epid].push(pObj);
                    else
                        episodes.serv[epid] = [pObj];
                }
                else
                    episodes.eps[epid] = mainObj = pObj;
            }
            bufferep[epid] = mainObj;
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
        var cont = this.createfolder(this.desktop,self.getFolderTitle());

        Object.keys(result.eps).forEach(function(key) {
            var ep = result.eps[key];
            self.createShortcut(ep,cont);
            if (result.serv[key]) {
                var cont2 = self.createfolder(cont,"Servizi "+ep.k);
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
            }
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
    var prefFilter = new LLPreferenceText(0, "Filtro", dt.filter, dt.filter);

    // create the list view, it will hold preferences created above
    var listView = new LLPreferenceListView(context, null);

    // assign preferences to the list view
    listView.setPreferences([
        prefMainCategory,
            prefFilter
    ]);

    // create a dialog and set the list view as the main content view
    var builder=new AlertDialog.Builder(context);
    builder.setView(listView);
    builder.setTitle("Settings");
    builder.setPositiveButton("Save",{onClick:function(dialog,id) {
        try {
            var filterObj;
            if (!(filterObj = self.filterOk(dt.filter = prefFilter.getValue()))) {
                alert("Filter parameter invalid!! ");
                dialog.dismiss();
            }
            else {
                dt.o = filterObj;
                var fields = JSON.stringify(dt);
                self.log("ERR0","saving tag "+fields);
                item.setTag(MY_TAG_NAME,fields);
                dialog.dismiss();
                self.startWorking();
            }
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
    var dt;
    if(tag == null || !(dt = JSON.parse(tag)).filter) {
        this.log("ERR0","TAG not present: creating");
        this.data = {
            "filter":"4/2018"
        };
    } else {
        this.log("ERR0","TAG PRESENT: "+tag);
        this.data = dt;
    }
    this.showSettings(item);
};
self.startWorking = function() {
    this.getDataFromServer();
};

var script = getScriptByPathAndName(null, "commons");
eval(script.getText());
self.loadData();
