self.getK = function(ep,epdetail) {
    return ep.stagione+"x"+(("0" + ep.episodio).slice(-2));
};

self.passesFilter = function(epObj,ep,epdetail) {
    return parseInt(ep.stagione,10)==self.data.o.stagione;
};

self.getFolderTitle = function() {
    return "S"+(("0" + self.data.o.stagione).slice(-2));
};

self.filterOk = function(filters) {
    var p = Pattern.compile("^([0-9]+)$");
    var m = p.matcher(filters);
    var mo;
    if (m.find() &&
        (mo = parseInt(m.group(1),10))>=1
    )
        return {
            "stagione":mo
        };
    else
        return null;
};
