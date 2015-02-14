var async = require('async');
var preconditions = require('preconditions');

var KeyStream = function(options, riakClient, handler, cb) {
  var optionsPreconditionChecker = preconditions.instance(options);
  optionsPreconditionChecker.shouldBeString('bucket');

  var parallelRequests = options.parallel || 20;
  var queue = async.queue(function(key, cb) {
    if (!key) {
      return cb();
    }

    handler(key, cb);
  }, parallelRequests);
  var finished = false;

  queue.drain = function() {
    if (finished) {
      return cb();
    }
  };

  this.stream = riakClient.keys(options.bucket, { keys: 'stream' })
    .on('keys', queue.push)
    .on('end', function() {
      finished = true;
      queue.push();
    });
};

KeyStream.prototype.start = function() {
  this.stream.start();
};

module.exports = {
  instance: function(options, riakClient, handler, cb) {
    return new KeyStream(options, riakClient, handler, cb);
  }
};
