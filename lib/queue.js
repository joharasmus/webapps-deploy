import queue from './queueinner.js';

export function queue2(worker) {
    return queue((items, cb) => {
        worker(items[0], cb);
    });
};