import queue from './queueinner.js';
import * as core from '@actions/core';

export function queue2(worker) {
    return queue((items, cb) => {
        worker(items[0], cb);
    }, 1, 1);
};