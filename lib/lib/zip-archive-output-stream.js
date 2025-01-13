
import crc32 from "crc-32";
import { CRC32Stream } from "crc32-stream";
import ArchiveOutputStream from "./archive-output-stream.js";

import {
  LONG_ZERO,
  MIN_VERSION_DATA_DESCRIPTOR,
  SHORT_ZERO,
  SIG_EOCD,
  SIG_DD,
  SIG_CFH,
  SIG_LFH,
  VERSION_MADEBY,
  ZLIB_NO_COMPRESSION,
} from "./constants.js";
import { getLongBytes, getShortBytes } from "./util.js";


export default class ZipArchiveOutputStream extends ArchiveOutputStream {
  constructor() {
    const _options = {
      zlib: {
        level: ZLIB_NO_COMPRESSION
      }
    };

    super(_options);
    this.options = _options;
    this._entry = null;
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
    if (ae.getGeneralPurposeBit().usesDataDescriptor()) {
      this.write(getLongBytes(SIG_DD));
      // crc32 checksum
      this.write(getLongBytes(ae.crc));
      // sizes    
      this.write(getLongBytes(ae.csize));
      this.write(getLongBytes(ae.getSize()));
    }
    this._archive.processing = false;
    this._entry = null;
  }

  _appendBuffer(ae, source, callback) {
    ae.setSize(source.length);
    ae.setCompressedSize(source.length);
    ae.setCrc(crc32.buf(source) >>> 0);
    this._writeLocalFileHeader(ae);
    this.write(source);
    this._afterAppend(ae);
    callback(null, ae);
  }

  _appendStream(ae, source, callback) {
    ae.getGeneralPurposeBit().useDataDescriptor(true);
    ae.setVersionNeededToExtract(MIN_VERSION_DATA_DESCRIPTOR);
    this._writeLocalFileHeader(ae);
    var process = new CRC32Stream();
    function handleStuff() {
      var digest = process.digest().readUInt32BE(0);
      ae.setCrc(digest);
      ae.setSize(process.size());
      ae.setCompressedSize(process.size(true));
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
    var size = this._archive.centralLength;
    var offset = this._archive.centralOffset;
    // signature
    this.write(getLongBytes(SIG_EOCD));
    // disk numbers
    this.write(SHORT_ZERO);
    this.write(SHORT_ZERO);
    // number of entries
    this.write(getShortBytes(records));
    this.write(getShortBytes(records));
    // length and location of CD
    this.write(getLongBytes(size));
    this.write(getLongBytes(offset));
    // archive comment
    this.write(getShortBytes(0));
    this.write("");
  }

  _writeCentralFileHeader(ae) {
    var gpb = ae.getGeneralPurposeBit();
    var method = ae.getMethod();
    var fileOffset = ae._offsets.file;
    var size = ae.getSize();
    var compressedSize = ae.csize;
    // signature
    this.write(getLongBytes(SIG_CFH));
    // version made by
    this.write(getShortBytes((ae.getPlatform() << 8) | VERSION_MADEBY));
    // version to extract and general bit flag
    this.write(getShortBytes(ae.getVersionNeededToExtract()));
    this.write(gpb.encode());
    // compression method
    this.write(getShortBytes(method));
    // datetime
    this.write(getLongBytes(ae.getTimeDos()));
    // crc32 checksum
    this.write(getLongBytes(ae.crc));
    // sizes
    this.write(getLongBytes(compressedSize));
    this.write(getLongBytes(size));
    var name = ae.getName();
    var comment = "";
    var extra = ae.getExtra();
    if (gpb.usesUTF8ForNames()) {
      name = Buffer.from(name);
      comment = Buffer.from("");
    }
    // name length
    this.write(getShortBytes(name.length));
    // extra length
    this.write(getShortBytes(extra.length));
    // comments length
    this.write(getShortBytes(comment.length));
    // disk number start
    this.write(SHORT_ZERO);
    // internal attributes
    this.write(getShortBytes(ae.getInternalAttributes()));
    // external attributes
    this.write(getLongBytes(ae.exattr));
    // relative offset of LFH
    this.write(getLongBytes(fileOffset));
    // name
    this.write(name);
    // extra
    this.write(extra);
    // comment
    this.write(comment);
  }

  _writeLocalFileHeader(ae) {
    var gpb = ae.getGeneralPurposeBit();
    var method = ae.getMethod();
    var name = ae.getName();
    var extra = ae.getLocalFileDataExtra();
    ae._offsets.file = this.offset;
    // signature
    this.write(getLongBytes(SIG_LFH));
    // version to extract and general bit flag
    this.write(getShortBytes(ae.getVersionNeededToExtract()));
    this.write(gpb.encode());
    // compression method
    this.write(getShortBytes(method));
    // datetime
    this.write(getLongBytes(ae.getTimeDos()));
    ae._offsets.data = this.offset;
    // crc32 checksum and sizes
    if (gpb.usesDataDescriptor()) {
      this.write(LONG_ZERO);
      this.write(LONG_ZERO);
      this.write(LONG_ZERO);
    } else {
      this.write(getLongBytes(ae.crc));
      this.write(getLongBytes(ae.csize));
      this.write(getLongBytes(ae.getSize()));
    }
    // name length
    this.write(getShortBytes(name.length));
    // extra length
    this.write(getShortBytes(extra.length));
    // name
    this.write(name);
    // extra
    this.write(extra);
    ae._offsets.contents = this.offset;
  }
}
