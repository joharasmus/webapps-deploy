
import { Transform } from "readable-stream";

export default class ArchiveOutputStream extends Transform {
  constructor() {
    super();
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
      console.log("YES");
      this.offset += chunk.length;
    }
    else
      console.log("NO");
    return super.write(chunk, cb);
  }
}
