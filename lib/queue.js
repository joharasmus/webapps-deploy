

import * as core from '@actions/core';

import _DoublyLinkedList from 'async/internal/DoublyLinkedList.js';

class q {
    onlyOnce(fn) {
        return () => {
            let callFn = fn;
            fn = null;
            callFn();
        };
    }


    constructor(worker) {
        this.worker = worker;
        this.workersList = [];
        this._tasks = new _DoublyLinkedList();
    }
    
    _createCB(task) {
        return () => {            
            this.workersList.shift();
            task.promiseCallback();
            
            this.process();
        };
    }

    push(data) {
        let res;
        let promiseCallback = _ => res();
        
        let item = {
            data,
            promiseCallback
        };
        
        this._tasks.push(item);

        queueMicrotask(_ => this.process());
        
        return new Promise((resolve, _) => res = resolve);
    }
    
    process() {
        if (this._tasks.length) {
            let node = this._tasks.shift();
            this.workersList.push(node);
            
            let cb = this.onlyOnce(this._createCB(node));
            this.worker(node.data, cb);
        }
    }
};

export default q;