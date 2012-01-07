module.exports = MetaCache;

function MetaCache(collection) {
    this.collection = collection;
};

MetaCache.prototype.store = function(id, processor, cached, callback) {
    var cache = {};
    cache[processor] = cached;
    this.collection.save(id, cache, callback);
};

MetaCache.prototype.lookup = function(id, processor, callback) {
    this.collection.read(id, function(err, metacache) {
        if (err) return callback(err);
        
        if (typeof processor === 'function' && callback === undefined) {
            callback = processor;
            processor = undefined;
        }
        
        if (!metacache) return callback(null, null);
        if (processor !== undefined) return callback(null, metacache[processor]);
        callback(null, metacache);
    });
};

MetaCache.prototype.delete = function(id, callback) {
    this.collection.remove(id, callback);
};