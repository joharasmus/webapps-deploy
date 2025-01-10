

import * as core from '@actions/core';

import _onlyOnce from 'async/internal/onlyOnce.js';

import _setImmediate from 'async/internal/setImmediate.js';

import _DoublyLinkedList from 'async/internal/DoublyLinkedList.js';

let q = {
    worker,
    
    workersList: [],
    
    _createCB(task) {
        return function (err, ...args) {            
            q.workersList.shift();
            task.promiseCallback(err, ...args);
            
            q.process();
        };
    },
    
    _tasks: new _DoublyLinkedList(),
    
    push(data) {
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
    },
    
    process() {
        if (q._tasks.length) {
            let node = q._tasks.shift();
            q.workersList.push(node);
            
            let cb = _onlyOnce(q._createCB(node));
            q.worker(node.data, cb);
        }
    }
};

export default q;