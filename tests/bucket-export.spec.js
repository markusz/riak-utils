var RiakMockServer = require('riak-mock-server');
var RiakJS = require('riak-js');
var RiakPopulator = require('../lib/bucket-populator/riak_populator');
var _ = require('lodash');

var expect = require('expect.js');
var chai = require('chai');
var assert = chai.assert;
var fs = require('fs');

var BucketExport = require('../lib/bucket-export/bucket-export');
describe('BucketExport', function() {
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

  var fileName = bucketName + '.json';
  var relativeFilePath = fileName;
  beforeEach(function() {
    if (fs.existsSync(relativeFilePath)) {
      fs.unlinkSync(relativeFilePath);
    }
  });

  var settings = {
    bucket: bucketName,
    output: fileName
  };

  it('export the bucket', function(done) {
    BucketExport.exportBucket(settings, riakClient, function(filePath) {
      var exported = require('../' + filePath);
      expect(exported.length).to.be(100);
      for (var i = 0; i < exported.length; i++) {
        var entry = exported[i];
        expect(entry.key).to.be.ok();
        expect(entry.indexes).to.be.ok();
        expect(entry.indexes.stringidx).to.be.ok();
        expect(entry.data).to.be.ok();
        expect(entry.data.my_string_value).to.be.ok();
        expect(_.startsWith(entry.data.my_string_value, 'number_')).to.be(true);
      }
      done();
    });
  });
});