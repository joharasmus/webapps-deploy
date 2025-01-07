
var Archiver = require('./core');

var vending = function() {
    var instance = new Archiver('zip');
    instance.setFormat('zip');
    instance.setModule(new (require('./zip'))());
    
    return instance;
};

module.exports = vending;