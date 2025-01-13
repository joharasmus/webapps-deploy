
import * as core from '@actions/core';
import { ZipArchiveOutputStream, ZipArchiveEntry } from "compress-commons";


export default class ZipStream extends ZipArchiveOutputStream {
  constructor() {
    super({});
  }

  entry(source, data, callback) {
    if (data.type === "directory")
      data.name += "/";

    const entry = new ZipArchiveEntry(data.name);
    entry.setTime(new Date());

    if (data.type === "directory")
      entry.setMethod(0);

    return super.entry(entry, source, callback);
  }
}
