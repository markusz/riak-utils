var RiakMockServer = require('riak-mock-server');
var RiakJS = require('riak-js');
var RiakPopulator = require('../lib/bucket-populate/bucket-populate');

var expect = require('expect.js');
var chai = require('chai');
var assert = chai.assert;

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
});