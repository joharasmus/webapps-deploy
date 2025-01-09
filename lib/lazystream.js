import { PassThrough } from 'node:stream';
import * as fs from 'node:fs';

// Patch the given method of instance so that the callback
// is executed once, before the actual method is called the
// first time.

export class Readable extends PassThrough {
  
  constructor(filepath) {
    super();

    this.filepath = filepath;
    this.callbacked = false;
  }

  _read() {
    let callback = function() {
      let fn = (_ => fs.createReadStream(this.filepath))
      let source = fn.call(this);
      source.pipe(this);
    }

    if (this.callbacked === false){
      callback.apply(this);
      this.callbacked = true;
    }
    return super._read();
  };
}