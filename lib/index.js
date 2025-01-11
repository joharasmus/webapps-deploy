
import * as fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';

function readdir(dir, strict) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, { withFileTypes: true }, (err, files) => {
            if (err) {
                switch (err.code) {
                    case 'ENOTDIR': // Not a directory
                        if (strict) {
                            reject(err);
                        }
                        else {
                            resolve([]);
                        }
                        break;
                    case 'ENOTSUP': // Operation not supported
                    case 'ENOENT': // No such file or directory
                    case 'ENAMETOOLONG': // Filename too long
                    case 'UNKNOWN':
                        resolve([]);
                        break;
                    case 'ELOOP': // Too many levels of symbolic links
                    default:
                        reject(err);
                        break;
                }
            }
            else {
                resolve(files);
            }
        });
    });
}
function getStat(file, followSymlinks) {
    return new Promise((resolve) => {
        const statFunc = followSymlinks ? fs.stat : fs.lstat;
        statFunc(file, (err, stats) => {
            if (err) {
                switch (err.code) {
                    case 'ENOENT':
                        if (followSymlinks) {
                            // Fallback to lstat to handle broken links as files
                            resolve(getStat(file, false));
                        }
                        else {
                            resolve(null);
                        }
                        break;
                    default:
                        resolve(null);
                        break;
                }
            }
            else {
                resolve(stats);
            }
        });
    });
}
async function* exploreWalkAsync(dir, path, followSymlinks, useStat, shouldSkip, strict) {
    var _a;
    let files = await readdir(path + dir, strict);
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
                yield* exploreWalkAsync(filename, path, followSymlinks, useStat, shouldSkip, false);
            }
        }
        else {
            yield { relative, absolute, stat };
        }
    }
}
async function* explore(path, followSymlinks, useStat, shouldSkip) {
    yield* exploreWalkAsync('', path, followSymlinks, useStat, shouldSkip, true);
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
