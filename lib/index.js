
import * as fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';

function readdir(dir) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, { withFileTypes: true }, (_, files) => {
            resolve(files);
        });
    });
}
function getStat(file, followSymlinks) {
    return new Promise((resolve) => {
        const statFunc = followSymlinks ? fs.stat : fs.lstat;
        statFunc(file, (_, stats) => {
            resolve(stats);
        });
    });
}
async function* exploreWalkAsync(dir, path, followSymlinks, useStat, shouldSkip) {
    var _a;
    let files = await readdir(path + dir);
    for (const file of files) {
        let name = file.name;
        const filename = dir + '/' + name;
        const relative = filename.slice(1); // Remove the leading /
        const absolute = path + '/' + relative;
        let stat = file;
        if (useStat || followSymlinks) {
            stat = (_a = await getStat(absolute, followSymlinks)) !== null && _a !== void 0 ? _a : stat;
        }
        if (stat.isDirectory()) {
            if (!shouldSkip(relative)) {
                yield { relative, absolute, stat };
                yield* exploreWalkAsync(filename, path, followSymlinks, useStat, shouldSkip);
            }
        }
        else {
            yield { relative, absolute, stat };
        }
    }
}
async function* explore(path, followSymlinks, useStat, shouldSkip) {
    yield* exploreWalkAsync('', path, followSymlinks, useStat, shouldSkip);
}

export class ReaddirGlob extends EventEmitter {
    constructor(cwd) {
        super();
        this.iterator = explore(resolve(cwd || '.'), undefined, undefined, _ => false);
        this.paused = false;
        this.inactive = false;
        this.aborted = false;
        setTimeout(() => this._next());
    }
    _next() {
        if (!this.paused && !this.aborted) {
            this.iterator.next()
                .then((obj) => {
                if (!obj.done) {
                    const isDirectory = obj.value.stat.isDirectory();
                    let relative = obj.value.relative;
                    let absolute = obj.value.absolute;
                    if (undefined && isDirectory) {
                        relative += '/';
                        absolute += '/';
                    }
                    if (undefined) {
                        this.emit('match', { relative, absolute, stat: obj.value.stat });
                    }
                    else {
                        this.emit('match', { relative, absolute });
                    }
                    this._next();
                }
                else {
                    this.emit('end');
                }
            })
                .catch((err) => {
                this.abort();
                this.emit('error', err);
                if (!err.code) {
                    console.error(err);
                }
            });
        }
        else {
            this.inactive = true;
        }
    }
    abort() {
        this.aborted = true;
    }
    pause() {
        this.paused = true;
    }
    resume() {
        this.paused = false;
        if (this.inactive) {
            this.inactive = false;
            this._next();
        }
    }
}
