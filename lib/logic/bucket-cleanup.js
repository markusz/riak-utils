'use strict';

var Position = require('model/records/position');
var async = require('async');
var config = {};
var parallelCleanOperations = 1;
var Utils = require('utils/utils');
var moment = require('moment');
var logInterval = 200;

var program = require('commander');
program
  .option('-f, --from [n]', 'Cleans only positions that have been created with a timestamp > -f (optional)(default: 0)', parseInt)
  .option('-t, --to [n]', 'Cleans only positions that have been created with a timestamp < -t (optional)(default: Date.now() - config.positionTimeout)', parseInt)
  .parse(process.argv);

var cleanExpiredPositions = function(from, to) {
  var start = Date.now();
  var successfullyRemoved = 0;
  console.log('Cleaning up positions with timestamp between %d (%s) and %d (%s)', from, Utils.isoDate(from), to, Utils.isoDate(to));
  Position.getKeysInTimerange(from, to, function(err, res) {
    console.log('Found %d relevant entries after %s sec. Starting the cleanup..', res.length, moment.duration(Date.now() - start).asSeconds());
    if (err || res.length < 1) {
      process.exit(0);
      return;
    }

    async.eachLimit(
      res,
      parallelCleanOperations,
      function(key, innerCallback) {
        Position.removeByKey(key, function(innerErr) {
          if (++successfullyRemoved % logInterval === 0) {
            var timer = moment.duration(Date.now() - start).asSeconds();
            console.log('Cleaned up %d entries after %s s (%d entries/s)', successfullyRemoved, timer, (successfullyRemoved / timer).toFixed(2));
          }
          innerCallback(innerErr);
        });
      },
      function(err, res) {
        console.log('Cleanup finished after %s sec', moment.duration(Date.now() - start).asSeconds());
        process.exit(0);
      }
    );
  });
};

var from = program.from || 0;

var expiredEnd = Date.now() - config.positionTimeout;
var to = program.to || expiredEnd;

//avoid deleting valid positions by accident
if (to > expiredEnd) {
  //https://github.com/joyent/node/blob/master/doc/api/process.markdown#exit-codes
  //9 - Invalid Argument - Either an unknown option was specified, or an option requiring a value was provided without a value.
  process.exit(9);
}

cleanExpiredPositions(from, to);