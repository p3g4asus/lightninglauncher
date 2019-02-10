var MY_TAG_NAME = "llscript.devicedl";
var devicedl = {};
var self = devicedl;
bindClass("java.util.regex.Matcher");
bindClass("java.util.regex.Pattern");
bindClass("java.io.FileOutputStream");
bindClass("android.graphics.BitmapFactory");
bindClass("android.graphics.Bitmap");
bindClass("android.graphics.Canvas");
bindClass("android.graphics.PorterDuff");
bindClass("android.graphics.PorterDuffColorFilter");

self.createImageText = function(txt, col, fom) {
    var im = Image.createImage(fom);
    if (im == null) {
        if (1) {
            var paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            paint.setTextSize(25);
            paint.setColor(col);
            paint.setTextAlign(Paint.Align.LEFT);
            var baseline = -paint.ascent(); // ascent() is negative
            var width = Math.round(paint.measureText(txt)); // round
            var height = Math.round(baseline + paint.descent());
            var image = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            var canvas = new Canvas(image);
            canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
            canvas.drawText(txt, 0, baseline, paint);
            image.compress(Bitmap.CompressFormat.PNG, 100, new FileOutputStream(fom));
            im = Image.createImage(fom);

            /*im = Image.createImage(128,128);
            var canvas = im.draw();
            var paint = new Paint();
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(fg);
            paint.setTextSize(100);
            paint.setAntiAlias(true);
            canvas.drawColor(bg);
            canvas.drawText(txt, 0, 0, paint);*/
        } else
            im = Image.createTextIcon(txt, 128, fg, bg, null);
        im.saveToFile(fom, Bitmap.CompressFormat.PNG, 100);
        im = Image.createImage(fom);
    }
    return im;
};

self.changeImageColor = function(fim, col, fom) {
    var im = Image.createImage(fom);
    if (im == null) {
        var options = new BitmapFactory.Options();
        options.inPreferredConfig = Bitmap.Config.ARGB_8888;
        options.inMutable = true;
        var bm = BitmapFactory.decodeFile(fim, options);
        var paint = new Paint();
        var filter = new PorterDuffColorFilter(col, PorterDuff.Mode.SRC_IN);
        paint.setColorFilter(filter);
        var canvas = new Canvas(bm);
        canvas.drawBitmap(bm, 0, 0, paint);
        bm.compress(Bitmap.CompressFormat.PNG, 100, new FileOutputStream(fom));
        im = Image.createImage(fom);
    }
    return im;
};

self.getIconImage = function(dev, action) {
    var im = null;
    try {
        var fico = this.data.folderico + '/';
        var generated = "generated/";
        var fim, fom;
        var tp = dev.type.substr(6).toLowerCase();
        if (dev.type == "DeviceRM" || dev.type == "DeviceAllOne" || dev.type == "DeviceCT10" ||
            dev.type == "DeviceUpnpIRTA2" || dev.type == "DeviceUpnpIRRC" || dev.type == "DeviceSamsungCtl") {
            var p, m;
            action = action.toLowerCase();
            if (action.charAt(0) == '@')
                action = action.substr(1);
            if ((p = Pattern.compile("^([^0-9]+)[0-9]+([\\-\\+])$")) && (m = p.matcher(action)) && m.find())
                action = m.group(1) + m.group(2);
            else if ((p = Pattern.compile("^[a-z]_([0-9]+)_(.*)")) && (m = p.matcher(action)) && m.find())
                action = m.group(1) + "_" + m.group(2);
            im = Image.createImage(fico + action + ".png");
            this.log("IM", "Searching " + dev.name + ":" + action);
            if (im == null) {
                this.log("IM", "Not found " + dev.name + ":" + action);
                p = Pattern.compile("^([0-9]+)_");
                m = p.matcher(action);
                if (m.find()) {
                    var nums = m.group(1);
                    fom = fico + generated + nums + "_" + this.data.fgcolor + ".png";
                    this.log("IM", "Creating " + fom);
                    im = this.createImageText(nums, this.data.fgcolor, fom);
                }
                if (im == null) {
                    fim = fico + tp + ".png";
                    fom = fico + generated + tp + "_" + this.data.fgcolor + ".png";
                    this.log("IM", "Creating " + fom);
                    im = this.changeImageColor(fim, this.data.fgcolor, fom);
                }
            }
        } else if (dev.type == "DeviceS20" || (dev.type == "DevicePrimelan" && (dev.subtype == 2 || dev.subtype == 0))) {
            var col = action == "1" ? Color.GREEN : Color.RED;
            fim = fico + tp + ".png";
            fom = fico + generated + tp + "_" + col + ".png";
            this.log("IM", "Creating " + fom);
            im = this.changeImageColor(fim, col, fom);
        } else if (dev.type == "DeviceVirtual" || (dev.type == "DevicePrimelan" && dev.subtype == 1)) {
            fom = fico + generated + action + "_" + this.data.fgcolor + ".png";
            this.log("IM", "Creating " + fom);
            im = this.createImageText(action, this.data.fgcolor, fom);
        }
    } catch (err) {
        this.log("ERRIMAGE", err.message);
        im = null;
    }
    return im;
};

