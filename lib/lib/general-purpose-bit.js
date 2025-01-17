import { getShortBytes } from "./util.js";

var DATA_DESCRIPTOR_FLAG = 1 << 3;
var ENCRYPTION_FLAG = 1 << 0;
var NUMBER_OF_SHANNON_FANO_TREES_FLAG = 1 << 2;
var SLIDING_DICTIONARY_SIZE_FLAG = 1 << 1;
var STRONG_ENCRYPTION_FLAG = 1 << 6;
var UFT8_NAMES_FLAG = 1 << 11;

export default class GeneralPurposeBit {
  constructor() {
    this.descriptor = false;
    this.encryption = false;
    this.utf8 = false;
    this.numberOfShannonFanoTrees = 0;
    this.strongEncryption = false;
    this.slidingDictionarySize = 0;
    return this;
  }
  encode() {
    return getShortBytes(
      (this.descriptor ? DATA_DESCRIPTOR_FLAG : 0) |
        (this.utf8 ? UFT8_NAMES_FLAG : 0) |
        (this.encryption ? ENCRYPTION_FLAG : 0) |
        (this.strongEncryption ? STRONG_ENCRYPTION_FLAG : 0),
    );
  }
  setNumberOfShannonFanoTrees(n) {
    this.numberOfShannonFanoTrees = n;
  }
  getNumberOfShannonFanoTrees() {
    return this.numberOfShannonFanoTrees;
  }
  setSlidingDictionarySize(n) {
    this.slidingDictionarySize = n;
  }
  getSlidingDictionarySize() {
    return this.slidingDictionarySize;
  }
  useDataDescriptor(b) {
    this.descriptor = b;
  }
}
