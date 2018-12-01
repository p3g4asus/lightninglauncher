bindClass("java.util.regex.Matcher");
bindClass("java.util.regex.Pattern");

var MY_TAG_NAME = "llscript.crozzash";
var crozzash = {};
var self = crozzash;

self.doOnOk = function() {
    var episodes = {};
    var i;
    var pre = "https://it.dplay.com";
    var findEpisodes_line = function(s) {
        var p,m,md,t = findEpisodes_line;
        if (s.indexOf("e-single-episode-content")>=0) {
            t.state = 1;
            t.ep = {};
        }
        else if (t.state==1 && (p = Pattern.compile("<a href=\"([^\"]+)\"")) && (m = p.matcher(s)) && m.find()) {
            t.state = 2;
            t.ep.lnk = m.group(1);
        }
        else if (t.state==2 && (p = Pattern.compile("e-grid-episode__title\">([^<]+)")) && (m = p.matcher(s)) && m.find()) {
            t.state = 3;
            t.ep.k = m.group(1);
        }
        else if (t.state==3 && (p = Pattern.compile("e-grid-episode__episode-descr\">([^<]+)")) && (m = p.matcher(s)) && m.find()) {
            t.state = 4;
            t.ep.kk = m.group(1);
        }
        else if (t.state==4 && (p = Pattern.compile("e-grid-episode__date\">([^<]+)")) && (m = p.matcher(s)) && m.find() &&
                (p = Pattern.compile("([0-9]+)/([0-9]+)/([0-9]+)")) && (md = p.matcher(m.group(1))) && md.find()) {
            t.state = 5;
            t.ep.datestring = m.group(1);
            //t.ep.date = new Date(parseInt(md.group(3)),parseInt(md.group(2)),parseInt(md.group(1)));
            var ym = md.group(3)+"_"+md.group(2);
            if (!t.eps)
                t.eps = {};
            if (!t.eps[ym])
                t.eps[ym] = {};
            if (!t.eps[ym][t.ep.datestring])
                t.eps[ym][t.ep.datestring] = [];
            t.eps[ym][t.ep.datestring].push(t.ep);
        }
        else if (t.state==5 && (p = Pattern.compile("e-grid-episode__duration\">[\\s]*([0-9]+)")) && (m = p.matcher(s)) && m.find()) {
            t.ep.dur = parseInt(m.group(1));
            t.state = 6;
        }
    };
    var findEpisodes_all = function(s) {
        return findEpisodes_line.eps;
    };
    var epsobj = self.downloadUrl(pre+"/nove/fratelli-di-crozza/clips/",findEpisodes_all,findEpisodes_line);
    var ym = self.data.year+"_"+("0" + self.data.month).slice(-2);
    var findEpId = function (s) {
        var p = Pattern.compile("embed/([0-9]+)");
        var m = p.matcher(s);
        if (m.find())
            return m.group(1);
        else
            return null;
    };
    if (epsobj[ym]) {
        Object.keys(epsobj[ym]).forEach(function(epdate){
            var ep = epsobj[ym][epdate];
            ep.forEach(function(serv) {
                serv.id = self.downloadUrl(pre+serv.lnk,null,findEpId);
            });
        });
        episodes = epsobj[ym];
    }
    else
        episodes = {};
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

        Object.keys(result).forEach(function(key) {
            var ep = result[key];
            var p = Pattern.compile("([0-9]+)/([0-9]+)/([0-9]+)"), m = p.matcher(key);
            m.find();
            var cont2 = self.createfolder(cont,"Servizi "+m.group(1));
            var i = 1,arreps = [];
            ep.forEach(function(serv) {
                var serv2 = {
                    "id":serv.id,
                    "lnk":serv.lnk,
                    "k":""+i,
                    "kk":serv.k,
                    "kkk":serv.kk,
                    "dur":serv.dur,
                    "st":0
                };
                arreps.push(serv2);
                self.createShortcut(serv2,cont2);
                i++;
            });

            self.createShortcut({
                "eps":arreps,
                "k":"Pls",
                "kk":"Puntata "+key,
                "kkk":"",
                "st":0,
                "outfile":self.folddata.fold+"/pls/"+m.group(3)+"-"+m.group(2)+"-"+m.group(1)+".m3u8"
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
