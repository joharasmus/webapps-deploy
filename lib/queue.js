import { queue } from '../node_modules/async/internal/queue.js';
import wrapAsync from '../node_modules/async/internal/wrapAsync.js';

export function queue2(worker, concurrency) {
    var _worker = (0, wrapAsync.default)(worker);
    return (0, queue.default)((items, cb) => {
        _worker(items[0], cb);
    }, concurrency, 1);
};