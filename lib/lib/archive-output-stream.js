
import { Transform } from "readable-stream";

export default class ArchiveOutputStream extends Transform {
  constructor(options) {
    super(options);

    this.offset = 0;
    this._archive = {
      finish: false,
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

  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }

  entry(ae, source, callback) {
    this._archive.processing = true;
    
    ae._offsets = {
      file: 0,
      data: 0,
      contents: 0,
    };

    if (Buffer.isBuffer(source)) {
      this._appendBuffer(ae, source, callback);
    } else {   // stream
      this._appendStream(ae, source, callback);
    }
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
