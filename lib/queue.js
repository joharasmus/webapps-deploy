
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

    function on(event, handler) {
        events[event].push(handler);
    }

    function once(event, handler) {
        const handleAndRemove = (...args) => {
            off(event, handleAndRemove);
            handler(...args);
        };
        events[event].push(handleAndRemove);
    }

    function off(event, handler) {
        if (!event) return Object.keys(events).forEach(ev => events[ev] = []);
        if (!handler) return events[event] = [];
        events[event] = events[event].filter(ev => ev !== handler);
    }

    function trigger(event, ...args) {
        events[event].forEach(handler => handler(...args));
    }

    let processingScheduled = false;
    function _insert(data, callback) {

        let res;
        function promiseCallback(err, ...args) {
            // we don't care about the error, let the global error handler
            // deal with it
            if (err) return res();
            if (args.length <= 1) return res(args[0]);
            res(args);
        }

        let item = q._createTaskItem(data, callback || promiseCallback);

        q._tasks.push(item);
        
        if (!processingScheduled) {
            processingScheduled = true;
            _setImmediate.default(() => {
                processingScheduled = false;
                q.process();
            });
        }

        if (false || !callback) {
            return new Promise((resolve, _) => {
                res = resolve;
            });
        }
    }

    function _createCB(tasks) {
        return function (err, ...args) {
            numRunning -= 1;

            for (let i = 0, l = tasks.length; i < l; i++) {
                let task = tasks[i];

                let index = workersList.indexOf(task);
                if (index === 0) {
                    workersList.shift();
                } else if (index > 0) {
                    workersList.splice(index, 1);
                }

                task.callback(err, ...args);
            }

            if (numRunning <= 0.75) {
                trigger('unsaturated');
            }

            if (q.idle()) {
                trigger('drain');
            }
            q.process();
        };
    }

    function _maybeDrain(data) {
        if (data.length === 0 && q.idle()) {
            // call drain immediately if there are no tasks
            _setImmediate.default(() => trigger('drain'));
            return true;
        }
        return false;
    }

    const eventMethod = name => handler => {
        if (!handler) {
            return new Promise((resolve, reject) => {
                once(name, (err, data) => {
                    if (err) return reject(err);
                    resolve(data);
                });
            });
        }
        off(name);
        on(name, handler);
    };

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
                if (_maybeDrain(data)) return;
                return data.map(datum => _insert(datum, callback));
            }
            return _insert(data, callback);
        },
        process() {
            while (numRunning < 1 && q._tasks.length) {
                let tasks = [],
                    data = [];
                
                core.notice(q._tasks.length);
                let l = Math.min(q._tasks.length, 1);

                for (let i = 0; i < l; i++) {
                    let node = q._tasks.shift();
                    tasks.push(node);
                    workersList.push(node);
                    data.push(node.data);
                }

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
    // define these as fixed properties, so people get useful errors when updating
    Object.defineProperties(q, {
        saturated: {
            writable: false,
            value: eventMethod('saturated')
        },
        unsaturated: {
            writable: false,
            value: eventMethod('unsaturated')
        },
        empty: {
            writable: false,
            value: eventMethod('empty')
        },
        drain: {
            writable: false,
            value: eventMethod('drain')
        }
    });
    return q;
}