bindClass("java.util.regex.Matcher");
bindClass("java.util.regex.Pattern");
var MY_TAG_NAME = "llscript."+IDSH;
var raish = {};
var self = raish;

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
        if (ep.datePublished) {
            dates = ep.datePublished;
            kkk = ep.subtitle;
            duration = ep.duration;
        }
        else {
            var epdetail = self.downloadUrl(pre+ep.pathID,
                function(s) {
                    return JSON.parse(s);
                },null);
            dates = epdetail.datePublished;
            kkk = epdetail.description;
            duration = epdetail.video.duration;
        }

        var day = dates.substr(0,2);
        var month = dates.substr(3,2);
        var year = dates.substr(6);
        if (parseInt(month,10)==self.data.month && parseInt(year,10)==self.data.year) {
            self.log("LNK","ep "+ep.titoloEpisodio+" dt = "+dates);
            var reDur = Pattern.compile("^([0-9]+):([0-9]+):([0-9]+)$");
            var m;
            var dur;
            if ((m = reDur.matcher(duration)) && m.find())
                dur = Math.ceil((parseInt(m.group(1),10)*3600+parseInt(m.group(2),10)*60+parseInt(m.group(3),10))/60.0);
            else
                dur = 0;
            episodes.push({
                "lnk":ep.pathID,
                "date":dates,
                "k": parseInt(day,10),
                "kk": ep.titoloEpisodio,
                "kkk": kkk,
                "dur":dur
            });
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
        var cont = this.createfolder(this.desktop,this.data.year+"-"+this.data.month);

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
            if ((m = reNum.matcher(year)) && m.find() && (v = parseInt(year,10))>=2015)
                dt.year = v;
            else
                fileds+=" year";
            if ((m = reNum.matcher(month)) && m.find() && (v = parseInt(month,10))<=12 && v>=1)
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
