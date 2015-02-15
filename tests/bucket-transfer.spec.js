'use strict';

var RiakMockServer = require('riak-mock-server');
var RiakJS = require('riak-js');
var RiakPopulator = require('../lib/bucket-populate/bucket-populate');
var _ = require('lodash');
var BucketTransfer = require('../lib/bucket-transfer/bucket-transfer');
var BucketStatistics = require('../lib/bucket-statistics/bucket-statistics');

var expect = require('expect.js');
var chai = require('chai');
var assert = chai.assert;

describe('Bucket Transfer', function() {
  var bucketName = 'test_bucket';
  var port = 9999;
  var riakConfig = { host: 'localhost', port: port };
  var riakClient = RiakJS(riakConfig);

  var populatorConfig = {};
  populatorConfig[bucketName] = {
    createNewInstance: function(id) {
      return {
        getBody: function() {
          return { my_numeric_value: id, my_string_value: 'number_' + id };
        },
        getIndexes: function() {
          return { intidx: id, stringidx: 'number_' + id };
        }
      };
    },
    count: 100
  };

  var riakServer = new RiakMockServer({ port: port });
  var riakPopulator = new RiakPopulator(riakConfig, populatorConfig);

  before(function(done) {
    riakServer.start(function(port) {
      riakPopulator.start(function() {
        expect(port).to.be.ok();
        done();
      });
    });
  });

  after(function(done) {
    riakServer.stop(done);
  });

  var settings = {
    from: bucketName,
    to: bucketName + '_new'
  };

  it.only('should transfer the entries', function(done) {
    BucketTransfer.transfer(settings, riakClient, function(filePath) {
      BucketStatistics.calculateStatistics(settings.to, riakClient, ['count'], function(result) {
        expect(result.count.elements).to.be(100);
        done();
      });
    });
  });
});

