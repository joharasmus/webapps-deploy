
import * as core from '@actions/core';
import * as fs from 'node:fs';
import { ReaddirGlob } from './index.js';
import { Transform, PassThrough } from 'node:stream'
import ZipStream from './indexzip.js';

class Archiver extends Transform {

  constructor() {
    super();

    this.engine = new ZipStream();
    this.engine.pipe(this);
  }

  onData(data) {

    fs.stat(data.sourcePath, (_, stats) => {

      if (stats.isFile()) {
        data.type = 'file';
        data.source = new PassThrough();
        fs.createReadStream(data.sourcePath).pipe(data.source);
      } else { // is a directory
        data.type = 'directory';
        data.source = Buffer.alloc(0);
      }
  
      data.stats = stats;
  
      this.engine.entry(data.source, data, (_ => data.globber.resume()));
    });
  }
  
  _transform(chunk, _, callback) { 
    return callback(null, chunk); 
  }

  directory(dirpath) {

    let onGlobMatch = (match) => {
      globber.paused = true;

      let data = {
        globber: globber,
        name: match.relative,
        sourcePath: match.absolute
      };

      this.onData(data);
    }

    let globber = new ReaddirGlob(dirpath);
    globber.on('match', onGlobMatch);
    globber.on('end', () => this.engine.finish());

    return new Promise(resolve => this.engine.on('end', resolve));
  }
}

export { Archiver };
