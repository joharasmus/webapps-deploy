
export default queue;

import * as core from '@actions/core';

import _onlyOnce from 'async/internal/onlyOnce.js';

import _setImmediate from 'async/internal/setImmediate.js';

import _DoublyLinkedList from 'async/internal/DoublyLinkedList.js';

function queue(worker2) {

    let worker = (items, cb) => worker2(items[0], cb);
    let workersList = [];

    function _insert(data) {

        let res;
        let promiseCallback = (_, ...args) => res(args[0]);

        let item = {
            data,
            promiseCallback
        };

        q._tasks.push(item);
        
        _setImmediate.default(() => {
            q.process();
        });

        return new Promise((resolve, _) => res = resolve);
    }

    function _createCB(task) {
        return function (err, ...args) {            
            workersList.shift();
            task.promiseCallback(err, ...args);

            q.process();
        };
    }

    let q = {
        _tasks: new _DoublyLinkedList(),
        push(data) {
            return _insert(data);
        },
        process() {
            if (q._tasks.length) {
                let data = [];

                let node = q._tasks.shift();
                workersList.push(node);
                data.push(node.data);

                let cb = _onlyOnce(_createCB(node));
                worker(data, cb);
            }
        }
    };
    return q;
}