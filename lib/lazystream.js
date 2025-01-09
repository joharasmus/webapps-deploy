import { PassThrough } from 'node:stream';

// Patch the given method of instance so that the callback
// is executed once, before the actual method is called the
// first time.

export class Readable extends PassThrough {
  
  constructor(fn, options) {
    super(options);
    
    this.beforeFirstCall(function() {
      let source = fn.call(this, options);
      source.pipe(this);
    });
    
    this.emit('readable');
  }

  beforeFirstCall(callback) {
    this['_read'] = function() {
      delete this['_read'];
      callback.apply(this, arguments);
      return this['_read'].apply(this, arguments);
    };
  }
}
