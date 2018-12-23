bindClass("java.lang.Thread");
bindClass("java.lang.Runnable");
bindClass("android.os.Handler");
bindClass("android.os.Looper");
bindClass("android.content.ComponentName");
bindClass("java.net.URL");
bindClass("java.net.InetAddress");
bindClass("java.net.Socket");
bindClass("java.io.InputStreamReader");
bindClass("java.io.BufferedReader");
bindClass("java.io.BufferedWriter");
bindClass("java.io.FileWriter");
bindClass("java.io.PrintWriter");
bindClass("java.io.OutputStreamWriter");
bindClass("java.lang.reflect.Array");
bindClass("java.lang.String");

function convertToM3uPlaylist(arr,title) {
    var v = "#EXTM3U\n";
    var startfrom = 0;
    for (var aa in arr) {
        var a = arr[aa];
        //a.kk.replace(/[^\x00-\x7F]/g, "")
        if (a.url) {
            v+="#EXTINF:"+startfrom+","+a.title+"\n"+a.url+"\n";
            startfrom++;
        }
    }
    return v;
}

function convertToXspfPlaylist(arr,title) {
    var startfrom = 0;
    var v = '<?xml version="1.0" encoding="UTF-8"?>'+"\n";
    var appendpl = "\t"+'<extension application="http://www.videolan.org/vlc/playlist/0">'+"\n";
    v+='<playlist version="1" xmlns="http://xspf.org/ns/0/" xmlns:vlc="http://www.videolan.org/vlc/playlist/ns/0/">'+"\n";
    v+="\t<title>"+encodeXml(title)+"</title>\n\t<trackList>\n";
    for (var aa in arr) {
        var a = arr[aa];
        if (a.url) {
            var ttl = a.title.replace(/[^\x00-\x7F]/g, "");
            appendpl+="\t\t"+'<vlc:node title="'+encodeXml(ttl)+'">'+"\n\t\t\t<vlc:item tid=\""+startfrom+'" />'+"\n\t\t</vlc:node>\n";
            v+="\t\t<track>\n\t\t\t<title>"+encodeXml(ttl)+"</title>\n\t\t\t<location>"+encodeXml(a.url.split('\\/').join('/'))+"</location>\n";
            v+="\t\t\t"+'<extension application="http://www.videolan.org/vlc/playlist/0">'+"\n\t\t\t\t<vlc:id>"+startfrom+"</vlc:id>\n\t\t\t</extension>\n\t\t</track>\n";
            startfrom++;
        }
    }
    v+="\t</trackList>\n";
    v+=appendpl+"\t</extension>\n</playlist>";
    return v;
}

var xml_special_to_escaped_one_map = {
    '&': '&amp;',
    '"': '&quot;',
    '<': '&lt;',
    '>': '&gt;'
};

var escaped_one_to_xml_special_map = {
    '&amp;': '&',
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>'
};

function encodeXml(string) {
    return string.replace(/([\&"<>])/g, function(str, item) {
        return xml_special_to_escaped_one_map[item];
    });
}

self.log = function(vv, str, append) {
    append = typeof append == "undefined" ? true : append;
    var i = new TaskerIntent("LLLog");
    i.addParameter(str = "[" + self.getScriptPrefix() + "] " + str);
    i.addParameter('LLLOG_' + vv);
    sendTaskerIntent(i, false);
    writeToLogFile(str + "\n", append);
};

self.downloadUrl = function(urls,processor,lineprocessor) {
    var br = null,con = null, rv = null,linepr = null,serverMessage = "";
    try {
        self.log("ERR0", "getting "+urls);
        var url = new URL(urls);
        con = url.openConnection();
        br = new BufferedReader(new InputStreamReader(con.getInputStream()));
        while ((line = br.readLine())!==null) {
            if (lineprocessor) {
                linepr = lineprocessor(line);
                if (linepr && !processor)
                    break;
            }
            serverMessage+=line+"\n";
        }
        if (lineprocessor && !processor)
            rv = linepr;
        else if (processor)
            rv = processor(serverMessage);
        else
            rv = serverMessage;
    } catch (err) {
        self.log("ERR3", "download err "+err.message);
    } finally {
        try {
            if(br != null) br.close();
            if(con != null) con.disconnect();
        } catch (err2) {}
        return rv;
    }
};

self.downloadTCP = function(ip,port,cmd,lineprocessor) {
    var out = null,inc = null, rv = null,socket = null,serverMessage = null;
    try {
        self.log("ERR0", "downloadTCP getting "+ip+":"+port+"/"+cmd);
        var serverAddr = InetAddress.getByName(ip);
        self.log("ERR0", "downloadTCP QUI1");
        socket = new Socket(serverAddr, port);
        self.log("ERR0", "downloadTCP QUI2");
        //send the message to the server
        out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(socket.getOutputStream())), true);
        self.log("ERR0", "downloadTCP QUI3");
        //receive the message which the server sends back
        inc = new BufferedReader(new InputStreamReader(socket.getInputStream()));
        self.log("ERR0", "downloadTCP QUI4");
        out.println(cmd);
        self.log("ERR0", "downloadTCP QUI5");
        serverMessage = inc.readLine();
        self.log("ERR0", "downloadTCP QUI6");
        if (lineprocessor)
            rv = lineprocessor(serverMessage);
        else
            rv = serverMessage;
    } catch (err) {
        self.log("ERR3", "downloadTCP err "+err.message);
    } finally {
        try {
            self.log("ERR0", "downloadTCP QUI7");
            if (socket)
                socket.close();
            self.log("ERR0", "downloadTCP QUI8");
            if (inc)
                inc.close();
            self.log("ERR0", "downloadTCP QUI9");
            if (out)
                out.close();
        } catch (err2) {}
        return rv;
    }
};

