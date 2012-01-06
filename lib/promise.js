module.exports = Promise;

function Promise(context) {
    this.context = context;
    this.args = null;
    this.callbacks = [];
    this.resolved = false;
};

Promise.prototype.add = function(callback) {
    if (this.resolved) {
        callback.apply(this.context, this.args);
    } else {
        this.callbacks.push(callback);
    }
};

Promise.prototype.resolve = function() {
    if (this.resolved) throw new Error('Promise already resolved');
    
    this.args = arguments;
    this.resolved = true;
    
    var callback;
    while (callback = this.callbacks.shift()) {
        callback.apply(this.context, this.args);
    }
    
    this.callbacks = null;
};