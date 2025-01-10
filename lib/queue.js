import * as _queue from '../node_modules/async/internal/queue.js';
import * as  wrapAsync from '../node_modules/async/internal/wrapAsync.js';

export function queue(worker, concurrency) {
    var _worker = (0, wrapAsync.default)(worker);
    return (0, _queue.default)((items, cb) => {
        _worker(items[0], cb);
    }, concurrency, 1);
};