//describe('TransferScript for buckets', function() {
//  before(function(done) {
//    helpers.RiakMock.start(done);
//  });
//
//  after(function(done) {
//    helpers.RiakMock.stop(done);
//  });
//
//  it('should be a function if imported using require()', function() {
//    assert.isFunction(transfer);
//  });
//
//  var entriesPerBucket = 20;
//  var prefix = '7TV';
//  var oldBuckets = ['dummy1', 'dummy2', 'dummy3', 'dummy4'];
//  var newBuckets = [prefix + '_dummy1', prefix + '_dummy2', prefix + '_dummy3', prefix + '_dummy4'];
//  var bucketsToBeCleanedUp = ['dummy1', 'dummy2', 'dummy3', 'dummy4', prefix + '_dummy1', prefix + '_dummy2', prefix + '_dummy3', prefix + '_dummy4', 'dummy1edge'];
//
//  var generateKeysArray = function(bucket, numberOfKeys) {
//    var keys = [];
//    for (var i = 0; i < numberOfKeys; i++) {
//      keys.push('key' + i);
//    }
//    return keys;
//  };
//
//  var cleanBucket = function(bucket, cb) {
//    var receivedAll = false;
//    var queue = async.queue(function(key, innerCb) {
//      db.remove(bucket, key, function(err, element, meta) {
//        innerCb();
//      });
//    }, 100);
//    queue.drain = function() {
//      if (receivedAll) {
//        queue.kill();
//        return cb();
//      }
//    };
//
//    db.keys(bucket, { keys: 'stream' }).on('keys', queue.push).on('end', function() {
//      receivedAll = true;
//      queue.push(); // we push an empty list here to trigger drain in case we have had no keys in the queue at all
//    }).start();
//  };
//
//  var populateBucket = function(bucket, runIdentifier, cb) {
//    var keys = generateKeysArray(bucket, entriesPerBucket);
//    async.eachLimit(
//      keys,
//      2,
//      function(key, innerCallback) {
//        var object = {
//          data: 'for',
//          key: key,
//          ts: Date.now(),
//          run: runIdentifier
//        };
//
//        var indexes = {
//          index: {
//            runidx: runIdentifier,
//            keyidx: key,
//            numericBin: runIdentifier + '',
//            realNumeric: runIdentifier,
//            int_index_with_underscore: runIdentifier,
//            bin_index_with_underscore: '' + runIdentifier
//          }
//        };
//
//        db.save(bucket, key, object, indexes, function(err, res) {
//          expect(err).to.not.be.ok();
//          if (err) {
//            return innerCallback(err);
//          }
//          innerCallback(null);
//        });
//      },
//      function(err, res) {
//        expect(err).to.not.be.ok();
//        cb(null);
//      }
//    );
//  };
//
//  var checkBucket = function(bucket, runIdentifier, cb) {
//    var keys = generateKeysArray(bucket, entriesPerBucket);
//    async.eachLimit(
//      keys,
//      2,
//      function(key, innerCallback) {
//        db.get(bucket, key, {}, function(err, res, meta) {
//          expect(err).to.not.be.ok();
//          expect(res.data).to.be('for');
//          expect(res.key).to.be(key);
//          expect(res.run).to.be(runIdentifier);
//          expect(meta.headers['x-riak-index-keyidx_bin']).to.be(key);
//          expect(parseInt(meta.headers['x-riak-index-runidx_int'], 10)).to.be(parseInt(runIdentifier, 10));
//          expect(parseInt(meta.headers['x-riak-index-realnumeric_int'], 10)).to.be(parseInt(runIdentifier, 10));
//          expect(meta.headers['x-riak-index-numericbin_bin']).to.be.ok();
//          expect(meta.headers['x-riak-index-numericbin_bin']).to.be(runIdentifier + '');
//          expect(meta.headers['x-riak-index-int_index_with_underscore_int']).to.be.ok();
//          expect(meta.headers['x-riak-index-bin_index_with_underscore_bin']).to.be.ok();
//
//          if (err) {
//            return innerCallback(err);
//          }
//          innerCallback(null);
//        });
//      },
//      function(err, res) {
//        expect(err).to.not.be.ok();
//        cb(null);
//      }
//    );
//  };
//
//  var checkIfBucketIsEmpty = function(bucket, cb) {
//    var keys = generateKeysArray(bucket, entriesPerBucket);
//    async.eachLimit(
//      keys,
//      2,
//      function(key, innerCallback) {
//        db.exists(bucket, key, function(err, exists) {
//          expect(exists).to.be(false);
//          innerCallback(null);
//        });
//      },
//      function(err, res) {
//        expect(err).to.not.be.ok();
//        cb(null);
//      }
//    );
//  };
//
//  beforeEach(function(done) {
//    async.eachLimit(
//      oldBuckets,
//      2,
//      function(bucket, innerCallback) {
//        populateBucket(bucket, 1, innerCallback);
//      },
//      function(err, res) {
//        expect(err).to.not.be.ok();
//        done();
//      }
//    );
//  });
//
//  afterEach(function(done) {
//    async.eachLimit(
//      bucketsToBeCleanedUp,
//      2,
//      function(bucket, innerCallback) {
//        cleanBucket(bucket, innerCallback);
//      },
//      function(err, res) {
//        expect(err).to.not.be.ok();
//        done();
//      }
//    );
//  });
//
//  it('should successfully migrate the bucket entries to their new buckets', function(done) {
//    transfer(oldBuckets, prefix, true, false, [], dummyLogger, function() {
//      async.eachLimit(
//        newBuckets,
//        2,
//        function(bucket, innerCallback) {
//          checkBucket(bucket, 1, innerCallback);
//        },
//        function(err, res) {
//          expect(err).to.not.be.ok();
//          done();
//        }
//      );
//    });
//  });
//
//  it('should successfully migrate edgecases only to the specified target and not to the prefixed bucket', function(done) {
//    var edgeCases = [['dummy1', 'dummy1edge']];
//
//    var edgeCaseBuckets = ['dummy1edge'];
//    var expectedEmpty = [prefix + '_dummy1'];
//    transfer(oldBuckets, prefix, true, false, edgeCases, dummyLogger, function() {
//      async.eachLimit(
//        edgeCaseBuckets,
//        2,
//        function(bucket, innerCallback) {
//          checkBucket(bucket, 1, innerCallback);
//        },
//        function(err, res) {
//          expect(err).to.not.be.ok();
//          async.eachLimit(
//            expectedEmpty,
//            2,
//            function(bucket, innerCallback) {
//              checkIfBucketIsEmpty(bucket, innerCallback);
//            },
//            function(err, res) {
//              expect(err).to.not.be.ok();
//              done();
//            }
//          );
//        }
//      );
//    });
//  });
//
//  it('should transfer the correct secondary indexes as well', function(done) {
//    transfer(oldBuckets, prefix, true, false, [], dummyLogger, function() {
//      async.eachLimit(
//        newBuckets,
//        2,
//        function(bucket, innerCallback) {
//          checkBucket(bucket, 1, innerCallback);
//        },
//        function(err, res) {
//          expect(err).to.not.be.ok();
//          done();
//        }
//      );
//    });
//  });
//
//  it('should forcefully overwrite already transferred entries if -f is enabled', function(done) {
//    var forcedWrite = true;
//    transfer(oldBuckets, prefix, forcedWrite, false, [], dummyLogger, function() {
//      async.eachLimit(
//        oldBuckets,
//        2,
//        function(bucket, innerCallback) {
//          populateBucket(bucket, 2, innerCallback);
//        },
//        function(err, res) {
//          transfer(oldBuckets, prefix, forcedWrite, false, [], dummyLogger, function() {
//            async.eachLimit(
//              newBuckets,
//              2,
//              function(bucket, innerCallback) {
//                checkBucket(bucket, 2, innerCallback);
//              },
//              function(err, res) {
//                expect(err).to.not.be.ok();
//                done();
//              }
//            );
//          });
//        }
//      );
//    });
//  });
//
//  it('should NOT forcefully overwrite already transferred entries is -f is disabled', function(done) {
//    var forcedWrite = false;
//    transfer(oldBuckets, prefix, forcedWrite, false, [], dummyLogger, function() {
//      async.eachLimit(
//        oldBuckets,
//        2,
//        function(bucket, innerCallback) {
//          populateBucket(bucket, 2, innerCallback);
//        },
//        function(err, res) {
//          transfer(oldBuckets, prefix, forcedWrite, false, [], dummyLogger, function() {
//            async.eachLimit(
//              newBuckets,
//              2,
//              function(bucket, innerCallback) {
//                checkBucket(bucket, 1, innerCallback);
//              },
//              function(err, res) {
//                expect(err).to.not.be.ok();
//                done();
//              }
//            );
//          });
//        }
//      );
//    });
//  });
//
//  it('should NOT make any changes in simulation mode even is write is forced', function(done) {
//    var forcedWrite = false;
//    var simulate = true;
//    transfer(oldBuckets, prefix, forcedWrite, simulate, [], dummyLogger, function() {
//      async.eachLimit(
//        newBuckets,
//        2,
//        function(bucket, innerCallback) {
//          checkIfBucketIsEmpty(bucket, innerCallback);
//        },
//        function(err, res) {
//          expect(err).to.not.be.ok();
//          done();
//        }
//      );
//    });
//  });
//
//  it('should only transfer the given buckets if -o is specified', function(done) {
//    var forcedWrite = false;
//    var simulate = true;
//    var onlyOldBuckets = ['dummy1', 'dummy2'];
//    var untouchedNewBuckets = [prefix + '_dummy3', prefix + '_dummy4'];
//    transfer(onlyOldBuckets, prefix, forcedWrite, simulate, [], dummyLogger, function() {
//      async.eachLimit(
//        untouchedNewBuckets,
//        2,
//        function(bucket, innerCallback) {
//          checkIfBucketIsEmpty(bucket, innerCallback);
//        },
//        function(err, res) {
//          expect(err).to.not.be.ok();
//          done();
//        }
//      );
//    });
//  });
//});
