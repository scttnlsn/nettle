Nettle
======

On-the-fly processing framework for Node.js and MongoDB.

Install
-------

    npm install nettle
    
Stores
------

A store provides a simple interface to the GridFS entities in a MongoDB database.  It
provides basic `put`, `get`, and `delete` operations and allows the data to be arbitrarily
processed.

    var nettle = require('nettle');
    var store = nettle.store({ db: 'nettle' });

Optionally specify `host`, `port` and collection `prefix` (defaults to `'fs'`) when
creating a store.

Putting an entity into the store:

    store.put(new Buffer('foo'), function(err, doc) {
        console.log(doc._id);
    });
    
Getting an entity out of the store:

    store.get(id, function(err, buffer) {
        console.log(buffer.toString());
    });
    
    // -> 'foo'
    
Removing an entity from the store:

    store.delete(id, function(err) {
    });
    
Processing
----------

A processor defines an operation to be performed on entities in a store.  Each processor
is referenced by a unique name that is specified at its creation.  An example string
processor might look something like this:

    store.processor('reversed', function(buffer, callback) {
        var reversed = buffer.toString().split('').reverse().join('');
        callback(null, new Buffer(reversed));
    });

One can then retrieve processed entities by passing the processor name to `get`:
    
    store.get(id, 'reversed', function(err, buffer) {
        console.log(buffer.toString());
    });
    
    // -> 'oof'
    
Note that processed entities are cached internally.  The processor function will only
be called when the given `id` and processor name are not found in the cache.  One can
also explicitly force an entity to be processed:

    store.process(id, 'reversed', function(err, buffer) {
        console.log(buffer.toString());
    });
    
    // -> 'oof'
    
When deleting an entity, its associated cache will be deleted as well.