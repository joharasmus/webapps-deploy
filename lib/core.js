
import * as core from '@actions/core';
import * as fs from 'node:fs';
import { ReaddirGlob } from './index.js';
import { Transform, PassThrough } from 'node:stream'
import ZipStream from 'zip-stream';

class Archiver extends Transform {

  constructor() {
    super();

    this.engine = new ZipStream();
    this.engine.pipe(this);
  }

  onTask(task) {

    fs.stat(task.filepath, (_, stats) => {

      if (stats.isFile()) {
        task.data.type = 'file';
        task.source = new PassThrough();
        fs.createReadStream(task.filepath).pipe(task.source);
      } else { // is a directory
        task.data.type = 'directory';
        task.source = Buffer.alloc(0);
      }
  
      task.data.stats = stats;
  
      let fullCallback = () => {
        task.data.callback()
      };
  
      this.engine.entry(task.source, task.data, (_ => setImmediate(fullCallback)));
    });
  }
  
  _transform(chunk, _, callback) { 
    return callback(null, chunk); 
  }

  directory(dirpath) {

    let onGlobMatch = (match) => {
      globber.paused = true;

      let task = {
        filepath: match.absolute,
        data: {
          name: match.relative,
          callback: globber.resume.bind(globber),
          sourcePath: match.absolute
        }
      };

      this.onTask(task);
    }

    let globber = new ReaddirGlob(dirpath);
    globber.on('match', onGlobMatch);
    globber.on('end', () => this.engine.finalize());

    return new Promise(resolve => this.engine.on('end', resolve));
  }
}

export { Archiver };
