
import * as core from '@actions/core';
import { ZipArchiveOutputStream } from "compress-commons";


export default class ZipStream extends ZipArchiveOutputStream {

  entry(source, entry, callback) {
    super.entry(entry, source, callback);
  }
}
