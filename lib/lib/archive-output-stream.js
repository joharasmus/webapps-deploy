
import { Transform } from "readable-stream";

export default class ArchiveOutputStream extends Transform {
  constructor() {
    super();
  }

  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
}
