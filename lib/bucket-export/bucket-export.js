'use strict';

var BucketExport = {};
var KeyStream = require('../keystream');
var fs = require('fs');

BucketExport.exportBucket = function(settings, riakClient, cb) {
  if (fs.existsSync(settings.output)) {
    throw new Error('the output file already exists');
  }
  fs.appendFileSync(settings.output, '[');
  var isFirstElement = true;

  function extractIndexes(meta) {
    var indexes = {};
    var regex = /^x-riak-index-(.*)_(.*)$/;
    for (var key in meta.headers) {
      var matches = key.match(regex);
      if (matches) {
        var name = matches[1];
        var type = matches[2];
        var val = meta.headers[key];
        if (type === 'int') {
          val = parseInt(val, 10);
        }
        indexes[name] = val;
      }
    }
    return indexes;
  }

  var handler = function(key, cb) {
    riakClient.get(settings.bucket, key, function(err, obj, meta) {
      var keyExport = {};
      keyExport.key = key;
      keyExport.indexes = extractIndexes(meta);
      keyExport.data = obj;

      if (!isFirstElement) {
        fs.appendFileSync(settings.output, ',');
      }
      fs.appendFileSync(settings.output, JSON.stringify(keyExport, null, '\t'));
      isFirstElement = false;
      cb();
    });
  };

  var keyStream = KeyStream.instance(settings, riakClient, handler, function() {
    fs.appendFileSync(settings.output, ']');
    cb();
  });
  keyStream.start();
};

module.exports = BucketExport;