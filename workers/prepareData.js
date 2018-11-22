self.addEventListener('message', function(e) {
    prepareData(e.data.list, e.data.type);
}, false);

function prepareData(data, type) {
    switch (type) {
        case 'byYear':
            prepareDataByYear(data);
            break;
        case 'byMonth':
            prepareDataByMonth(data);
            break;
        case 'default':
        default:
            prepareDataSimple(data);
            break;
    }
}

var prepareDataSimple = function(data) {
    var ret = data.map(function(e) { return e.v });
    postMessage(ret);
}

var prepareDataByYear = function(data) {
    var prev;
    var collector = 0;
    var ret = data.reduce(function (acc, cur) {
        var date = cur.t.split('-');
        var y = parseInt(date[0]);
        if (prev !== y ) {
            acc.push(collector / 12);
            collector = 0;
        }
        else { collector += cur.v }
        prev = y;
        return acc;
    }, []);
    postMessage(ret);
}

var prepareDataByMonth = function(data) {
    var len = data.length;
    var ret = data.reduce(function (acc, cur) {
        var date = cur.t.split('-');
        var m = parseInt(date[1]) - 1;
        if (acc[m]) {
            acc[m] += cur.v
        } else {
            acc.push(cur.v)
        }
        return acc;
    }, []);
    ret = ret.map(function(e) { return e / (len / 12) });
    postMessage(ret);
}
