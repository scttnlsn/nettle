Nettle
======

On-the-fly processing framework for Node.js and MongoDB.

Install
-------

    npm install nettle
    
Stores
------

A store provides a simple interface to the GridFS entities in a MongoDB database.  It
provides basic `put` and `get` operations and allows the data to be arbitrarily processed.

    var nettle = require('nettle');
    var store = nettle.store({ db: 'nettle' });

Optionally specify `host`, `port` and collection `prefix` (defaults to `'fs'`) when
creating a store.

Simple example of inserting a buffer into the store:

    store.put(new Buffer('foo'), function(err, doc) {
        console.log(doc._id);
    });
    
And later retrieving it:

    store.get(id, function(err, buffer) {
        console.log(buffer.toString());
    });
    
    // -> 'foo'
    
Processing
----------

A processor is an object with two properties: `key` and `process`.  `key` must be a string
(or a function that returns a string) and `process` must be a function accepting a buffer and
callback.  An example string processor might look something like this:
    
    var Concat = function(str) {
        this.key = function() {
            return 'concat_' + str;
        },
        
        this.process = function(buffer, callback) {
            callback(null, new Buffer(buffer.toString() + str));
        }
    };
    
    var processor = new Concat('bar');

One can then retrieve processed entities by passing the processor to `get`:
    
    store.get(id, processor, function(err, buffer) {
        console.log(buffer.toString());
    });
    
    // -> 'foobar'
    
Note that processed entities are stored and later retrieved by the given `id`
and processor `key`. The `process` function will thus only be called on a cache
miss.