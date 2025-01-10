import queue from '../node_modules/async/internal/queue.js';
import wrapAsync from '../node_modules/async/internal/wrapAsync.js';

function wrapAsync(asyncFn) {
    if (typeof asyncFn !== 'function') throw new Error('expected a function');
    return wrapAsync.isAsync(asyncFn) ? (0, _asyncify2.default)(asyncFn) : asyncFn;
}

export function queue2(worker) {
    let _worker = wrapAsync(worker);
    return queue((items, cb) => {
        _worker(items[0], cb);
    }, 1, 1);
};