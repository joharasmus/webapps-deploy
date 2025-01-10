
import queue from './queue.js';
import * as core from '@actions/core';
import * as fs from 'node:fs';
import { ReaddirGlob } from 'readdir-glob';
import { Transform, PassThrough } from 'node:stream'
import ZipStream from 'zip-stream';

class Archiver extends Transform {

  constructor() {
    super();

    this.engine = new ZipStream();
    this.queue = queue;
    this.queue.worker = this.onQueueTask.bind(this);
    this.engine.pipe(this);
  }

  onQueueTask(task, callback) {

    fs.stat(task.filepath, function (_, stats) {

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
        task.data.callback();
        callback();
      };
  
      this.engine.entry(task.source, task.data, (_ => setImmediate(fullCallback)));
    }.bind(this));
  }
  
  _transform(chunk, _, callback) { 
    return callback(null, chunk); 
  }

  directory(dirpath) {

    function onGlobMatch(match) {
      globber.pause();

      let task = {
        filepath: match.absolute,
        data: {
          name: match.relative,
          callback: globber.resume.bind(globber),
          sourcePath: match.absolute
        }
      };

      this.queue.push(task);
    }

    let globber = new ReaddirGlob(dirpath);
    globber.on('match', onGlobMatch.bind(this));
    globber.on('end', (() => this.engine.finalize()).bind(this));

    return new Promise(_ => this.engine.on('end', _));
  }
}

export { Archiver };
