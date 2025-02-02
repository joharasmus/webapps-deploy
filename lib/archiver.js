
import crc32 from "crc-32";
import CRC32Stream from "./crc32-stream.js";

import { Transform } from "node:stream";

const SIG_LFH = 0x04034b50;
const SIG_DD = 0x08074b50;
const SIG_CFH = 0x02014b50;
const SIG_EOCD = 0x06054b50;


function getShortBytes(v) {
  var buf = Buffer.alloc(2);
  buf.writeUInt16LE((v & 0xffff) >>> 0, 0);
  return buf;
}

function getLongBytes(v) {
  var buf = Buffer.alloc(4);
  buf.writeUInt32LE((v & 0xffffffff) >>> 0, 0);
  return buf;
}

export class ArchiveEntry {
  constructor(name) {
    this.size = 0;
    this.csize = 0;
    this.descriptor = false;
    this.crc = 0;
    this.name = name;
  }
}

export class ArchiveOutputStream extends Transform {
  constructor() {
    super();
    this.entries = [];
    this.offset = 0;
    this.fileOffset = 0;
    this.centralLength = 0;
    this.centralOffset = 0;
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

  write(chunk) {
    if (chunk) {
      this.offset += chunk.length;
    }
    super.write(chunk);
  }

  _appendBuffer(ae, source, callback) {
    ae.size = source.length;
    ae.csize = source.length;
    ae.crc = crc32.buf(source) >>> 0;
    this._writeLocalFileHeader(ae);
    this.write(source);
    this.entries.push(ae);
    callback(null, ae);
  }

  _appendStream(ae, source, callback) {
    ae.descriptor = true;
    this._writeLocalFileHeader(ae);
    let process = new CRC32Stream();
    let handleStuff = () => {
      ae.crc = process.digest().readUInt32BE(0);
      ae.size = process.rawSize;
      ae.csize = process.rawSize;
      this.entries.push(ae);
      this.write(getLongBytes(SIG_DD));
      this.write(getLongBytes(ae.crc));
      this.write(getLongBytes(ae.csize));
      this.write(getLongBytes(ae.size));
      callback(null, ae);
    };
    process.once("end", handleStuff);
    process.pipe(this, { end: false });
    source.pipe(process);
  }

  _finish() {
    this.centralOffset = this.offset;
    this.entries.forEach(ae => this._writeCentralFileHeader(ae));
    this.centralLength = this.offset - this.centralOffset;
    // signature
    this.write(getLongBytes(SIG_EOCD));
    this.write(Buffer.alloc(4));
    // number of entries
    this.write(getShortBytes(this.entries.length));
    this.write(getShortBytes(this.entries.length));
    // length and location of CD
    this.write(getLongBytes(this.centralLength));
    this.write(getLongBytes(this.centralOffset));
    this.write(Buffer.alloc(2));
    this.end();
  }

  _writeCentralFileHeader(ae) {
    // signature
    this.write(getLongBytes(SIG_CFH));
    // version made by
    this.write(getShortBytes(45));
    // version to extract and general bit flag
    this.write(getShortBytes(20));
    this.write(getShortBytes(this.descriptor ? 8 : 0));
    this.write(Buffer.alloc(10));
    // sizes
    this.write(getLongBytes(ae.csize));
    this.write(getLongBytes(ae.size));
    // name length
    this.write(getShortBytes(ae.name.length));
    this.write(Buffer.alloc(12));
    // relative offset of LFH
    this.write(getLongBytes(ae.fileOffset));
    // name
    this.write(ae.name);
    // comment
    this.write("");
  }

  _writeLocalFileHeader(ae) {
    ae.fileOffset = this.offset;
    // signature
    this.write(getLongBytes(SIG_LFH));
    // version to extract and general bit flag
    this.write(getShortBytes(20));
    this.write(getShortBytes(this.descriptor ? 8 : 0));
    this.write(Buffer.alloc(6));
    // crc32 checksum and sizes
    if (ae.descriptor) {
      this.write(Buffer.alloc(12));
    } else {
      this.write(getLongBytes(ae.crc));
      this.write(getLongBytes(ae.csize));
      this.write(getLongBytes(ae.size));
    }
    // name length
    this.write(getShortBytes(ae.name.length));
    // extra length
    this.write(Buffer.alloc(2));
    // name
    this.write(ae.name);
  }
}
