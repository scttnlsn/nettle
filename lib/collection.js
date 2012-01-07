var mongo = require('mongodb');
var Promise = require('./promise');

module.exports = Collection;

function Collection(name, db) {
    this.name = name;
    this.db = db;
    this.collection = new Promise();
    
    var self = this;
    this.db.add(function(err, db) {
        if (err) return self.collection.resolve(err);
        
        var collection = new mongo.Collection(db, self.name);
        self.collection.resolve(null, collection);
    });
};

Collection.prototype.read = function(id, callback) {
    this.collection.add(function(err, collection) {
        if (err) return callback(err);
        collection.findOne({ _id: id }, callback);
    });
};

Collection.prototype.save = function(id, data, callback) {
    this.collection.add(function(err, collection) {
        if (err) return callback(err);
        collection.update({ _id: id }, { '$set': data }, { upsert: true }, callback);
    });
};

Collection.prototype.remove = function(id, callback) {
    this.collection.add(function(err, collection) {
        if (err) return callback(err);
        collection.remove({ _id: id }, callback);
    });
};