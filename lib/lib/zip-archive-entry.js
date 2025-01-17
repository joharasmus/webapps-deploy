
import GeneralPurposeBit from "./general-purpose-bit.js";

import {
  MIN_VERSION_INITIAL,
  PLATFORM_FAT
} from "./constants.js";
import { dateToDos } from "./util.js";

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
    this.exattr = 0;
    this.inattr = 0;
    this.time = dateToDos(new Date());
    if (name) {
      this.setName(name);
    }
  }

  setName(name) {
    this.name = name;
  }
}
