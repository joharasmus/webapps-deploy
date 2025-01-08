
var fs = require('node:fs');
var glob = require('readdir-glob');
var async = require('async');
var util = require('archiver-utils');
var core = require('@actions/core');
var engine = require('zip-stream');

var inherits = require('util').inherits;
var Transform = require('readable-stream').Transform;


var Archiver = function() {
  Transform.call(this, {});

  this.engine = new engine();
  this._queue = async.queue(this._onQueueTask.bind(this), 1);
  this._statQueue = async.queue(this._onStatQueueTask.bind(this), 1);
  this.engine.pipe.apply(this.engine, [this]);
};

inherits(Archiver, Transform);

Archiver.prototype._onQueueTask = function(task, callback) {
  var fullCallback = () => {
    task.data.callback();
    callback();
  }

  this.engine.entry(task.source, task.data, function(_) { setImmediate(fullCallback); }.bind(this));
};

Archiver.prototype._onStatQueueTask = function(task, callback) {

  fs.lstat(task.filepath, function(_, stats) {

    if (stats.isFile()) {
      task.data.type = 'file';
      task.data.sourceType = 'stream';
      task.source = util.lazyReadStream(task.filepath);
    } else {  // is a directory
      task.data.type = 'directory';
      task.data.sourceType = 'buffer';
      task.source = Buffer.concat([]);
    }

    task.data.stats = stats;

    if (task.data.name.slice(-1) === '/')
      task.data.type = 'directory';
    
    this._queue.push(task);

    setImmediate(callback);
  }.bind(this));
};

Archiver.prototype._transform = (chunk, _, callback) => callback(null, chunk);

Archiver.prototype.directory = function(dirpath) {

  function onGlobEnd() {
    this.engine.finalize();
  }

  function onGlobMatch(match){
    globber.pause();

    var task = {
      filepath: match.absolute,
      data: {
        name: match.relative,
        callback: globber.resume.bind(globber),
        sourcePath: match.absolute
      }
    };

    this._statQueue.push(task);
  }

  var globber = glob(dirpath);
  globber.on('match', onGlobMatch.bind(this));
  globber.on('end', onGlobEnd.bind(this));

  return new Promise(_ => this.engine.on.apply(this.engine, ['end', _]))
};

module.exports = Archiver;
