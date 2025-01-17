
import crc32 from "crc-32";
import { CRC32Stream } from "crc32-stream";
import ArchiveOutputStream from "./archive-output-stream.js";

import {
  LONG_ZERO,
  MIN_VERSION_DATA_DESCRIPTOR,
  PLATFORM_FAT,
  SHORT_ZERO,
  SIG_EOCD,
  SIG_DD,
  SIG_CFH,
  SIG_LFH,
  VERSION_MADEBY,
  EMPTY,
} from "./constants.js";
import { getLongBytes, getShortBytes, dateToDos } from "./util.js";
import GeneralPurposeBit from "./general-purpose-bit.js";
import { Transform } from "node:stream";


export class ZipArchiveEntry {
  constructor(name) {
    this.method = 0;
    this.size = 0;
    this.csize = 0;
    this.gpb = new GeneralPurposeBit();
    this.crc = 0;
    this.time = dateToDos(new Date());
    this.name = name;
  }
}

export class ZipArchiveOutputStream extends Transform {
  constructor() {
    super();
    this._entries = [];
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
    this._entries.push(ae);
    if (ae.gpb.usesDataDescriptor()) {
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
    ae.gpb.useDataDescriptor(true);
    this._writeLocalFileHeader(ae);
    var process = new CRC32Stream();
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
    this._entries.forEach(ae => this._writeCentralFileHeader(ae));
    this.centralLength = this.offset - this.centralOffset;
    this._writeCentralDirectoryEnd();
    this.end();
  }

  _writeCentralDirectoryEnd() {
    // signature
    this.write(getLongBytes(SIG_EOCD));
    // disk numbers
    this.write(SHORT_ZERO);
    this.write(SHORT_ZERO);
    // number of entries
    this.write(getShortBytes(this._entries.length));
    this.write(getShortBytes(this._entries.length));
    // length and location of CD
    this.write(getLongBytes(this.centralLength));
    this.write(getLongBytes(this.centralOffset));
    // archive comment
    this.write(getShortBytes(0));
    this.write("");
  }

  _writeCentralFileHeader(ae) {
    // signature
    this.write(getLongBytes(SIG_CFH));
    // version made by
    this.write(getShortBytes((PLATFORM_FAT << 8) | VERSION_MADEBY));
    // version to extract and general bit flag
    this.write(getShortBytes(MIN_VERSION_DATA_DESCRIPTOR));
    this.write(ae.gpb.encode());
    // compression method
    this.write(getShortBytes(ae.method));
    // datetime
    this.write(getLongBytes(ae.time));
    // crc32 checksum
    this.write(getLongBytes(ae.crc));
    // sizes
    this.write(getLongBytes(ae.csize));
    this.write(getLongBytes(ae.size));
    // name length
    this.write(getShortBytes(ae.name.length));
    // extra length
    this.write(getShortBytes(EMPTY.length));
    // comments length
    this.write(getShortBytes("".length));
    // disk number start
    this.write(SHORT_ZERO);
    // internal attributes
    this.write(getShortBytes(0));
    // external attributes
    this.write(getLongBytes(0));
    // relative offset of LFH
    this.write(getLongBytes(ae.fileOffset));
    // name
    this.write(ae.name);
    // extra
    this.write(EMPTY);
    // comment
    this.write("");
  }

  _writeLocalFileHeader(ae) {
    ae.fileOffset = this.offset;
    // signature
    this.write(getLongBytes(SIG_LFH));
    // version to extract and general bit flag
    this.write(getShortBytes(MIN_VERSION_DATA_DESCRIPTOR));
    this.write(ae.gpb.encode());
    // compression method
    this.write(getShortBytes(ae.method));
    // datetime
    this.write(getLongBytes(ae.time));
    // crc32 checksum and sizes
    if (ae.gpb.usesDataDescriptor()) {
      this.write(LONG_ZERO);
      this.write(LONG_ZERO);
      this.write(LONG_ZERO);
    } else {
      this.write(getLongBytes(ae.crc));
      this.write(getLongBytes(ae.csize));
      this.write(getLongBytes(ae.size));
    }
    // name length
    this.write(getShortBytes(ae.name.length));
    // extra length
    this.write(getShortBytes(EMPTY.length));
    // name
    this.write(ae.name);
    // extra
    this.write(EMPTY);
  }
}
