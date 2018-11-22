'use strict';

var DB_NAME = 'statistics';
var STORE_NAMES = ['temperature', 'precipitation'];

// import main module
var $main = (function() {

    var api = {};
    var idb = {
        version: 1,
        _store: null,
        set store(val) {
            this._store = val
        },
        get store() {
            return this._store
        }
    };

    api.request = function(cb, url) {
        workers(function(e) {
            cb(e.data);
        }, { url: 'workers/request.js', message: { url: url } });
    };

    idb.create = function(cb, ver) {
        if (ver === undefined) { ver = this.version }

        var request = indexedDB.open(DB_NAME, ver);

        request.onerror = function(error) { cb(error) };

        request.onupgradeneeded = function(e) {
            STORE_NAMES.forEach(function(storeName) {
                e.target.result.createObjectStore(storeName, { keyPath : 't' });
            });
            e.target.result.createObjectStore('years', { autoIncrement:true });
        };

        request.onsuccess = function(e) {
            idb.store = request.result;
            cb(e);
        };
    };

    idb.getNamedStore = function(cb, storeName) {
        if (this.store.objectStoreNames.contains(storeName)) {
            var transaction = this.store.transaction([storeName], 'readonly');
            cb(transaction.objectStore(storeName));
        }
    };

    // year list for select options
    idb.getYearsList = function(cb, data) {
        workers(function(e) {
            cb(e.data);
        }, { url: 'workers/prepareYearsList.js', message: { list: data } });
    };

    // props { storeName, url }
    idb.storeData = function(cb, props) {
        api.request(function(data) {
            setData(cb, { storeName: props.storeName, data: data });
        }, props.url)
    };

    // props { range: { start, end }, store }
    idb.getData = function(cb, params) {
        var keyRangeValue = IDBKeyRange.bound(params.range.start, params.range.end + '\uffff');
        var transaction = this.store.transaction([params.store], 'readonly');
        var objectStore = transaction.objectStore(params.store);
        var data = [];

        objectStore.openCursor(keyRangeValue).onsuccess = function(event) {
            var cursor = event.target.result;
            if(cursor) {
                data.push(cursor.value);
                cursor.continue();
            }
        };
        transaction.oncomplete = function() {
            cb(data);
        }
    };

    idb.prepareData = function(cb, props) {
        workers(function(e) {
            cb(e.data);
        }, { url: 'workers/prepareData.js', message: { list: props.data, type: props.type } });
    };

    // props { url, message }
    function workers(cb, props) {
        if(typeof(Worker) !== 'undefined') {
            var worker = new Worker(props.url);
            worker.postMessage(props.message);
            worker.onmessage = function(e) {
                cb(e);
                worker.terminate();
            };
        } else {
            console.error('Not support Web Workers');
        }
    }

    // props { storeName, data }
    function setData(cb, props) {
        var transaction = idb.store.transaction([props.storeName], 'readwrite');
        var objectStore = transaction.objectStore(props.storeName);
        for (var i = 0, len = props.data.length; i < len; i++) {
            objectStore.put(props.data[i]);
        }
        transaction.oncomplete = function(e) {
            if (cb && e.type === 'complete') { cb() }
        }
    }

    return { api: api, idb: idb };
}());