self.buildHandler = function(myLooper,result) {
    var mHandler = new Handler(myLooper, new Handler.Callback({
        handleMessage: function(msg) {
            var res = null;
            try {
                if (msg && msg.obj && msg.obj === "ok") {
                    res = self.doOnOk();
                }
            } catch (err) {
                self.log("ERR", err.message);
                self.log("ERR3", err.message);
            } finally {
                self.log("ERR0", "buildHandler QUI10");
                result.res = res;
                self.log("ERR0", "buildHandler QUI11");
            }
        }
    }));
    return mHandler;
};

self.createfolder = function(cont2, name) {
    var f = cont2.addFolder(name, 1, 1);
    var c = f.getContainer();
    if (self.ico)
        f.setDefaultIcon(self.ico);
    c.getProperties().edit().setBoolean('useDesktopSize', false).setBoolean('rearrangeItems', true).commit();
    return c;
};

self.createShortcut = function(ep,cont) {
    var txt = ep.k;
    var name = txt;
    var mfz = cont.addShortcut(txt, new Intent(), 0, 0);
    if (self.ico)
        mfz.setDefaultIcon(self.ico);

// customize the item, this will make a big text only object
    mfz.setTag("ep", JSON.stringify(ep));
    var ed = mfz.getProperties().edit();
    ed.setBoolean("i.onGrid", true);
    ed.setBoolean("s.iconVisibility", false);
    ed.setBoolean("s.labelVisibility", true);
    ed.setFloat("s.labelFontSize", 20);
    //ed.setString("s.labelFontStyle", "BOLD");
    ed.getBox("i.box").setAlignment("CENTER", "MIDDLE");
    self.addEventHandlers(ed);
    ed.commit();
};

self.getDataFromServer = function() {
    var thLooper = null;
    var myThread = new Thread({
        run: function(params) {
            try{
                self.log("ERR2", "Starting th");
                Looper.prepare();
                self.log("ERR2", "th prepared");
                thLooper = Looper.myLooper();
                self.log("ERR2", "Looper assigned");
                Looper.loop();
                self.log("ERR2", "Looper exit");
                thLooper = null;
            }
            catch (err) {
                self.log("ERR2", "err looper "+err.message);
                thLooper = null;
            }
        }
    });
    myThread.start();
    var myLooper = null;
    //var myThread = new HandlerThread("Worker Thread");
    //myThread.start();
    //var myLooper = myThread.getLooper();
    var currTim = -1;
    var resObj = {"res":"A"};
    var myFunTimeout = function() {
        clearTimeout(currTim);
        if (myLooper != null) {
            if (resObj.res !== "A") {
                self.log("ERR0", "End Detected " + myThread.isAlive());
                myLooper.quitSafely();
                self.log("ERR0", "Loop quit " + myThread.isAlive());
                /*mainHandler.post(new Runnable({
                run: function() {
                self.logData(self.serverMessage);
                }
                }));*/
                self.log("OUT", JSON.stringify(resObj.res));
                self.go(resObj.res);
                return;
            }
        } else {
            myLooper = thLooper;
            if (myLooper != null) {
                var mHandler = self.buildHandler(myLooper,resObj);
                var msg = mHandler.obtainMessage();
                msg.obj = "ok";
                mHandler.sendMessage(msg);
            }
        }
        currTim = setTimeout(myFunTimeout, 1000);
    };
    currTim = setTimeout(myFunTimeout, 1000);
};

