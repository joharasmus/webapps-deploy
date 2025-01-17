export function dateToDos(d) {
  var year = d.getUTCFullYear();
  if (year < 1980) {
    return 2162688; // 1980-1-1 00:00:00
  } else if (year >= 2044) {
    return 2141175677; // 2043-12-31 23:59:58
  }
  var val = {
    year: year,
    month: d.getUTCMonth(),
    date: d.getUTCDate(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    seconds: d.getUTCSeconds(),
  };
  return (
    ((val.year - 1980) << 25) |
    ((val.month + 1) << 21) |
    (val.date << 16) |
    (val.hours << 11) |
    (val.minutes << 5) |
    (val.seconds / 2)
  );
}
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
  dateToDos,
  getShortBytes,
  getLongBytes
};
