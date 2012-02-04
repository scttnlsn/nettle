var Connection = require('./connection');

exports.Connection = Connection;

exports.connect = function(options, callback) {
    var connection = new Connection(options);
    connection.open(callback);
    return connection;
};

exports.store = function(options, callback) {
    var connection = exports.connect(options, callback);
    return connection.store(options.prefix || 'fs');
};