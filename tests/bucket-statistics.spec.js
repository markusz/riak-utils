var RiakMockServer = require('riak-mock-server');
var RiakJS = require('riak-js');
var RiakPopulator = require('../lib/bucket-populate/bucket-populate');

var expect = require('expect.js');
var chai = require('chai');
var assert = chai.assert;

var BucketStatistics = require('../lib/bucket-statistics/bucket-statistics');
describe('BucketStatistics', function() {
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

  it('should receive no results for a non existing bucket', function(done) {
    BucketStatistics.calculateStatistics('empty_bucket', riakClient, null, function(result) {
      assert.deepEqual(result, {});
      done();
    });
  });

  it('should respond with an error message to an unknown metric', function(done) {
    BucketStatistics.calculateStatistics(bucketName, riakClient, ['no_metric'], function(result) {
      assert.instanceOf(result.no_metric, Error);
      done();
    });
  });

  describe('metric', function() {
    describe('count', function() {
      it('should correctly count the number of elements', function(done) {
        BucketStatistics.calculateStatistics(bucketName, riakClient, ['count'], function(result) {
          expect(result.count.elements).to.be(100);
          done();
        });
      });
    });
  });
});