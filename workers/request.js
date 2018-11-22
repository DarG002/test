self.addEventListener('message', function(e) {
    loadData(e.data.url);
}, false);

function getJSON(cb, url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.overrideMimeType("application/json");
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            cb(request.responseText);
        } else if (request.status === 404) {
            console.error(request, request.status, request.statusText)
        }
    };
    request.send();
}

function loadData(url) {
    getJSON(function(response) {
        var res = JSON.parse(response);
        // accumulator index
        var i = -1;
        var day = null;
        var data = res.reduce(function (acc, cur) {
            var date = cur.t.split('-');
            var y = date[0];
            var m = date[1];
            var d = date[2];
            if (acc[i] && y + '-' + m === acc[i].t) {
                acc[i].v += cur.v;
                day = d;
            } else {
                // prepare data before new line
                if (acc[i]) { acc[i].v = acc[i].v / parseInt(day); }
                acc.push({ t: y+'-'+m, v: cur.v });
                ++i;
            }
            return acc;
        }, []);
        // no time (
        data[data.length-1].v = data[data.length-1].v / 31;
        postMessage(data);
    }, url);
}
