bindClass("java.util.regex.Matcher");
bindClass("java.util.regex.Pattern");
var MY_TAG_NAME = "llscript.ienesh";
var ienesh = {};
var self = ienesh;

self.doOnOk = function() {
    var episodes = {};
    var i;
    var pre = "https://www.iene.mediaset.it";
    var daysObj = self.downloadUrl(pre+"/data/episode/"+self.data.year+"-"+self.data.month+".json",
    function(s) {
        return JSON.parse(s);
    },null);
    var findFValue = function (s) {
        var p = Pattern.compile("guid=([A-Za-z0-9]+)");
        var m = p.matcher(s);
        if (m.find())
            return m.group(1);
        else
            return null;
    };
    var findEpId = function (s) {
        var p = Pattern.compile("episode/id\\-([0-9]+)\\.json");
        var m = p.matcher(s);
        if (m.find())
            return m.group(1);
        else
            return null;
    };
    var findEpInfo = function(s) {
        if (!findEpInfo.epid) {
            findEpInfo.epid = findEpId(s);
        }
        if (!findEpInfo.fvalue) {
            findEpInfo.fvalue = findFValue(s);
        }
        return findEpInfo.fvalue && findEpInfo.epid?
            {
                "epid":findEpInfo.epid,
                "fvalue": findEpInfo.fvalue
            }:null;
    };
    var findServices = function(s) {
        var obj = JSON.parse(s);
        var out = [];
        var serv;
        self.log("ERR0", "N servs "+obj[0].videos.length);
        for (var k = 0; k<obj[0].videos.length; k++) {
            serv = obj[0].videos[k];
            out.push({
                "id":serv.id,
                "lnk":serv.url_web,
                "title":serv.title,
                "duration":serv.duration,
                "descr":serv.description
            });
        }
        return out;
    };
    for (i = 0; i<daysObj.days.length; i++) {
        try {
            var day = daysObj.days[i];
            self.log("ERR0", "Get "+i+" "+day.u);
            var date = self.data.year+"-"+self.data.month+"-"+day.d;
            var ep = {"date":date,"lnk":day.u,"day":day.d};
            findEpInfo.epid = null;
            findEpInfo.fvalue = null;
            var epinfo = self.downloadUrl(pre+day.u,null,findEpInfo);
            ep.serv = self.downloadUrl(pre+"/data/iene/episode/id-"+epinfo.epid+".json",findServices);
            ep.id = epinfo.epid;
            ep.fvalue = epinfo.fvalue;
            for (var k = 0; k<ep.serv.length; k++) {
                var s = ep.serv[k];
                s.fvalue = self.downloadUrl(pre+s.lnk,null,findFValue);
            }
            episodes[epinfo.epid] = ep;
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

        Object.keys(result).forEach(function(key) {
            var ep = result[key];
            var cont2 = self.createfolder(cont,"Servizi "+ep.day);
            self.createShortcut({
                "id":ep.id,
                "lnk":ep.lnk,
                "fvalue":ep.fvalue,
                "k":ep.day,
                "kk":"Puntata "+ep.date,
                "kkk": "",
                "st":0
            },cont);
            var i = 1,arreps = [];
            ep.serv.forEach(function(serv) {
                var serv2 = {
                    "id":serv.id,
                    "lnk":serv.lnk,
                    "fvalue":serv.fvalue,
                    "k":""+i,
                    "kk":serv.title,
                    "kkk":serv.descr,
                    "dur":serv.duration,
                    "st":0
                };
                arreps.push(serv2);
                self.createShortcut(serv2,cont2);
                i++;
            });
            self.createShortcut({
                "eps":arreps,
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
            if ((m = reNum.matcher(year)) && m.find() && (v = parseInt(year,10))>=2018)
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
