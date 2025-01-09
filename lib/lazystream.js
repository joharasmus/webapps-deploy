import { PassThrough } from 'node:stream';
import * as fs from 'node:fs';

// Patch the given method of instance so that the callback
// is executed once, before the actual method is called the
// first time.

export class Readable extends PassThrough {
  
  constructor(filepath) {
    super();
    
    let fn = (_ => fs.createReadStream(filepath));

    let defaultCallback = function() {
      let source = fn.call(this);
      source.pipe(this);
    }
    
    this.beforeFirstCall(defaultCallback);
  }

  beforeFirstCall(callback) {
    this['_read'] = function() {
      delete this['_read'];
      callback.apply(this);
      return this['_read'].apply(this);
    };
  }
}
