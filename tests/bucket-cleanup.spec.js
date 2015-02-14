var RiakMockServer = require('riak-mock-server');
var RiakJS = require('riak-js');
var RiakPopulator = require('../lib/bucket-populator/riak_populator');

var expect = require('expect.js');
var chai = require('chai');
var assert = chai.assert;

var BucketCleanup = require('../lib/bucket-cleanup/bucket-cleanup');
var BucketStatistics = require('../lib/bucket-statistics/bucket-statistics');

describe('BucketCleanup', function() {
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

  it('should clean up a bucket', function(done) {
    BucketStatistics.calculateStatistics(bucketName, riakClient, ['count'], function(result) {
      expect(result.count.elements).to.be(100);
      BucketCleanup.cleanBucket(bucketName, riakClient, function(res) {
        BucketStatistics.calculateStatistics(bucketName, riakClient, ['count'], function(result) {
          assert.deepEqual(result, {});
          done();
        });
      });
    });
  });
});