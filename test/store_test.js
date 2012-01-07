var assert = require('assert');
var async = require('async');
var mongo = require('mongodb');
var nettle = require('../lib/index');

var store = nettle.store({
    host: process.env.NETTLE_TEST_HOST || 'localhost',
    port: process.env.NETTLE_TEST_PORT || 27017,
    db: process.env.NETTLE_TEST_DB || 'nettle_tests'
});

describe('Store', function() {
    var id;
    
    beforeEach(function(done) {
        store.put(new Buffer('foo'), function(err, entity) {
            if (err) throw err;
            id = entity._id;
            done();
        });
    });
    
    it('stores unprocessed entities', function(done) {
        store.get(id, function(err, result) {
            if (err) throw err;
            assert.equal(result.toString(), 'foo');
            done();
        });
    });
    
    it('deletes entities', function(done) {
        store.delete(id, function(err) {
            if (err) throw err;
            
            store.get(id, function(err, result) {
                assert.notEqual(err, null);
                assert.notEqual(err, undefined);
                done();
            });
        });
    });
    
    describe('when processing an entity', function() {
        var count;
        
        store.processor('reversed', function(buffer, callback) {
            var result = buffer.toString().split('').reverse().join('');
            count++;
            callback(null, new Buffer(result));
        });
        
        beforeEach(function() {
            count = 0;
        });
        
        it('stores the processed entity', function(done) {
            store.get(id, 'reversed', function(err, result) {
                if (err) throw err;
                assert.equal(result.toString(), 'oof');
                done();
            });
        });
        
        it('caches the processed entity', function(done) {
            var get = function(callback) {
                store.get(id, 'reversed', callback);
            };
            
            count = 0;
            async.series([get, get, get], function(err, results) {
                if (err) throw err;
                
                assert.equal(count, 1);
                results.forEach(function(result) {
                    assert.equal(result.toString(), 'oof');
                });
                
                done();
            });
        });
        
        describe('when invalidating the entity cache', function() {
            var result;
            
            beforeEach(function(done) {
                store.get(id, 'reversed', function(err, result) {
                    if (err) throw err;
                    result = result;
                    done();
                });
            });
            
            it('reprocesses the entity', function(done) {
                assert.equal(count, 1);
                
                store.get(id, 'reversed', function(err, result) {
                    if (err) throw err;
                    
                    assert.equal(count, 1);
                    store.invalidate(id, function(err) {
                        if (err) throw err;

                        store.get(id, 'reversed', function(err, result) {
                            if (err) throw err;

                            assert.equal(count, 2);
                            done();
                        });
                    });
                });
            });
        });
    });
});