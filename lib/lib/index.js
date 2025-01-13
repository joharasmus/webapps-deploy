
import { PassThrough } from "readable-stream";
import { isStream } from "is-stream";

export function normalizeInputSource(source) {  
  if (isStream(source) && !source._readableState) {
    console.log("YES");
    var normalized = new PassThrough();
    source.pipe(normalized);
    return normalized;
  }
  else
    console.log("NO");
  return source;
}

export default {
  normalizeInputSource,
};
