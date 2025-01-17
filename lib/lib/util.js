

export function getShortBytes(v) {
  var buf = Buffer.alloc(2);
  buf.writeUInt16LE((v & 0xffff) >>> 0, 0);
  return buf;
}
export function getLongBytes(v) {
  var buf = Buffer.alloc(4);
  buf.writeUInt32LE((v & 0xffffffff) >>> 0, 0);
  return buf;
}
export default {
  getShortBytes,
  getLongBytes
};
