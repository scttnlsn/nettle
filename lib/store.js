var async = require('async');
var mongo = require('mongodb');

module.exports = Store;

function Store(entities, cache, metacache) {
    this.entities = entities;
    this.cache = cache;
    this.metacache = metacache;
};

Store.prototype.put = function(buffer, callback) {
    this.entities.put(buffer, callback);
};

Store.prototype.raw = function(id, callback) {
    this.entities.get(objectId(id), callback);
};

Store.prototype.get = function(id, processor, callback) {
    var self = this;
    var id = objectId(id);
    
    // Optional `processor` argument
    if (callback === undefined) {
        callback = processor;
        return this.raw(id, callback);
    }
    
    this.metacache.lookup(id, key(processor), function(err, cached) {
        if (err) return callback(err);
        if (cached) return self.cache.get(cached, callback);
        self.process(id, processor, callback);
    });
};

Store.prototype.process = function(id, processor, callback) {
    var self = this;
    var id = objectId(id);
    
    var funcs = [
        // Get raw entity
        function(callback) {
            self.raw(id, callback);
        },
        
        // Process the entity
        function(buffer, callback) {
            processor.process(buffer, callback);
        },
        
        // Cache the result
        function(result, callback) {
            self.cache.put(result, function(err, doc) {
                if (err) return callback(err);
                callback(null, result, doc._id);
            });
        },
        
        // Update the metacache
        function(result, cached, callback) {
            self.metacache.store(id, key(processor), cached, function(err) {
                if (err) return callback(err);
                callback(null, result);
            });
        }
    ];
    
    async.waterfall(funcs, callback);
};

// Helpers
// ---------------

function objectId(id) {
    if (typeof id === 'string') id = new mongo.ObjectID(id);
    return id;
};

function key(processor) {
    return (typeof processor.key === 'function') ? processor.key() : processor.key;
};