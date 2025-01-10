import queue from '../node_modules/async/internal/queue.js';
import wrapAsync from '../node_modules/async/internal/wrapAsync.js';

export function queue2(worker) {
    let _worker = wrapAsync.default(worker);
    return queue((items, cb) => {
        _worker(items[0], cb);
    }, 1, 1);
};