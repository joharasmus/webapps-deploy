
import normalizePath from "normalize-path";
import GeneralPurposeBit from "./general-purpose-bit.js";

import {
  EMPTY,
  MIN_VERSION_INITIAL,
  PLATFORM_FAT,
  PLATFORM_UNIX,
  SHORT_MASK,
  SHORT_SHIFT
} from "./constants.js";
import { dateToDos, dosToDate } from "./util.js";

export default class ZipArchiveEntry {
  constructor(name) {
    this.platform = PLATFORM_FAT;
    this.method = 0;
    this.name = null;
    this.size = 0;
    this.csize = 0;
    this.gpb = new GeneralPurposeBit();
    this.crc = 0;
    this.time = -1;
    this.minver = MIN_VERSION_INITIAL;
    this.mode = -1;
    this.extra = null;
    this.exattr = 0;
    this.inattr = 0;
    this.time = dateToDos(new Date());
    if (name) {
      this.setName(name);
    }
  }

  /**
   * Returns the extra fields related to the entry.
   *
   * @returns {Buffer}
   */
  getExtra() {
    return this.extra !== null ? this.extra : EMPTY;
  }

  /**
   * Returns the general purpose bits related to the entry.
   *
   * @returns {GeneralPurposeBit}
   */
  getGeneralPurposeBit() {
    return this.gpb;
  }

  /**
   * Returns the internal file attributes for the entry.
   *
   * @returns {number}
   */
  getInternalAttributes() {
    return this.inattr;
  }

  /**
   * Returns the last modified date of the entry.
   *
   * @returns {number}
   */
  getLastModifiedDate() {
    return this.getTime();
  }

  /**
   * Returns the extra fields related to the entry.
   *
   * @returns {Buffer}
   */
  getLocalFileDataExtra() {
    return this.getExtra();
  }

  /**
   * Returns the compression method used on the entry.
   *
   * @returns {number}
   */
  getMethod() {
    return this.method;
  }

  /**
   * Returns the filename of the entry.
   *
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Returns the platform on which the entry was made.
   *
   * @returns {number}
   */
  getPlatform() {
    return this.platform;
  }
  /**
   * Returns the size of the entry.
   *
   * @returns {number}
   */
  getSize() {
    return this.size;
  }
  /**
   * Returns a date object representing the last modified date of the entry.
   *
   * @returns {number|Date}
   */
  getTime() {
    return this.time !== -1 ? dosToDate(this.time) : -1;
  }
  /**
   * Returns the DOS timestamp for the entry.
   *
   * @returns {number}
   */
  getTimeDos() {
    return this.time !== -1 ? this.time : 0;
  }
  /**
   * Returns the UNIX file permissions for the entry.
   *
   * @returns {number}
   */
  getUnixMode() {
    return this.platform !== PLATFORM_UNIX
      ? 0
      : (this.exattr >> SHORT_SHIFT) & SHORT_MASK;
  }
  /**
   * Returns the version of ZIP needed to extract the entry.
   *
   * @returns {number}
   */
  getVersionNeededToExtract() {
    return this.minver;
  }
  /**
   * Sets the compressed size of the entry.
   *
   * @param size
   */
  setCompressedSize(size) {
    if (size < 0) {
      throw new Error("invalid entry compressed size");
    }
    this.csize = size;
  }
  /**
   * Sets the checksum of the entry.
   *
   * @param crc
   */
  setCrc(crc) {
    if (crc < 0) {
      throw new Error("invalid entry crc32");
    }
    this.crc = crc;
  }
  /**
   * Sets the external file attributes of the entry.
   *
   * @param attr
   */
  setExternalAttributes(attr) {
    this.exattr = attr >>> 0;
  }
  /**
   * Sets the extra fields related to the entry.
   *
   * @param extra
   */
  setExtra(extra) {
    this.extra = extra;
  }
  /**
   * Sets the general purpose bits related to the entry.
   *
   * @param gpb
   */
  setGeneralPurposeBit(gpb) {
    if (!(gpb instanceof GeneralPurposeBit)) {
      throw new Error("invalid entry GeneralPurposeBit");
    }
    this.gpb = gpb;
  }
  /**
   * Sets the internal file attributes of the entry.
   *
   * @param attr
   */
  setInternalAttributes(attr) {
    this.inattr = attr;
  }
  /**
   * Sets the name of the entry.
   *
   * @param name
   * @param prependSlash
   */
  setName(name, prependSlash = false) {
    name = normalizePath(name, false)
      .replace(/^\w+:/, "")
      .replace(/^(\.\.\/|\/)+/, "");
    if (prependSlash) {
      name = `/${name}`;
    }
    if (Buffer.byteLength(name) !== name.length) {
      this.getGeneralPurposeBit().useUTF8ForNames(true);
    }
    this.name = name;
  }
  /**
   * Sets the platform on which the entry was made.
   *
   * @param platform
   */
  setPlatform(platform) {
    this.platform = platform;
  }
  /**
   * Sets the size of the entry.
   *
   * @param size
   */
  setSize(size) {
    if (size < 0) {
      throw new Error("invalid entry size");
    }
    this.size = size;
  }
  /**
   * Sets the version of ZIP needed to extract this entry.
   *
   * @param minver
   */
  setVersionNeededToExtract(minver) {
    this.minver = minver;
  }
  /**
   * Returns true if this entry represents a directory.
   *
   * @returns {boolean}
   */
  isDirectory() {
    return this.getName().slice(-1) === "/";
  }
}
