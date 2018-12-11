bindClass("java.util.regex.Matcher");
bindClass("java.util.regex.Pattern");
var MY_TAG_NAME = "llscript."+IDSH;
var raish = {};
var self = raish;

self.getK = function(ep,epdetail) {
    var e = epdetail?epdetail:ep;
    return parseInt(e.datePublished.substr(0,2),10);
};

self.getKK = function(ep,epdetail) {
    return ep.titoloEpisodio;
};

self.getFolderTitle = function() {
    return self.data.o.year+"-"+self.data.o.month;
};

self.getKKK = function(ep,epdetail) {
    if (epdetail)
        return epdetail.subtitle+"\n"+epdetail.description;
    else
        return ep.subtitle;
};

self.passesFilter = function(epObj,ep,epdetail) {
    var dates = epObj.date;
    var month = dates.substr(3,2);
    var year = dates.substr(6);
    return parseInt(month,10)==self.data.o.month && parseInt(year,10)==self.data.o.year;
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

self.doOnOk = function() {
    var i,k = 1;
    var pre = "https://www.raiplay.it";
    var eps = self.downloadUrl(pre+"/programmi/"+PROG_NAME+"/index.html?json",
        function(s) {
            return JSON.parse(s);
        },null);
    var episodes = [];
    var processEp = function(ep) {
        var dates = "";
        var kkk = "";
        var duration = "";
        var epdetail = null;
        if (ep.datePublished) {
            dates = ep.datePublished;
            duration = ep.duration;
        }
        else {
            epdetail = self.downloadUrl(pre+ep.pathID,
                function(s) {
                    return JSON.parse(s);
                },null);
            dates = epdetail.datePublished;
            duration = epdetail.video.duration;
        }
        var reDur = Pattern.compile("^([0-9]+):([0-9]+):([0-9]+)$");
        var m;
        var dur;
        if ((m = reDur.matcher(duration)) && m.find())
            dur = Math.ceil((parseInt(m.group(1),10)*3600+parseInt(m.group(2),10)*60+parseInt(m.group(3),10))/60.0);
        else
            dur = 0;
        var epObj = {
            "lnk":ep.pathID,
            "date":dates,
            "k": self.getK(ep,epdetail),
            "kk": self.getKK(ep,epdetail),
            "kkk": self.getKKK(ep,epdetail),
            "dur":dur
        };
        if (self.passesFilter(epObj,ep,epdetail)) {
            self.log("LNK","ep "+epObj.kk+" dt = "+dates);
            episodes.push(epObj);
        }
    };
    for (i = eps.Blocks.length-1; i>=0; i--) {
        var sets = eps.Blocks[i].Sets;
        for (k = 0; k<sets.length; k++) {
            var set = sets[k];
            var lstep = self.downloadUrl(pre+set.url,
                function(s) {
                    return JSON.parse(s);
                },null);
            if (lstep && lstep.items)
                lstep.items.forEach(processEp);
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

        result.forEach(function(ep) {
            self.createShortcut(ep,cont);
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
