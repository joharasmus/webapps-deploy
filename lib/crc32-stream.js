import { Transform } from "node:stream";
import crc32 from "crc-32";

export default class CRC32Stream extends Transform {
  constructor(options) {
    super(options);
    this.checksum = Buffer.allocUnsafe(4);
    this.checksum.writeInt32BE(0, 0);
    this.rawSize = 0;
  }

  _transform(chunk, encoding, callback) {
    if (chunk) {
      this.checksum = crc32.buf(chunk, this.checksum) >>> 0;
      this.rawSize += chunk.length;
    }
    callback(null, chunk);
  }
  
  digest() {
    const checksum = Buffer.allocUnsafe(4);
    checksum.writeUInt32BE(this.checksum >>> 0, 0);
    return checksum;
  }
}
