/**
 * Archiver Vending
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var Archiver = require('./core');

/**
 * Dispenses a new Archiver instance.
 *
 * @constructor
 * @return {Archiver}
 */
var vending = function() {
    var instance = new Archiver('zip');
    instance.setFormat('zip');
    instance.setModule(new (require('./zip'))());
    
    return instance;
};

module.exports = vending;