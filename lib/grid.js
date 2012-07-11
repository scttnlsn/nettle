var mongo = require('mongodb');
var Promise = require('./promise');

module.exports = Grid;

function Grid(name, db) {
    this.name = name;
    this.db = db;
    this.grid = new Promise();
    
    var self = this;
    this.db.add(function(err, db) {
        if (err) return self.grid.resolve(err);
        
        var grid = new mongo.Grid(db, self.name);
        self.grid.resolve(null, grid);
    });
};

Grid.prototype.get = function(id, callback) {
    this.grid.add(function(err, grid) {
        if (err) return callback(err);
        grid.get(id, callback);
    });
};

Grid.prototype.put = function(buffer, options, callback) {
    var args = [].slice.call(arguments, 1);
    callback = args.pop();
    options = args.length ? args.shift() : {};

    this.grid.add(function(err, grid) {
        if (err) return callback(err);
        grid.put(buffer, options, callback);
    });
};

Grid.prototype.delete = function(id, callback) {
    this.grid.add(function(err, grid) {
        if (err) return callback(err);
        grid.delete(id, callback);
    });
};