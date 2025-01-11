
import * as core from '@actions/core';
import * as fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';

function readdir(dir) {
    return new Promise((resolve) =>
        fs.readdir(dir, { withFileTypes: true }, (_, files) => resolve(files))
    );
}

async function* exploreWalkAsync(dir, path) {
    let files = await readdir(path + dir);
    for (const file of files) {
        let name = file.name;
        const filename = dir + '/' + name;
        const relative = filename.slice(1); // Remove the leading /
        const absolute = path + '/' + relative;
        let stat = file;
        if (stat.isDirectory()) {
            yield { relative, absolute, stat };
            yield* exploreWalkAsync(filename, path);
        }
        else {
            yield { relative, absolute, stat };
        }
    }
}

async function* explore(path) {
    yield* exploreWalkAsync('', path);
}

export class ReaddirGlob extends EventEmitter {
    constructor(cwd) {
        super();
        this.iterator = explore(resolve(cwd));
        this.paused = false;
        this.inactive = false;
        setTimeout(() => this._next());
    }
    _next() {
        if (!this.paused) {
            this.iterator.next()
                .then((obj) => {
                if (!obj.done) {
                    let relative = obj.value.relative;
                    let absolute = obj.value.absolute;
                    this.emit('match', { relative, absolute });
                    this._next();
                }
                else {
                    this.emit('end');
                }
            });
        }
        else {
            core.notice("YES");
            this.inactive = true;
        }
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
