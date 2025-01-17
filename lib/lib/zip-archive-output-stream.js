
import crc32 from "crc-32";
import { CRC32Stream } from "crc32-stream";
import ArchiveOutputStream from "./archive-output-stream.js";

import {
  LONG_ZERO,
  MIN_VERSION_DATA_DESCRIPTOR,
  MIN_VERSION_INITIAL,
  PLATFORM_FAT,
  SHORT_ZERO,
  SIG_EOCD,
  SIG_DD,
  SIG_CFH,
  SIG_LFH,
  VERSION_MADEBY,
  ZLIB_NO_COMPRESSION,
  EMPTY,
} from "./constants.js";
import { getLongBytes, getShortBytes, dateToDos } from "./util.js";
import GeneralPurposeBit from "./general-purpose-bit.js";


export class ZipArchiveEntry {
  constructor(name) {
    this.method = 0;
    this.size = 0;
    this.csize = 0;
    this.gpb = new GeneralPurposeBit();
    this.crc = 0;
    this.minver = MIN_VERSION_INITIAL;
    this.time = dateToDos(new Date());
    this.name = name;
  }
}

export class ZipArchiveOutputStream extends ArchiveOutputStream {
  constructor() {
    const _options = {
      zlib: {
        level: ZLIB_NO_COMPRESSION
      }
    };

    super(_options);
    this.options = _options;
    this._entries = [];
    this._archive = {
      centralLength: 0,
      centralOffset: 0,
      finish: false,
      finished: false,
      processing: false
    };
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
    this._archive.processing = false;
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
    ae.minver = MIN_VERSION_DATA_DESCRIPTOR;
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
    this._archive.centralOffset = this.offset;
    this._entries.forEach(ae => this._writeCentralFileHeader(ae));
    this._archive.centralLength = this.offset - this._archive.centralOffset;
    this._writeCentralDirectoryEnd();
    this._archive.processing = false;
    this._archive.finish = true;
    this._archive.finished = true;
    this.end();
  }

  _writeCentralDirectoryEnd() {
    var records = this._entries.length;
    // signature
    this.write(getLongBytes(SIG_EOCD));
    // disk numbers
    this.write(SHORT_ZERO);
    this.write(SHORT_ZERO);
    // number of entries
    this.write(getShortBytes(records));
    this.write(getShortBytes(records));
    // length and location of CD
    this.write(getLongBytes(this._archive.centralLength));
    this.write(getLongBytes(this._archive.centralOffset));
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
    this.write(getShortBytes(ae.minver));
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
    this.write(getLongBytes(ae._offsets.file));
    // name
    this.write(ae.name);
    // extra
    this.write(EMPTY);
    // comment
    this.write("");
  }

  _writeLocalFileHeader(ae) {
    ae._offsets.file = this.offset;
    // signature
    this.write(getLongBytes(SIG_LFH));
    // version to extract and general bit flag
    this.write(getShortBytes(ae.minver));
    this.write(ae.gpb.encode());
    // compression method
    this.write(getShortBytes(ae.method));
    // datetime
    this.write(getLongBytes(ae.time));
    ae._offsets.data = this.offset;
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
    ae._offsets.contents = this.offset;
  }
}
