/**
 * Archiver Vending
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var Archiver = require('./core');

var formats = {};

/**
 * Dispenses a new Archiver instance.
 *
 * @constructor
 * @return {Archiver}
 */
var vending = function() {
  return vending.create();
};

/**
 * Creates a new Archiver instance.
 *
 * @return {Archiver}
 */
vending.create = function() {
    var instance = new Archiver('zip');
    instance.setFormat('zip');
    instance.setModule(new formats['zip']());
    
    return instance;
};

formats['zip'] = require('./zip');

module.exports = vending;