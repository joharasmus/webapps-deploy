
let async = require('async');
let core = require('@actions/core');
import ZipStream from 'zip-stream';
let fs = require('node:fs');
let ReadDirGlob = require('readdir-glob').ReaddirGlob;
let lazystream = require('lazystream');

let Transform = require('readable-stream').Transform;

class Archiver extends Transform {

  constructor() {
    super();

    this.engine = new ZipStream();
    this.queue = async.queue(this.onQueueTask.bind(this), 1);
    this.engine.pipe(this);
  }

  onQueueTask(task, callback) {

    fs.stat(task.filepath, this.engineer.bind(this));
  }

  engineer (_, stats) {

    if (stats.isFile()) {
      task.data.type = 'file';
      task.source = new lazystream.Readable(_ => fs.createReadStream(task.filepath));
    } else { // is a directory
      task.data.type = 'directory';
      task.source = Buffer.alloc(0);
    }

    task.data.stats = stats;

    let fullCallback = () => {
      task.data.callback();
      callback();
    };

    this.engine.entry(task.source, task.data, (_ => setImmediate(fullCallback)).bind(this));
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

      this._statQueue.push(task);
    }

    let globber = new ReadDirGlob(dirpath);
    globber.on('match', onGlobMatch.bind(this));
    globber.on('end', (() => this.engine.finalize()).bind(this));

    return new Promise(_ => this.engine.on('end', _));
  }
}

module.exports = Archiver;
