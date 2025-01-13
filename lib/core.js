
import * as core from '@actions/core';
import * as fs from 'node:fs';
import { ReaddirGlob } from './index.js';
import { Transform, PassThrough } from 'node:stream'
import { ZipArchiveOutputStream } from "./lib/archivers/zip-archive-output-stream.js";
import { ZipArchiveEntry } from "./lib/archivers/zip-archive-entry.js";

export class Archiver extends Transform {

  constructor() {
    super();

    this.engine = new ZipArchiveOutputStream();
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
        data.name += "/"
      }

      const entry = new ZipArchiveEntry(data.name);
      entry.setTime(new Date());

      if (data.type === "directory")
        entry.setMethod(0);
      
      this.engine.entry(entry, data.source, (_ => data.globber.resume()));
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
