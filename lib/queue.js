
import * as core from '@actions/core';

import _DoublyLinkedList from 'async/internal/DoublyLinkedList.js';

class q {
    constructor(worker) {
        this.worker = worker;
    }

    push(data) {
        let res;
        
        let cb = () => () => {
            _ => res();
        };
        this.worker(data, cb);
        
        return new Promise(resolve => res = resolve);
    }
};

export default q;