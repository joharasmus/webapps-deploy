
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

  Transform.call(this, util.defaults());

  this._module = new zip();
  this._pointer = 0;

  this._entriesCount = 0;
  this._entriesProcessedCount = 0;
  this._fsEntriesTotalBytes = 0;
  this._fsEntriesProcessedBytes = 0;

  this._queue = async.queue(this._onQueueTask.bind(this), 1);

  this._statQueue = async.queue(this._onStatQueueTask.bind(this), 4);

  this._streams = [];
  this._module.pipe(this);
};

inherits(Archiver, Transform);

Archiver.prototype._append = function(filepath, data) {

  var task = {
    filepath: filepath
  };

  data.sourcePath = filepath;
  task.data = data;
  this._entriesCount++;

  this._statQueue.push(task);
};

Archiver.prototype._finalize = function() { 
  this._module.finalize();
};

Archiver.prototype._moduleAppend = function(source, data, callback) {

  this._module.append(source, data, function(err) {
    this._task = null;

    this.emit('entry', data);
    this._entriesProcessedCount++;

    this._fsEntriesProcessedBytes += data.stats.size;

    this.emit('progress', {
      entries: {
      }
    });

    setImmediate(callback);
  }.bind(this));
};

Archiver.prototype._normalizeEntryData = function(data, stats) {
  data = util.defaults(data, {
    type: 'file',
    name: null,
    date: null,
    mode: null,
    prefix: null,
    sourcePath: null,
    stats: false
  });

  data.stats = stats;
  
  data.name = data.prefix + '/' + data.name;
  data.prefix = null;
  data.name = util.sanitizePath(data.name);
  
  if (data.name.slice(-1) === '/') {
    data.type = 'directory';
  }
  
  data.mode = data.stats.mode & 4095;
  data.date = data.stats.mtime;

  return data;
};

Archiver.prototype._onQueueTask = function(task, callback) {
  var fullCallback = () => {
    task.data.callback();
    callback();
  }

  this._task = task;
  this._moduleAppend(task.source, task.data, fullCallback);
};

Archiver.prototype._onStatQueueTask = function(task, callback) {

  fs.lstat(task.filepath, function(_, stats) {
    
    task = this._updateQueueTaskWithStats(task, stats);
    
    this._fsEntriesTotalBytes += stats.size;    
    this._queue.push(task);

    setImmediate(callback);
  }.bind(this));
};

Archiver.prototype._transform = function(chunk, _, callback) {
  callback(null, chunk);
};

Archiver.prototype._updateQueueTaskWithStats = function(task, stats) {
  if (stats.isFile()) {
    task.data.type = 'file';
    task.data.sourceType = 'stream';
    task.source = util.lazyReadStream(task.filepath);
  } else if (stats.isDirectory()) {
    task.data.name = util.trailingSlashIt(task.data.name);
    task.data.type = 'directory';
    task.data.sourcePath = util.trailingSlashIt(task.filepath);
    task.data.sourceType = 'buffer';
    task.source = Buffer.concat([]);
  }

  task.data = this._normalizeEntryData(task.data, stats);

  return task;
};

Archiver.prototype.directory = function(dirpath) {

  function onGlobEnd() {
    this._finalize();
  }

  function onGlobMatch(match){
    globber.pause();
    var entryData = Object.assign({}, undefined);
    entryData.name = match.relative;
    entryData.prefix = '/';
    entryData.stats = match.stat;
    entryData.callback = globber.resume.bind(globber);

    this._append(match.absolute, entryData);
  }

  var globber = glob(dirpath);
  globber.on('match', onGlobMatch.bind(this));
  globber.on('end', onGlobEnd.bind(this));

  return this;
};


Archiver.prototype.finalize = function() {

  return new Promise((_) => this._module.on('end', _))
};

module.exports = Archiver;
