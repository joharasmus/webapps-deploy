import { getShortBytes } from "./util.js";

var DATA_DESCRIPTOR_FLAG = 1 << 3;

export default class GeneralPurposeBit {
  constructor() {
    this.descriptor = false;
    return this;
  }
  encode() {
    return getShortBytes(
      (this.descriptor ? DATA_DESCRIPTOR_FLAG : 0) | 0,
    );
  }
}
