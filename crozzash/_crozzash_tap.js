var crozzash = {};
var self = crozzash;
var MY_TAG_NAME = "llscript.crozzash_tap";

self.doOnOk = function() {
    var videoInfo = "";
    var i,fromArr;
    var titlesArr = [];
    var pre = "https://it.dplay.com/ajax/playbackjson/video/";
    if (self.data.outfile)
        fromArr = self.data.eps;
    else
        fromArr = [{"id":self.data.id}];
    fromArr.forEach(function(ep) {
        ep.publicUrl = self.downloadUrl(pre+ep.id,
        function(s) {
            try {
                s = s.replace(/\\n/g,"\n").replace(/\\\"/g,"\"").trim();
                s = s.substr(1,s.length-2);
                var res = JSON.parse(s);
                return res.data.attributes.streaming.hls.url;
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
            self.manageSh(res,"crozzash");
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
