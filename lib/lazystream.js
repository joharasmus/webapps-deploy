import { PassThrough } from 'node:stream';

// Patch the given method of instance so that the callback
// is executed once, before the actual method is called the
// first time.

export class Readable extends PassThrough {
  
  constructor(fn, options) {
    super(options);
    
    this.beforeFirstCall(this, '_read', function() {
      let source = fn.call(this, options);
      let emit = this.emit.bind(this, 'error');
      source.on('error', emit);
      source.pipe(this);
    });
    
    this.emit('readable');
  }

  beforeFirstCall(instance, method, callback) {
    instance[method] = function() {
      delete instance[method];
      callback.apply(this, arguments);
      return this[method].apply(this, arguments);
    };
  }
}
