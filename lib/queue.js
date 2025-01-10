
export default queue;

import * as core from '@actions/core';

import _onlyOnce from 'async/internal/onlyOnce.js';

import _setImmediate from 'async/internal/setImmediate.js';

import _DoublyLinkedList from 'async/internal/DoublyLinkedList.js';

function queue(worker2) {

    let worker = (items, cb) => worker2(items[0], cb);
    let numRunning = 0;
    let workersList = [];
    const events = {
        error: [],
        drain: [],
        saturated: [],
        unsaturated: [],
        empty: []
    };

    function trigger(event) {
        events[event].forEach(handler => handler());
    }

    let processingScheduled = false;
    function _insert(data, callback) {

        let res;
        let promiseCallback = (_, ...args) => res(args[0]); 

        let item = q._createTaskItem(data, callback || promiseCallback);

        q._tasks.push(item);
        
        processingScheduled = true;
        _setImmediate.default(() => {
            processingScheduled = false;
            q.process();
        });

        return new Promise((resolve, _) => {
            res = resolve;
        });
    }

    function _createCB(tasks) {
        return function (err, ...args) {
            numRunning -= 1;

            let task = tasks[0];
            
            workersList.shift();
            task.callback(err, ...args);

            trigger('unsaturated');
            trigger('drain');

            q.process();
        };
    }

    function _maybeDrain(data) { }

    let q = {
        _tasks: new _DoublyLinkedList(),
        _createTaskItem(data, callback) {
            return {
                data,
                callback
            };
        },
        push(data, callback) {
            if (Array.isArray(data)) {
                core.notice("YES");
                if (_maybeDrain(data)) return;
                return data.map(datum => _insert(datum, callback));
            } else {
                core.notice("NO");
            }
            return _insert(data, callback);
        },
        process() {
            while (numRunning < 1 && q._tasks.length) {
                let tasks = [];
                let data = [];

                let node = q._tasks.shift();
                tasks.push(node);
                workersList.push(node);
                data.push(node.data);

                numRunning += 1;

                trigger('empty');
                trigger('saturated');

                let cb = _onlyOnce(_createCB(tasks));
                worker(data, cb);
            }
        },
        idle() {
            return q._tasks.length + numRunning === 0;
        }
    };
    return q;
}