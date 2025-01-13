
import * as core from '@actions/core';
import { Transform } from "readable-stream";
import { normalizeInputSource } from "./index.js";

export default class ArchiveOutputStream extends Transform {
  constructor(options) {
    super(options);

    this.offset = 0;
    this._archive = {
      finish: false,
      finished: false,
      processing: false,
    };
  }

  _appendBuffer(zae, source, callback) {
    // scaffold only
  }

  _appendStream(zae, source, callback) {
    // scaffold only
  }

  _emitErrorCallback = function (err) {
    if (err) {
      this.emit("error", err);
    }
  };

  _finish(ae) {
    // scaffold only
  }

  _normalizeEntry(ae) {
    // scaffold only
  }

  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }

  entry(ae, source, callback) {
    this._archive.processing = true;
    this._normalizeEntry(ae);
    this._entry = ae;
    source = normalizeInputSource(source);
    if (Buffer.isBuffer(source)) {
      this._appendBuffer(ae, source, callback);
    } else {   // stream
      this._appendStream(ae, source, callback);
    }
    return this;
  }

  finish() {
    if (this._archive.processing) {
      this._archive.finish = true;
      return;
    }
    this._finish();
  }

  getBytesWritten() {
    return this.offset;
  }

  write(chunk, cb) {
    if (chunk) {
      this.offset += chunk.length;
    }
    return super.write(chunk, cb);
  }
}
