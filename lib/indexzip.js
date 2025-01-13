
import * as core from '@actions/core';
import { ZipArchiveOutputStream, ZipArchiveEntry } from "compress-commons";


export default class ZipStream extends ZipArchiveOutputStream {
  /**
   * @constructor
   * @extends external:ZipArchiveOutputStream
   * @param {Object} [options]
   * @param {Object} [options.zlib] Passed to [zlib]{@link https://nodejs.org/api/zlib.html#zlib_class_options}
   * to control compression.
   */
  constructor(options) {
    options = {};
    options.zlib = {};
    super(options);
  }

  _normalizeFileData(data) {
    data = {
      comment: "",
      name: data.name,
      namePrependSlash: false,
      source: data.source,
      stats: data.stats,
      store: false,
      type: data.type
    };
    if (data.type === "directory") {
      data.name += "/";
      data.store = true;
    }
    data.date = new Date();
    return data;
  }

  /**
   * Appends an entry given an input source (text string, buffer, or stream).
   *
   * @param  {(Buffer|Stream|String)} source The input source.
   * @param  {Object} data
   * @param  {String} data.name Sets the entry name including internal path.
   * @param  {String} [data.comment] Sets the entry comment.
   * @param  {(String|Date)} [data.date=NOW()] Sets the entry date.
   * @param  {Boolean} [data.store=options.store] Sets the compression method to STORE.
   * @param  {String} [data.type=file] Sets the entry type. Defaults to `directory`
   * if name ends with trailing slash.
   * @param  {Function} callback
   * @return this
   */
  entry(source, data, callback) {
    data = this._normalizeFileData(data);
    const entry = new ZipArchiveEntry(data.name);
    entry.setTime(data.date, this.options.forceLocalTime);
    if (data.store) {
      entry.setMethod(0);
    }
    if (data.comment.length > 0) {
      entry.setComment(data.comment);
    }
    return super.entry(entry, source, callback);
  }
}
