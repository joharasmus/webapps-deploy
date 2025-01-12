
import * as core from '@actions/core';
import * as fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';

async function* exploreWalkAsync(dir, path) {
    let files = await new Promise(resolve => 
        fs.readdir(path + dir, { withFileTypes: true }, (_, files) => resolve(files)));

    for (const file of files) {
        let name = file.name;
        const filename = dir + '/' + name;
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
        this.inactive = false;
        setTimeout(() => this._next());
    }
    _next() {
        if (!this.paused) {
            this.iterator.next()
                .then((obj) => {
                if (!obj.done) {
                    this.emit('match', obj.value);
                    this._next();
                }
                else {
                    this.emit('end');
                }
            });
        }
    }
    pause() {
        this.inactive = true;
        this.paused = true;
    }
    resume() {
        this.paused = false;
        this.inactive = false;
        this._next();
    }
}
