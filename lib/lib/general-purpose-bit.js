import { getShortBytes } from "./util.js";

export default class GeneralPurposeBit {
  constructor() {
    this.descriptor = false;
    return this;
  }
  encode() {
    return getShortBytes(this.descriptor ? 8 : 0);
  }
}
