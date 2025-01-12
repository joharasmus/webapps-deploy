
import * as core from '@actions/core';
import * as fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';

async function* exploreWalkAsync(dir, path) {
    let retFiles;
    fs.readdir(path + dir, { withFileTypes: true }, (_, files) => retFiles = files);

    for (const file of retFiles) {
        const filename = dir + '/' + file.name;
        const relative = filename.slice(1); // Remove the leading /
        const absolute = path + filename;
        yield { relative, absolute };
        if (file.isDirectory()) {
            yield* exploreWalkAsync(filename, path);
        }
    }
}

export class ReaddirGlob extends EventEmitter {
    constructor(cwd) {
        super();
        this.iterator = exploreWalkAsync('', resolve(cwd));
        this.paused = false;
        setTimeout(() => this._next());
    }
    _next() {
        if (this.paused)
            return;

        this.iterator.next().then((obj) => {
            if (!obj.done) {
                this.emit('match', obj.value);
                this._next();
                return;
            }
            this.emit('end');
        });
    }
    resume() {
        this.paused = false;
        this._next();
    }
}
