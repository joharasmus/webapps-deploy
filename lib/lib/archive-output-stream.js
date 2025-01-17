
import { Transform } from "readable-stream";

export default class ArchiveOutputStream extends Transform {
  constructor() {
    super();

    this.offset = 0;
    this.fileOffset = 0;
    this._archive = {
    };
  }

  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }

  entry(ae, source, callback) {

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