self.alterServerObj = function(o) {
    var devices = [];
    var devs = o.action.hosts;
    for (var k in devs) {
        var d = devs[k];
        var ll,j,sh;
        if (d.sh) {
            ll = {};
            for (j = 0; j < d.sh.length; j++) {
                sh = d.sh[j].split(':')[0];
                ll[sh + ':1'] = 1;
            }
            d.sh = Object.keys(ll);
        }
        if (d.dir) {
            ll = [];
            for (j = 0; j < d.dir.length; j++) {
                sh = d.dir[j].split(':');
                ll.push(sh[0] + ':' + sh[1] + ':1');
            }
            d.dir = ll;
        }
        devices.push(d);
    }
    return devices;
};

self.doOnOk = function() {
    var parsed = self.downloadTCP(self.data.ip,self.data.porttcp,"@25 devicedl",
    function (s) {
        return self.alterServerObj(JSON.parse(s));
    });
    return parsed;
};

// go to the next value by adding or substracting the increment, according to the backward
// setting
self.go = function(obj) {
    try {
        if (obj != null) {
            //this.log("LLLOG_SERVERMESSAGE",serverMessage);
            var scr;
            if ((scr = getActiveScreen()) || (scr = getHomeScreen())) {
                var cont = scr.getCurrentDesktop();
                if (cont) {
                    var k = 0;

                    for (var key = 0; key < obj.length; key++) {
                        var dev = obj[key];
                        this.log("DEV" + key, dev.name + ":" + dev.type);
                        if (dev.name == this.data.device || !this.data.device) {
                            var fld, sfx = "",
                                i = -1,
                                fldname;
                            do {
                                fld = cont.getItemByName(fldname = "d_" + dev.name + sfx);
                                if (!fld)
                                    break;
                                i++;
                                sfx = "" + i;
                            } while (1);
                            var cont2 = this.createfolder(cont, fldname);
                            if (dev.type == "DeviceRM" || dev.type == "DeviceAllOne" || dev.type == "DeviceCT10" ||
                                dev.type == "DeviceUpnpIRTA2" || dev.type == "DeviceUpnpIRRC" || dev.type == "DeviceSamsungCtl") {
                                var remmap = {
                                    "sh": {
                                        "v": {},
                                        "c": this.createfolder(cont2, "@sh")
                                    }
                                };
                                var remnum = 1,remk,remn,parts;
                                for (i = 0; i < dev.dir.length; i++) {
                                    remk = dev.dir[i];
                                    parts = remk.split(':');
                                    remn = parts[0];
                                    var keynm = parts[1];
                                    if (!remmap[remn]) {
                                        remmap[remn] = {
                                            "c": this.createfolder(cont2, remn)
                                        };
                                        remnum++;
                                    }
                                    this.createShortcut(keynm, "@" + k + " emitir " + dev.name + " " + remn + ":" + keynm, remmap[remn].c, dev, keynm);
                                    k++;
                                }
                                for (i = 0; i < dev.sh.length; i++) {
                                    remk = dev.sh[i];
                                    parts = remk.split(':');
                                    remn = "sh";
                                    var shnm = parts[0];
                                    if (!remmap[remn].v[shnm]) {
                                        remmap[remn].v[shnm] = 1;
                                    }
                                    //var intent = new TaskerIntent("LLEmitir");
                                    //intent.addParameter(dev.name);
                                    //intent.addParameter(shnm);
                                    this.createShortcut(shnm, "@" + k + " emitir " + dev.name + " " + shnm, remmap[remn].c, dev, shnm);
                                    k++;
                                }
                            } else if (dev.type == "DeviceVirtual") {
                                for (var st in dev.nicks) {
                                    this.createShortcut(dev.nicks[st], "@" + k + " statechange " + dev.name + " " + st, cont2, dev, st);
                                    k++;
                                }
                            } else if (dev.type == "DevicePrimelan" && dev.subtype == 1) {
                                for (i = 0; i <= 100; i += 10) {
                                    this.createShortcut("" + i, "@" + k + " statechange " + dev.name + " " + i, cont2, dev, "" + i);
                                    k++;
                                }
                            } else if (dev.type == "DeviceS20" || (dev.type == "DevicePrimelan" && (dev.subtype == 2 || dev.subtype == 0))) {
                                this.createShortcut("ON", "@" + k + " statechange " + dev.name + " 1", cont2, dev, "1");
                                k++;
                                this.createShortcut("OFF", "@" + k + " statechange " + dev.name + " 0", cont2, dev, "0");
                                k++;
                            }
                        }
                    }

                } else
                    throw {
                        "message": "cont = null"
                    };
            } else
                throw {
                    "message": "scr = null"
                };

        } else
            throw {
                "message": "serverMessage = null"
            };
    } catch (err) {
        this.log("ERR", err.message);
    } finally {
        this.log("ERR0", "QUI12");
    }
};

self.logData = function(data) {
    alert(data);
    this.log("OUT", data);
};

bindClass("android.app.AlertDialog");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceListView");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceCategory");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceCheckBox");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceText");
bindClass("net.pierrox.lightning_launcher.prefs.LLPreferenceColor");

