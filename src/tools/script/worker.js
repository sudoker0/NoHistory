onmessage = async (e) => {
    console.log("test");
    var output = [];
    var urlList = e.data[0];
    var patternList = e.data[1];
    var all_history = e.data[2];
    var from = e.data[3];
    var to = e.data[4];
    all_history.forEach(v => {
        if (v.lastVisitTime < from || to < v.lastVisitTime)
            return;
        if (urlList.indexOf(new URL(v.url).hostname) >= 0 || patternList.filter(f => {
            switch (f.type) {
                case "string":
                    return v.title.indexOf(`${f.pattern}`) != -1;
                case "regex":
                    return v.title.match(f.pattern) != null;
                default:
                    return false;
            }
        }).length > 0) {
            output.push(v);
        }
    });
    postMessage({
        total: all_history.length,
        output: output
    });
};
//# sourceMappingURL=worker.js.map