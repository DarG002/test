self.addEventListener('message', function(e) {
    prepareYearsList(e.data.list);
}, false);

function prepareYearsList(data) {
    var years = data.reduce(function (acc, cur) {
        var date = cur.t.split('-');
        var y = parseInt(date[0]);
        if (acc.indexOf(y) === -1) { acc.push(y) }
        return acc;
    }, []);
    postMessage(years);
}
