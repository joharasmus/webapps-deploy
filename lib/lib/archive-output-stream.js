
import { Transform } from "readable-stream";

export default class ArchiveOutputStream extends Transform {
  constructor(options) {
    super(options);

    this.offset = 0;
    this._archive = {
      processing: false,
    };
  }

  _emitErrorCallback = function (err) {
    if (err) {
      this.emit("error", err);
    }
  };

  _transform(chunk, encoding, callback) {
    console.log("YES");
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

  write(chunk, cb) {
    if (chunk) {
      this.offset += chunk.length;
    }
    return super.write(chunk, cb);
  }
}
