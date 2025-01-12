
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
        if (file.isDirectory()) {
            yield { relative, absolute };
            yield* exploreWalkAsync(filename, path);
        }
        else {
            yield { relative, absolute };
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
                    let relative = obj.value.relative;
                    let absolute = obj.value.absolute;
                    this.emit('match', obj.value);
                    this._next();
                }
                else {
                    this.emit('end');
                }
            });
        }
        else {
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