self.getScriptPrefix = function() {
    return MY_TAG_NAME.substr(MY_TAG_NAME.lastIndexOf('.') + 1);
};

self.startVlcSh = function(urlarr) {
    var screen = getActiveScreen();
    var context = screen.getContext();
    if (urlarr) {
        var url,title;
        if (urlarr.length>1) {
            var bw = new PrintWriter(new BufferedWriter(new FileWriter(self.data.outfile)));
            bw.write(convertToM3uPlaylist(urlarr,self.data.kk));
            bw.close();
            url = self.data.outfile;
            title = self.data.kk;
        }
        else {
            url = urlarr[0].url;
            title = urlarr[0].title;
        }
        var uri = Uri.parse(url);
        var vlcIntent = new Intent(Intent.ACTION_VIEW);
        vlcIntent.setPackage("org.videolan.vlc");
        vlcIntent.setDataAndTypeAndNormalize(uri, "video/*");
        vlcIntent.putExtra("title", title);
        context.startActivity(vlcIntent);
    }
    //item.setIntent(vlcIntent);
    //item.launch();
};

self.startGenericSh = function(urlarr,pkg) {
    var screen = getActiveScreen();
    var context = screen.getContext();
    if (urlarr) {
        var url,title;
        if (urlarr.length>1) {
            var bw = new PrintWriter(new BufferedWriter(new FileWriter(self.data.outfile)));
            bw.write(convertToM3uPlaylist(urlarr,self.data.kk));
            bw.close();
            url = self.data.outfile;
            title = self.data.kk;
        }
        else {
            url = urlarr[0].url;
            title = urlarr[0].title;
        }
        var uri = Uri.parse(url);
        var vlcIntent = new Intent(Intent.ACTION_VIEW);
        var idx,cls;
        if ((idx = pkg.indexOf("/"))>0) {
            cls = pkg.substr(idx+1);
            pkg = pkg.substr(0,idx);
            vlcIntent.setComponent(new ComponentName(pkg, cls));
        }
        else
            cls = '';
        vlcIntent.setPackage(pkg);
        vlcIntent.setDataAndTypeAndNormalize(uri, "video/*");
        context.startActivity(vlcIntent);
    }
    //item.setIntent(vlcIntent);
    //item.launch();
};

self.manageSh = function(res,suffix) {
    if (res) {
        self.data.st = new Date().getTime();
        self.item.setTag("ep",JSON.stringify(self.data));
        var ed = self.item.getProperties().edit();
        ed.setInteger("s.labelFontColor", Color.MAGENTA);
        ed.commit();
        var script_player = getScriptByPathAndName(null,"setplayer");
        var players;
        try {
            players = JSON.parse(script_player.getTag(suffix)).players;
        }
        catch (errpl) {
            self.log("ERR0", "runnsh Defaulting to vlc");
            players = "vlc";
        }
        if (players=="mx")
            self.startMxSh(res);
        else if (players=="vlc")
            self.startVlcSh(res);
        else if (players.indexOf(".")>=0)
            self.startGenericSh(res,players);
    } else {
        self.log("ERR", "runnsh No url");
    }
};

self.startMxSh = function(urlarr) {
    var screen = getActiveScreen();
    var context = screen.getContext();
    var uris = Array.newInstance(Uri, urlarr.length);
    var titles = Array.newInstance(String, urlarr.length);
    var i = 0;
    urlarr.forEach(function(urltitle){
        if (urltitle.url) {
            uris[i] = Uri.parse(urltitle.url);
            titles[i++] = urltitle.title;
        }
    });
    if (uris.length) {

        var vlcIntent = new Intent(Intent.ACTION_VIEW);
        vlcIntent.setPackage("com.mxtech.videoplayer.ad");
        vlcIntent.setDataAndType(uris[0], "video/*");
        vlcIntent.putExtra("video_list", uris);
        vlcIntent.putExtra("video_list.name", titles);
        context.startActivity(vlcIntent);
    }
    //item.setIntent(vlcIntent);
    //item.launch();
};

self.log("OUT", "Starting", false);
