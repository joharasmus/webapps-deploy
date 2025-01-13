
import * as core from '@actions/core';
import { ZipArchiveOutputStream, ZipArchiveEntry } from "compress-commons";


export default class ZipStream extends ZipArchiveOutputStream {
  /**
   * @constructor
   * @extends external:ZipArchiveOutputStream
   * @param {Object} [options]
   * @param {String} [options.comment] Sets the zip archive comment.
   * @param {Boolean} [options.forceLocalTime=false] Forces the archive to contain local file times instead of UTC.
   * @param {Boolean} [options.forceZip64=false] Forces the archive to contain ZIP64 headers.
   * @param {Boolean} [options.store=false] Sets the compression method to STORE.
   * @param {Object} [options.zlib] Passed to [zlib]{@link https://nodejs.org/api/zlib.html#zlib_class_options}
   * to control compression.
   */
  constructor(options) {
    options = {};
    options.zlib = {};
    super(options);
  }

  /**
   * Normalizes entry data with fallbacks for key properties.
   *
   * @private
   * @param  {Object} data
   * @return {Object}
   */
  _normalizeFileData(data) {
    data = {
      namePrependSlash: false,
      linkname: null,
      store: this.options.store,
      comment: "",
      ...data,
    };
    let isDir = data.type === "directory";
    if (data.name) {
      if (data.name.slice(-1) === "/") {
        isDir = true;
        data.type = "directory";
      } else if (isDir) {
        data.name += "/";
      }
    }
    if (isDir) {
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
    if (
      data.type !== "file" &&
      data.type !== "directory" &&
      data.type !== "symlink"
    ) {
      callback(new Error(data.type + " entries not currently supported"));
      return;
    }
    if (typeof data.name !== "string" || data.name.length === 0) {
      callback(new Error("entry name must be a non-empty string value"));
      return;
    }
    if (data.type === "symlink" && typeof data.linkname !== "string") {
      callback(
        new Error(
          "entry linkname must be a non-empty string value when type equals symlink",
        ),
      );
      return;
    }
    const entry = new ZipArchiveEntry(data.name);
    entry.setTime(data.date, this.options.forceLocalTime);
    if (data.store) {
      entry.setMethod(0);
    }
    if (data.comment.length > 0) {
      entry.setComment(data.comment);
    }
    if (data.type === "symlink" && typeof data.linkname === "string") {
      source = Buffer.from(data.linkname);
    }
    return super.entry(entry, source, callback);
  }
}
