
var async = require('async');
var core = require('@actions/core');
var engine = require('zip-stream');
var fs = require('node:fs');
var glob = require('readdir-glob');
var lazystream = require('lazystream');

var Transform = require('readable-stream').Transform;

class Archiver extends Transform {
  constructor() {
    super();

    this.engine = new engine();
    this._statQueue = async.queue(this._onStatQueueTask, 1);
    this.engine.pipe(this);
  }

  _onStatQueueTask(task, callback) {

    fs.lstat(task.filepath, function (_, stats) {

      if (stats.isFile()) {
        task.data.type = 'file';
        task.data.sourceType = 'stream';
        task.source = new lazystream.Readable(_ => fs.createReadStream(task.filepath));
      } else { // is a directory
        task.data.type = 'directory';
        task.data.sourceType = 'buffer';
        task.source = Buffer.alloc(0);
      }

      task.data.stats = stats;

      let fullCallback = () => {
        task.data.callback();
        callback();
      };

      this.engine.entry(task.source, task.data, (_ => setImmediate(fullCallback)).bind(this));
    }.bind(this));
  }
  
  _transform(chunk, _, callback) { return callback(null, chunk); }

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

    let globber = glob(dirpath);
    globber.on('match', onGlobMatch.bind(this));
    globber.on('end', (() => this.engine.finalize()).bind(this));

    return new Promise(_ => this.engine.on('end', _));
  }
}

module.exports = Archiver;
