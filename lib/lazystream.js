import { PassThrough } from 'node:stream';
import * as fs from 'node:fs';

export class Readable extends PassThrough {
  
  constructor(filepath) {
    super();
  }
}
