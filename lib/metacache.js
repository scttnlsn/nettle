module.exports = MetaCache;

function MetaCache(collection) {
    this.collection = collection;
};

MetaCache.prototype.store = function(id, key, cached, callback) {
    var cache = {};
    cache[key] = cached;
    this.collection.save(id, cache, callback);
};

MetaCache.prototype.lookup = function(id, key, callback) {
    this.collection.read(id, function(err, doc) {
        if (err) return callback(err);
        if (!doc) return callback(null, null);
        callback(null, doc[key]);
    });
};