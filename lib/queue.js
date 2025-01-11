
import * as core from '@actions/core';

import _DoublyLinkedList from 'async/internal/DoublyLinkedList.js';

class q {
    constructor(worker) {
        this.worker = worker;
    }

    push(data) {
        let res;
        
        let item = {
            data,
            promiseCallback: _ => res()
        };
        
        let cb = () => () => {
            item.promiseCallback();
            this.process();
        };
        this.worker(item.data, cb);
        
        return new Promise((resolve, _) => res = resolve);
    }
};

export default q;