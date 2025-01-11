
import * as core from '@actions/core';

import _DoublyLinkedList from 'async/internal/DoublyLinkedList.js';

class q {
    constructor(worker) {
        this.worker = worker;
        this.workersList = [];
        this._tasks = new _DoublyLinkedList();
    }

    push(data) {
        let res;
        
        let item = {
            data,
            promiseCallback: _ => res()
        };
        
        this._tasks.push(item);

        queueMicrotask(_ => this.process());
        
        return new Promise((resolve, _) => res = resolve);
    }
    
    process() {
        if (this._tasks.length) {
            let node = this._tasks.shift();
            this.workersList.push(node);
            
            let cb = () => () => {
                this.workersList.shift();
                node.promiseCallback();
                this.process();
            };
            this.worker(node.data, cb);
        }
    }
};

export default q;