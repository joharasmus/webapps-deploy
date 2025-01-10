

import * as core from '@actions/core';

import _onlyOnce from 'async/internal/onlyOnce.js';

import _DoublyLinkedList from 'async/internal/DoublyLinkedList.js';

class q {

    constructor(worker) {
        this.worker = worker;
        this.workersList = [];
        this._tasks = new _DoublyLinkedList();
    }
    
    _createCB(task) {
        return (err, ...args) => {            
            this.workersList.shift();
            task.promiseCallback(err, ...args);
            
            this.process();
        };
    }

    push(data) {
        let res;
        let promiseCallback = (_, ...args) => res(args[0]);
        
        let item = {
            data,
            promiseCallback
        };
        
        this._tasks.push(item);

        let _setImmediate = () => queueMicrotask(() => (_ => this.process())());
        
        _setImmediate();
        
        return new Promise((resolve, _) => res = resolve);
    }
    
    process() {
        if (this._tasks.length) {
            let node = this._tasks.shift();
            this.workersList.push(node);
            
            let cb = _onlyOnce(this._createCB(node));
            this.worker(node.data, cb);
        }
    }
};

export default q;