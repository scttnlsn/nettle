var async = require('async');
var mongo = require('mongodb');

module.exports = Store;

function Store(entities, cache, metacache) {
    this.entities = entities;
    this.cache = cache;
    this.metacache = metacache;
    this.processors = {};
};

Store.prototype.processor = function(name, operation) {
    this.processors[name] = operation;
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
    
    this.metacache.lookup(id, processor, function(err, cached) {
        if (err) return callback(err);
        if (cached) return self.cache.get(cached, callback);
        self.process(id, processor, callback);
    });
};

Store.prototype.process = function(id, processor, callback) {
    var self = this;
    var id = objectId(id);
    
    if (this.processors[processor] === undefined) throw new Error('Unknown processor');
    
    var funcs = [
        // Get raw entity
        function(callback) {
            self.raw(id, callback);
        },
        
        // Process the entity
        function(buffer, callback) {
            var operation = self.processors[processor];
            operation(buffer, callback);
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
            self.metacache.store(id, processor, cached, function(err) {
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