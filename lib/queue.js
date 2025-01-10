import queue from '../node_modules/async/internal/queue.js';
import _asyncify from '../node_modules/async/asyncify.js';

function isAsync(fn) {
    return fn[Symbol.toStringTag] === 'AsyncFunction';
}

function wrapasync(asyncFn) {
    return isAsync(asyncFn) ? (0, _asyncify.default)(asyncFn) : asyncFn;
}

export function queue2(worker) {
    let _worker = wrapasync(worker);
    return queue((items, cb) => {
        _worker(items[0], cb);
    }, 1, 1);
};