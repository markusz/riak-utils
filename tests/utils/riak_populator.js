var request = require('request');
var async = require('async');
var DataStore = require('model/database/data_store');

var RiakPopulator = {};
RiakPopulator._makePostRequestFunctionForEntity = function(entity, id) {

  return function(cb) {
    var jsonPayload = payloads(id)[entity];
    var req = {
      url: urls[entity],
      json: jsonPayload,
      headers: {
        'UserToken': 'cached-user-token',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Mobile/12A365, webview (iphone_retina; version 48)'
      }
    };

    request.post(req, function(err, res, body) {
      if (err) {
        return cb(err);
      }
      cb(null);
    });
  };
};

RiakPopulator.fillBucketWithNEntries = function(n, bucket, stopMockServersWhenDone, cb) {
  var postCalls = [];
  for (var j = 0; j < n; j++) {
    postCalls.push(RiakPopulator._makePostRequestFunctionForEntity(bucket, j));
  }

  async.series(postCalls, function() {
    cb();
  });
};

RiakPopulator.fillMultipleBucketsWithEntries = function(config, stopMockServersWhenDone, cb) {
  featureHelpers.startServers(function() {
    var postCalls = [];
    for (var key in config) {
      if (config.hasOwnProperty(key)) {
        var numberOfEntries = config[key];
        for (var j = 0; j < numberOfEntries; j++) {
          postCalls.push(RiakPopulator._makePostRequestFunctionForEntity(key, j));
        }
      }
    }
    async.series(postCalls, function() {
      if (stopMockServersWhenDone) {
        return featureHelpers.stopServers(cb);
      }
      cb();
    });
  });
};

RiakPopulator.cleanMultipleBuckets = function(namespace, bucketNames, cb) {
  async.each(bucketNames, function(bucket, cb) {
    RiakPopulator.cleanBucket(namespace, bucket, cb);
  }, cb);
};

RiakPopulator.cleanBucket = function(namespace, bucketName, cb) {
  var dsNamespace = new DataStore(bucketName, namespace);
  dsNamespace.clear(cb);
};

module.exports = RiakPopulator;
