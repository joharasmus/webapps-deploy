
import crc32 from "crc-32";
import { CRC32Stream } from "crc32-stream";

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
    this.method = 0;
    this.size = 0;
    this.csize = 0;
    this.descriptor = false;
    this.crc = 0;
    this.name = name;
  }

  encode() {
    return getShortBytes(this.descriptor ? 8 : 0);
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
    return super.write(chunk);
  }

  _afterAppend(ae) {
    this.entries.push(ae);
    if (ae.descriptor) {
      this.write(getLongBytes(SIG_DD));
      // crc32 checksum
      this.write(getLongBytes(ae.crc));
      // sizes    
      this.write(getLongBytes(ae.csize));
      this.write(getLongBytes(ae.size));
    }
  }

  _appendBuffer(ae, source, callback) {
    ae.size = source.length;
    ae.csize = source.length;
    ae.crc = crc32.buf(source) >>> 0;
    this._writeLocalFileHeader(ae);
    this.write(source);
    this._afterAppend(ae);
    callback(null, ae);
  }

  _appendStream(ae, source, callback) {
    ae.descriptor = true;
    this._writeLocalFileHeader(ae);
    let process = new CRC32Stream();
    function handleStuff() {
      ae.crc = process.digest().readUInt32BE(0);
      ae.size = process.size();
      ae.csize = process.size(true);
      this._afterAppend(ae);
      callback(null, ae);
    }
    process.once("end", handleStuff.bind(this));
    process.pipe(this, { end: false });
    source.pipe(process);
  }

  _finish() {
    this.centralOffset = this.offset;
    this.entries.forEach(ae => this._writeCentralFileHeader(ae));
    this.centralLength = this.offset - this.centralOffset;
    // signature
    this.write(getLongBytes(SIG_EOCD));
    // disk numbers
    this.write(Buffer.from(Array(4)));
    // number of entries
    this.write(getShortBytes(this.entries.length));
    this.write(getShortBytes(this.entries.length));
    // length and location of CD
    this.write(getLongBytes(this.centralLength));
    this.write(getLongBytes(this.centralOffset));
    // archive comment
    let buf = Buffer.alloc(2);
    this.end();
  }

  _writeCentralFileHeader(ae) {
    // signature
    this.write(getLongBytes(SIG_CFH));
    // version made by
    this.write(getShortBytes(45));
    // version to extract and general bit flag
    this.write(getShortBytes(20));
    this.write(ae.encode());
    // compression method
    this.write(getShortBytes(ae.method));
    // datetime
    this.write(getLongBytes(0));
    // crc32 checksum
    this.write(getLongBytes(ae.crc));
    // sizes
    this.write(getLongBytes(ae.csize));
    this.write(getLongBytes(ae.size));
    // name length
    this.write(getShortBytes(ae.name.length));
    // extra length
    this.write(getShortBytes(0));
    // comments length
    this.write(getShortBytes(0));
    // disk number start
    this.write(Buffer.from(Array(2)));
    // internal attributes
    this.write(getShortBytes(0));
    // external attributes
    this.write(getLongBytes(0));
    // relative offset of LFH
    this.write(getLongBytes(ae.fileOffset));
    // name
    this.write(ae.name);
    // extra
    this.write(Buffer.alloc(0));
    // comment
    this.write("");
  }

  _writeLocalFileHeader(ae) {
    ae.fileOffset = this.offset;
    // signature
    this.write(getLongBytes(SIG_LFH));
    // version to extract and general bit flag
    this.write(getShortBytes(20));
    this.write(ae.encode());
    // compression method
    this.write(getShortBytes(ae.method));
    // datetime
    this.write(getLongBytes(0));
    // crc32 checksum and sizes
    if (ae.descriptor) {
      this.write(Buffer.from(Array(12)));
    } else {
      this.write(getLongBytes(ae.crc));
      this.write(getLongBytes(ae.csize));
      this.write(getLongBytes(ae.size));
    }
    // name length
    this.write(getShortBytes(ae.name.length));
    // extra length
    this.write(getShortBytes(0));
    // name
    this.write(ae.name);
    // extra
    this.write(Buffer.alloc(0));
  }
}
