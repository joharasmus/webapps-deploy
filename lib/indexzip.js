
import * as core from '@actions/core';
import { ZipArchiveOutputStream, ZipArchiveEntry } from "compress-commons";


export default class ZipStream extends ZipArchiveOutputStream {

  entry(source, data, callback) {
    const entry = new ZipArchiveEntry(data.name);
    entry.setTime(new Date());

    if (data.type === "directory")
      entry.setMethod(0);

    super.entry(entry, source, callback);
  }
}
