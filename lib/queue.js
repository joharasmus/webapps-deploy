import queue from '../node_modules/async/internal/queue.js';
import _asyncify from '../node_modules/async/asyncify.js';
import * as core from '@actions/core';

function isAsync(fn) {
    return fn[Symbol.toStringTag] === 'AsyncFunction';
}

function wrapasync(asyncFn) {
    return asyncFn;
}

export function queue2(worker) {
    let _worker = wrapasync(worker);
    return queue((items, cb) => {
        worker(items[0], cb);
    }, 1, 1);
};