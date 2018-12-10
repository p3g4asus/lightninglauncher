bindClass("java.util.regex.Matcher");
bindClass("java.util.regex.Pattern");
var raish = {};
var self = raish;
var MY_TAG_NAME = "llhscript."+IDSH+"_tap";

self.doOnOk = function() {
    var videoInfo = "";
    var i,fromArr;
    var titlesArr = [];
    var pre = "https://www.raiplay.it";
    if (self.data.outfile)
        fromArr = self.data.eps;
    else
        fromArr = [{"lnk":self.data.lnk}];
    var pUrl = Pattern.compile("<url type=\"content\">([^<]+)");
    fromArr.forEach(function(ep) {
        ep.publicUrl = self.downloadUrl(pre+ep.lnk,
            function(s) {
                try {
                    var res = JSON.parse(s);
                    if (!self.data.outfile) {
                        self.data.kkk = res.subtitle+"\n"+res.description;
                        var reDur = Pattern.compile("^([0-9]+):([0-9]+):([0-9]+)$");
                        var m;
                        var dur;
                        if ((m = reDur.matcher(res.video.duration)) && m.find())
                            dur = Math.ceil((parseInt(m.group(1),10)*3600+parseInt(m.group(2),10)*60+parseInt(m.group(3),10))/60.0);
                    }
                    return self.downloadUrl(res.video.contentUrl+"&output=45",null,
                        function(line) {
                            var m;
                            if ((m = pUrl.matcher(line)) && m.find())
                                return m.group(1);
                        });
                }
                catch (errsingle) {
                    self.log("ERR","findUrl err "+errsingle.message);
                    return null;
                }
            },null);
        titlesArr.push({"title":ep.kk,"url":ep.publicUrl});
    });
    if (self.data.outfile)
        videoInfo = titlesArr;
    else
        videoInfo = [{"url":fromArr[0].publicUrl,"title":self.data.kk}];
    return videoInfo;
};

self.go = function(res) {
    self.mainThHandler.post(new Runnable({
        run: function() {
            self.manageSh(res,IDSH);
        }
    }));
};

self.loadData = function() {
    self.item = getEvent().getItem();
    self.data = JSON.parse(self.item.getTag("ep"));
    self.mainThHandler = new Handler();
};

self.startWorking = function() {
    if (self.data) {
        self.getDataFromServer();
    }
};

var script = getScriptByPathAndName(null, "commons");
eval(script.getText());
self.loadData();
self.startWorking();
