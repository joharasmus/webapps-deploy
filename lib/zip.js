var engine = require('zip-stream');

/**
 * @constructor
 */
var Zip = function() {
  this.engine = new engine();
};

/**
 * @param  {(Buffer|Stream)} source
 * @param  {ZipEntryData} data
 * @param  {Function} callback
 * @return void
 */
Zip.prototype.append = function(source, data, callback) {
  this.engine.entry(source, data, callback);
};

Zip.prototype.finalize = function() {
  this.engine.finalize();
};

Zip.prototype.on = function() {
  return this.engine.on.apply(this.engine, arguments);
};

Zip.prototype.pipe = function() {
  return this.engine.pipe.apply(this.engine, arguments);
};

module.exports = Zip;

/**
 * @typedef {Object} ZipEntryData
 * @global
 * @property {String} name Sets the entry name including internal path.
 * @property {fs.Stats} [stats] Sets the fs stat data for this entry allowing
 * for reduction of fs stat calls when stat data is already known.
 */
