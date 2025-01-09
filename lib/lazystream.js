import { PassThrough } from 'node:stream';

// Patch the given method of instance so that the callback
// is executed once, before the actual method is called the
// first time.

export class Readable extends PassThrough {
  
  constructor(fn, options) {
    super(options);
    
    this.beforeFirstCall(function() { defaultCallback(fn, options) });
    
    this.emit('readable');
  }

  beforeFirstCall(callback) {
    this['_read'] = function() {
      delete this['_read'];
      callback.apply(this, arguments);
      return this['_read'].apply(this, arguments);
    };
  }

  defaultCallback(fn, options) {
    let source = fn.call(this, options);
    let emit = this.emit.bind(this, 'error');
    source.on('error', emit);
    source.pipe(this);
  }
}
