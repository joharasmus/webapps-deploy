
var fs = require('node:fs');
var glob = require('readdir-glob');
var async = require('async');
var util = require('archiver-utils');
var zip = require('./zip');
var core = require('@actions/core');

var inherits = require('util').inherits;
var Transform = require('readable-stream').Transform;


var Archiver = function() {
  if (!(this instanceof Archiver)) {
    return new Archiver();
  }

  Transform.call(this, {});

  this._module = new zip();
  this._queue = async.queue(this._onQueueTask.bind(this), 1);
  this._statQueue = async.queue(this._onStatQueueTask.bind(this), 1);
  this._module.pipe(this);
};

inherits(Archiver, Transform);

Archiver.prototype._onQueueTask = function(task, callback) {
  var fullCallback = () => {
    task.data.callback();
    callback();
  }

  this._module.append(task.source, task.data, function(_) { setImmediate(fullCallback); }.bind(this));
};

Archiver.prototype._onStatQueueTask = function(task, callback) {

  fs.lstat(task.filepath, function(_, stats) {

    if (stats.isFile()) {
      task.data.type = 'file';
      task.data.sourceType = 'stream';
      task.source = util.lazyReadStream(task.filepath);
    } else if (stats.isDirectory()) {
      task.data.type = 'directory';
      task.data.sourcePath = task.filepath;
      task.data.sourceType = 'buffer';
      task.source = Buffer.concat([]);
    }
  
    task.data = util.defaults(task.data, {
      type: 'file',
      name: null,
      sourcePath: null,
      stats: false
    })

    task.data.stats = stats;
    task.data.name = '/' + task.data.name;

    if (task.data.name.slice(-1) === '/')
      task.data.type = 'directory';
    
    this._queue.push(task);

    setImmediate(callback);
  }.bind(this));
};

Archiver.prototype._transform = (chunk, _, callback) => callback(null, chunk);

Archiver.prototype.directory = function(dirpath) {

  function onGlobEnd() {
    this._module.finalize();
  }

  function onGlobMatch(match){
    globber.pause();

    var entryData = {
      name: match.relative,
      stats: match.stat,
      callback: globber.resume.bind(globber),
      sourcePath: match.absolute
    };

    var task = {
      filepath: match.absolute,
      data: entryData
    };

    this._statQueue.push(task);
  }

  var globber = glob(dirpath);
  globber.on('match', onGlobMatch.bind(this));
  globber.on('end', onGlobEnd.bind(this));

  return new Promise(_ => this._module.on('end', _))
};

module.exports = Archiver;
