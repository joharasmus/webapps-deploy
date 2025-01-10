const _queue = import('../node_modules/async/internal/queue.js');
const _wrapAsync = import('../node_modules/async/internal/wrapAsync.js');

export function queue(worker, concurrency) {
    var _worker = (0, _wrapAsync.default)(worker);
    return (0, _queue.default)((items, cb) => {
        _worker(items[0], cb);
    }, concurrency, 1);
};