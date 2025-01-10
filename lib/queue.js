import queue from '../node_modules/async/internal/queue.js';

import _asyncify from '../node_modules/async/asyncify.js';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let _asyncify2 = _interopRequireDefault(_asyncify);

function isAsync(fn) {
    return fn[Symbol.toStringTag] === 'AsyncFunction';
}

function wrapasync(asyncFn) {
    if (typeof asyncFn !== 'function') throw new Error('expected a function');
    return isAsync(asyncFn) ? (0, _asyncify2.default)(asyncFn) : asyncFn;
}

export function queue2(worker) {
    let _worker = wrapasync(worker);
    return queue((items, cb) => {
        _worker(items[0], cb);
    }, 1, 1);
};