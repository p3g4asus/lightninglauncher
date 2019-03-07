self.superPassesFilter = self.passesFilter;
self.passesFilter = function(epObj,ep,epdetail) {
    return self.superPassesFilter(epObj,ep,epdetail) && epObj.dur>30;
};
