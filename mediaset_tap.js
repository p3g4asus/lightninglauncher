var mediasetsh = {};
var self = mediasetsh;
var MY_TAG_NAME = "llhscript."+IDSH+"_tap";

self.doOnOk = function() {
    var videoInfo = "";
    var i,fromArr;
    var titlesArr = [];
    var pre = "https://feed.entertainment.tv.theplatform.eu/f/PR1GhC/mediaset-prod-ext-programs/guid/-/";
    if (self.data.outfile)
        fromArr = self.data.eps;
    else
        fromArr = [{"fvalue":self.data.fvalue}];
    fromArr.forEach(function(ep) {
        ep.publicUrl = self.downloadUrl(pre+ep.fvalue,
        function(s) {
            try {
                var res = JSON.parse(s);
                return res.media[0].publicUrl;
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
