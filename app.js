'use strict';

var TYPES = {
    SUCCESS: 'success',
    UPGRADENEEDED: 'upgradeneeded'
};

var RADIO_TYPES = {
    DEFAULT: 'default',
    BY_YEAR: 'byYear',
    BY_MONTH: 'byMonth'
};

var app = document.getElementById('app');

// containers init
var container, canvasContainer, rightCol, leftCol;
var context;

var startDate = 1881;
var endDate = 2006;
var activeStore = 'temperature';
var type = RADIO_TYPES.DEFAULT;

var width = 900;
var height = 300;

var loading = true;

(function() {
	function init() {
        $main.idb.create(dbInit);

        container = app.appendChild(createNode('div', { class: 'container' }));
        var row = container.appendChild(createNode('div', { class: 'row' }));
        leftCol = row.appendChild(createNode('div', { class: 'col btn-group' }));
        STORE_NAMES.forEach(function(store) {
            var btn = leftCol.appendChild(createNode('button', { html: store, class: 'btn' }));
            btn.dataset.store = store;
            btn.addEventListener('click', changeHandler);
        });
        rightCol = row.appendChild(createNode('div', { class: 'col' }));
        radioInit();
        canvasInit();
	}
	init();
}());

function dbInit(e) {
    if (e.type && e.type === TYPES.SUCCESS) {
        checkData(function() {
            $main.idb.getData(function(result) {
                $main.idb.prepareData(chartDraw, { data: result, type: type });
                $main.idb.getYearsList(selectInit, result);
            }, { store: activeStore, range: { start: startDate, end: endDate } });
        }, activeStore);
    }
}

function selectInit(list) {
    var selectCont = rightCol.insertBefore(createNode('div'), canvasContainer);
    var selectStartDate = selectCont.appendChild(createNode('select')),
        selectEndDate = selectCont.appendChild(createNode('select'));

    list.forEach(function(year) {
        selectStartDate.appendChild(createNode('option', { html: year, attr: { value: year } }));
        selectEndDate.appendChild(createNode('option', { html: year, attr: { value: year } }));
    });
    selectEndDate.lastChild.setAttribute('selected', 'selected');

    selectStartDate.addEventListener('change', function(e) {
        if (endDate > e.target.value) { startDate = e.target.value; }
        drawData(activeStore,{ start: startDate, end: endDate });
    });
    selectEndDate.addEventListener('change', function(e) {
        if (startDate <= e.target.value) { endDate = e.target.value; }
        drawData(activeStore,{ start: startDate, end: endDate });
    });
}

function radioInit() {
    var div = leftCol.appendChild(createNode('div', { class: 'radio' }));
    div = leftCol.appendChild(createNode('div'));

    var dafault = div.appendChild(createNode('input', { attr: { type: 'radio', name: 'type', value: RADIO_TYPES.DEFAULT } }));
    div.appendChild(createNode('label', { attr: { for: RADIO_TYPES.DEFAULT }, html: 'default' }));
    div = leftCol.appendChild(createNode('div'));

    var byMonth = div.appendChild(createNode('input', { attr: { type: 'radio', name: 'type', value: RADIO_TYPES.BY_MONTH } }));
    div.appendChild(createNode('label', { attr: { for: RADIO_TYPES.BY_MONTH }, html: 'by month' }));
    div = leftCol.appendChild(createNode('div'));

    var byYear = div.appendChild(createNode('input', { attr: { type: 'radio', name: 'type', value: RADIO_TYPES.BY_YEAR } }));
    div.appendChild(createNode('label', { attr: { for: RADIO_TYPES.BY_YEAR }, html: 'by year' }));

    dafault.addEventListener('click', handleSelectType);
    byMonth.addEventListener('click', handleSelectType);
    byYear.addEventListener('click', handleSelectType);
}

function handleSelectType(e) {
    type = e.target.value;
    drawData(activeStore,{ start: startDate, end: endDate });
}

// handler click button
function changeHandler(e) {
    activeStore = e.target.dataset.store;
    drawData(activeStore,{ start: startDate, end: endDate });
}

function drawData(store, range) {
    // set data before draw (if needed)
    checkData(function() {
        $main.idb.getData(function(result) {
            $main.idb.prepareData(chartDraw, { data: result, type: type });
        }, { store: store, range: range});
    }, store);
}

function checkData(cb, store) {
    $main.idb.getNamedStore(function(objectStore) {
        var countRequest = objectStore.count();
        countRequest.onsuccess = function() {
            if (countRequest.result === 0) { $main.idb.storeData(cb, { storeName: store, url: 'http://api.generatorlp.ru/' + store }); }
            else { cb(); }
        }
    }, store);
}

function canvasInit() {
    canvasContainer = createNode('canvas');
    rightCol.appendChild(canvasContainer);

    context = canvasContainer.getContext('2d');
    canvasContainer.width = width;
    canvasContainer.height = height;

    context.translate(0, height);
    context.scale(1, -1);
    context.fillStyle = '#eee';
    context.fillRect(0, 0, width, height);
}

function chartDraw(data) {
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);

    var max = data.reduce(function(a, b) {
        return Math.max(a, b);
    });

    var padding = 40;
    var ratio = ((height - padding) / max) / 2;

    var prepareX = function(item) {
        return item * ratio.toFixed() + (height / 2);
    };

    var left = 0;
    var pos = prepareX(data[0]);
    var move = width / data.length;

    for(var i = 0, len = data.length; i < len; i++) {
        var oX = prepareX(data[i]);

        context.beginPath();
        context.moveTo(left, pos);
        context.lineTo(left + move, oX);
        context.lineWidth = 1;
        context.stroke();

        pos = oX;
        left += move;
    }
}

function createNode(tag, props) {
    var node = document.createElement(tag);
    // property element
    if (props) {
        props.class && props.class.split(' ').forEach(function (classItem) {
            node.classList.add(classItem);
        });
        if (props.html) { node.innerHTML = props.html }
        if (props.attr) {
            for (var key in props.attr) {
                node.setAttribute(key, props.attr[key]);
            }
        }
    }
    return node;
}
