var async = require('async');

var RiakPopulator = function(riakConfig, config) {
  this.riakClient = require('riak-js')(riakConfig);
  this.config = config;
};

RiakPopulator.prototype.start = function(populatorCallback) {
  var buckets = Object.keys(this.config);
  var self = this;
  async.each(buckets, function(bucket, bucketCb) {
    var numberOfInstances = self.config[bucket].count;
    var idArray = Array.apply(null, { length: numberOfInstances }).map(Number.call, Number);
    async.each(idArray, function(id, cb) {
      var instance = self.config[bucket].createNewInstance(id);
      var indexes = instance.getIndexes ? instance.getIndexes() : {};
      var body = instance.getBody ? instance.getBody() : {};
      var key = instance.getKey ? instance.getKey() : bucket + '_' + id;
      self.riakClient.save(bucket, key, body, { index: indexes }, function(err, res) {
        cb();
      });
    }, bucketCb);
  }, populatorCallback);
};

module.exports = RiakPopulator;
