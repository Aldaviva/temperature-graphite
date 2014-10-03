var cache_manager = require('cache-manager');
var Q             = require('q');

var cache = module.exports = cache_manager.caching({
    store: 'memory',
    max: 32,
    ttl: 3*60
});

module.exports.wrapPromise = function(key, promiseReturningFunc){
    var deferred = Q.defer();

    cache.wrap(key, function(cb){
        Q(promiseReturningFunc()).nodeify(cb);
    }, deferred.makeNodeResolver());

    return deferred.promise;
};