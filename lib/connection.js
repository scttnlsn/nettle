var mongo = require('mongodb');
var url = require('url');
var Collection = require('./collection');
var Grid = require('./grid');
var MetaCache = require('./metacache');
var Promise = require('./promise');
var Store = require('./store');

module.exports = Connection;

function Connection(options) {
    if (typeof options === 'string') {
        var uri = url.parse(options);
        this.options = {};
        this.options.host = uri.hostname;
        this.options.port = parseInt(uri.port, 10);
        this.options.db = uri.pathname && uri.pathname.replace(/\//g, '');
    } else {
        this.options = options || {};
        this.options.host || (this.options.host = 'localhost');
        this.options.port || (this.options.port = 27017);
    }
    
    if (this.options.db === undefined) {
        throw new Error('No `db` specified');
    }
    
    this.db = new Promise();
    this.collections = {};
    this.grids = {};
};

Connection.prototype.collection = function(name) {
    this.collections[name] || (this.collections[name] = new Collection(name, this.db));
    return this.collections[name];
};

Connection.prototype.grid = function(name) {
    this.grids[name] || (this.grids[name] = new Grid(name, this.db));
    return this.grids[name];
};

Connection.prototype.store = function(name) {
    var entities = this.grid(name);
    var cache = this.grid(name + '.cache');
    var metacache = new MetaCache(this.collection(name + '.metacache'));
    
    return new Store(entities, cache, metacache);
};

Connection.prototype.open = function(callback) {
    var self = this;
    var server = new mongo.Server(this.options.host, this.options.port, {});
    var db = new mongo.Db(this.options.db, server);
    
    db.open(function(err, db) {
        self.db.resolve(err, db);
        if (callback) callback(err, db);
    });
};