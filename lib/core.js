
var fs = require('node:fs');
var glob = require('readdir-glob');
var async = require('async');
var lazystream = require('lazystream');
var core = require('@actions/core');
var engine = require('zip-stream');

var inherits = require('util').inherits;
var Transform = require('readable-stream').Transform;

class Archiver extends Transform {
  constructor() {
    Transform.call(this, {});

    this.engine = new engine();
    this._statQueue = async.queue(this._onStatQueueTask.bind(this), 1);
    this.engine.pipe.apply(this.engine, [this]);
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

      this.engine.entry(task.source, task.data, function (_) { setImmediate(fullCallback); }.bind(this));
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

    return new Promise(_ => this.engine.on.apply(this.engine, ['end', _]));
  }
}

module.exports = Archiver;
