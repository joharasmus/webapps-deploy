
export function queue(worker, concurrency) {
    var _worker = (0, _wrapAsync2.default)(worker);
    return (0, _queue2.default)((items, cb) => {
        _worker(items[0], cb);
    }, concurrency, 1);
};

var _queue = import('./internal/queue.js');

var _queue2 = _interopRequireDefault(_queue);

var _wrapAsync = import('./internal/wrapAsync.js');

var _wrapAsync2 = _interopRequireDefault(_wrapAsync);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }