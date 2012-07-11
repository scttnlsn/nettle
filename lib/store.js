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
    if (operation === undefined) {
        // Retrieve existing processor
        var processor = this.processors[name];
        if (processor === undefined) throw new Error('Unknown processor');
        return processor;
    } else {
        // Define new processor
        this.processors[name] = operation;
    }
};

Store.prototype.put = function(buffer, options, callback) {
    this.entities.put.apply(this.entities, arguments);
};

Store.prototype.delete = function(id, callback) {
    var self = this;
    this.invalidate(id, function(err) {
        if (err) return callback(err);
        self.entities.delete(id, callback);
    });
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
    
    var funcs = [
        // Get raw entity
        function(callback) {
            self.raw(id, callback);
        },
        
        // Process the entity
        function(buffer, callback) {
            var operation = self.processor(processor);
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

Store.prototype.invalidate = function(id, callback) {
    var self = this;
    var id = objectId(id);
    
    var funcs = [
        // Lookup entire metacache entry
        function(callback) {
            self.metacache.lookup(id, callback);
        },
        
        // Delete all cached entities
        function(metacache, callback) {            
            var funcs = [];
            
            for (var processor in metacache) {
                if (processor !== '_id') {
                    var cached = metacache[processor];
                    funcs.push(function(callback) {
                        self.cache.delete(cached, callback);
                    });
                }
            }
            
            async.parallel(funcs, callback);
        },
        
        // Delete metacache entry
        function(results, callback) {
            self.metacache.delete(id, callback);
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