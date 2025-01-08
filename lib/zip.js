var engine = require('zip-stream');
var util = require('archiver-utils');

/**
 * @constructor
 * @param {ZipOptions} [options]
 */
var Zip = function(options) {
  if (!(this instanceof Zip)) {
    return new Zip(options);
  }

  options = this.options = util.defaults(options, {
    comment: '',
    forceUTC: false,
    namePrependSlash: false,
    store: false
  });

  this.engine = new engine(options);
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

/**
 * @return void
 */
Zip.prototype.finalize = function() {
  this.engine.finalize();
};

/**
 * @return this.engine
 */
Zip.prototype.on = function() {
  return this.engine.on.apply(this.engine, arguments);
};

/**
 * @return this.engine
 */
Zip.prototype.pipe = function() {
  return this.engine.pipe.apply(this.engine, arguments);
};

module.exports = Zip;

/**
 * @typedef {Object} ZipOptions
 * @global
 * @property {String} [comment] Sets the zip archive comment.
 * @property {Boolean} [forceLocalTime=false] Forces the archive to contain local file times instead of UTC.
 * @property {Boolean} [forceZip64=false] Forces the archive to contain ZIP64 headers.
 * @property {Boolean} [namePrependSlash=false] Prepends a forward slash to archive file paths.
 * @property {Boolean} [store=false] Sets the compression method to STORE.
 * @property {Object} [zlib] Passed to [zlib]{@link https://nodejs.org/api/zlib.html#zlib_class_options}
 * to control compression.
 * @property {*} [*] See [zip-stream]{@link https://archiverjs.com/zip-stream/ZipStream.html} documentation for current list of properties.
 */

/**
 * @typedef {Object} ZipEntryData
 * @global
 * @property {String} name Sets the entry name including internal path.
 * @property {(String|Date)} [date=NOW()] Sets the entry date.
 * @property {Number} [mode=D:0755/F:0644] Sets the entry permissions.
 * @property {Boolean} [namePrependSlash=ZipOptions.namePrependSlash] Prepends a forward slash to archive file paths.
 * @property {String} [prefix] Sets a path prefix for the entry name. Useful
 * when working with methods like `directory` or `glob`.
 * @property {fs.Stats} [stats] Sets the fs stat data for this entry allowing
 * for reduction of fs stat calls when stat data is already known.
 */
