'use strict';
var BucketCleanup = {};
var KeyStream = require('../keystream');
BucketCleanup.cleanBucket = function(bucket, riakClient, cb) {
  var handler = function(key, cb) {
    riakClient.remove(bucket, key, function(err, element, meta) {
      cb();
    });
  };

  var config = {
    bucket: bucket
  };

  var keyStream = KeyStream.instance(config, riakClient, handler, function() {
    cb();
  });
  keyStream.start();
};

module.exports = BucketCleanup;