// this function displays an alert dialog filled with a preference screen
self.showSettings = function(item) {
    var dt = this.data;
    var screen = getActiveScreen();
    var context = screen.getContext();

    // create various preferences
    var prefMainCategory = new LLPreferenceCategory(0, "Main");
    var prefIp = new LLPreferenceText(0, "Ip", dt.ip, dt.ip);
    var prefDevice = new LLPreferenceText(0, "Device", dt.device, dt.device);
    var prefTCPPort = new LLPreferenceText(0, "TCP Port", dt.porttcp+"", dt.porttcp+"");
    var prefUDPPort = new LLPreferenceText(0, "UDP Port", dt.portudp+"", dt.portudp+"");
    var prefIco = new LLPreferenceText(0, "Icon Path", dt.folderico+"", dt.folderico+"");
    var prefColor = new LLPreferenceColor(0, "Color", "Foreground icon color",dt.fgcolor, null,false);
    var prefTasker = new LLPreferenceCheckBox(0, "Tasker", "Use Tasker?", dt.tasker, null);

    // create the list view, it will hold preferences created above
    var listView = new LLPreferenceListView(context, null);

    // assign preferences to the list view
    listView.setPreferences([
        prefMainCategory,
            prefIp,
            prefTCPPort,
            prefUDPPort,
            prefDevice,
            prefColor,
            prefIco,
            prefTasker
    ]);

    // create a dialog and set the list view as the main content view
    var builder=new AlertDialog.Builder(context);
    builder.setView(listView);
    builder.setTitle("Settings");
    builder.setPositiveButton("Save",{onClick:function(dialog,id) {
        try {
            var tcpPort = prefTCPPort.getValue();
            var udpPort = prefUDPPort.getValue();
            var ip = prefIp.getValue();
            var device = prefDevice.getValue();
            var folderico = prefIco.getValue();
            var reIp = Pattern.compile("^[a-zA-Z0-9_\\-\\.]+$");
            var rePort = Pattern.compile("^[0-9]+$");
            var reDevice = Pattern.compile("^[0-9a-zA-Z_\\-]+$");
            var m,v;
            var fields = "";
            if (folderico)
                dt.folderico = folderico;
            else
                fields+=" folder";
            if (!device || ((m = reIp.matcher(device)) && m.find()))
                dt.device = device;
            else
                fileds+=" device";
            if ((m = reIp.matcher(ip)) && m.find())
                dt.ip = ip;
            else
                fileds+=" ip";
            if ((m = rePort.matcher(tcpPort)) && m.find() && (v = parseInt(tcpPort,10))<=65535)
                dt.porttcp = v;
            else
                fileds+=" tcpPort";
            if ((m = rePort.matcher(udpPort)) && m.find() && (v = parseInt(udpPort,10))<=65535)
                dt.portudp = v;
            else
                fileds+=" udpPort";
            if (fields)
                alert("Fields invalid: "+fields);
            dt.fgcolor = prefColor.getColor();
            dt.tasker = prefTasker.isChecked();
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
    var tag = item.getTag(MY_TAG_NAME);
    if(tag == null) {
        this.log("ERR0","TAG not present: creating");
        // no tag: this is a new devicedl, set some default data
        this.data = {
            porttcp: 10001,       // by how much to increment the value
            portudp: 10000,       // by how much to increment the value
            ip: "127.0.0.1",    // add or substract the increment
            fgcolor: Color.MAGENTA,           // display some unit next to the value
            tasker: false,
            folderico: "/storage/emulated/0/TaskerJS/ico",
            device: "na"
        };
    } else {
        this.log("ERR0","TAG PRESENT: "+tag);
        this.data = JSON.parse(tag);
    }
    self.showSettings(item);
};

self.startWorking = function() {
    if (this.data.device !== null) {
        var data;
        if (this.data.tasker) {
            var ti = new TaskerIntent("LLDevicedl");
            sendTaskerIntent(ti, true);
            var vars = getVariables();
            data = vars.getString("LLDevicedl");
            this.data.ip = vars.getString("LLIp");
            this.data.portudp = vars.getInteger("LLPort");
            this.logData(data);
            this.go(JSON.parse(data));
        } else
            this.getDataFromServer();
    }
};

var script = getScriptByPathAndName(null, "commons");
eval(script.getText());

self.createShortcut = function(shnm, txturi, cont, dev, action) {
    var preuri = "udp://" + this.data.ip + ":" + this.data.portudp + "/";
    var intent = new Intent("android.intent.action.SENDTO");
    var im;
    var url = preuri + Uri.encode(txturi);
    intent.setData(Uri.parse(url));
    var p, m;
    if ((p = Pattern.compile("^@[a-z]_([0-9]+)_(.*)")) && (m = p.matcher(action)) && m.find())
        shnm = "@" + m.group(1) + "_" + m.group(2);
    var sh = cont.addShortcut(shnm, intent, 1, 1);
    if ((im = this.getIconImage(dev, action)))
        sh.setDefaultIcon(im);
    return sh;
};

self.loadData();
