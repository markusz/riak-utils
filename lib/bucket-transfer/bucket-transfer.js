'use strict';

var _ = require('lodash');
var RiakUtils = require('../utils/riak-utils');

var BucketTransfer = {};
var KeyStream = require('../keystream');

BucketTransfer.transfer = function(settings, riakClient, cb) {
  var handler = function(key, cb) {
    riakClient.get(settings.from, key, function(err, obj, meta) {
      var indexes = RiakUtils.metaToIndex(meta);
      riakClient.save(settings.to, key, obj, indexes, function(err, res) {
        cb();
      });
    });
  };
  var keyStream = KeyStream.instance({ bucket: settings.from }, riakClient, handler, function() {
    cb();
  });
  keyStream.start();
};

module.exports = BucketTransfer;