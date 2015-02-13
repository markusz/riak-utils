'use strict';

var config = require('../../../config/riak')[process.env.NODE_ENV];
var db = require('riak-js').getClient(config.connection);
var async = require('async');
var moment = require('moment');

var totalEntries = 0;
var totalSkippedEntries = 0;
var totalMigratedEntries = 0;
var parallelBucketTransfers = 2;
var separator = '_';
var logFn = console.log;
var _ = require('lodash');
var ArrayUtils = require('../../../lib/utils/array_utils');

var migrateBucket = function(fromBucket, targetBucket, prefix, forced, simulated, cb) {
  var bucketStart = Date.now();
  var receivedAll = false;

  var extractIndexesFromMeta = function(meta) {
    var indexes = {};
    var regex = /^x-riak-index-(.*)$/;
    for (var key in meta.headers) {
      if (meta.headers.hasOwnProperty(key)) {
        var matches = key.match(regex);
        if (matches) {

          ArrayUtils.splitStringIntoArrayOnLastOccurrence(matches[1], '_');

          var splittedToKeyAndKeyType = ArrayUtils.splitStringIntoArrayOnLastOccurrence(matches[1], '_');
          var isNumeric = splittedToKeyAndKeyType[1] === 'int';

          var value = meta.headers[key];
          indexes[splittedToKeyAndKeyType[0]] = isNumeric ? parseInt(value, 10) : value;
        }
      }
    }
    return indexes;
  };

  var queue = async.queue(function(key, cb) {
    if (!key) {
      return cb();
    }

    db.exists(targetBucket, key, function(err, exists) {
      if (totalEntries % 200 === 0 && totalEntries > 0) {
        logFn('Processed %d entries from bucket %s: Migrated %d and skipped %d (%d %) in %d seconds', totalEntries, fromBucket, totalMigratedEntries, totalSkippedEntries, Number((totalSkippedEntries / totalEntries * 100).toFixed(3)), moment.duration(Date.now() - bucketStart).asSeconds());
      }
      ++totalEntries;
      if (!exists || (exists && forced)) {
        db.get(fromBucket, key, function(err, element, meta) {
          var indexes = extractIndexesFromMeta(meta);
          if (simulated) {
            ++totalMigratedEntries;
            return cb();
          }
          var index = { index: indexes };
          db.save(targetBucket, key, element, index, function(err, res) {
            ++totalMigratedEntries;
            return err ? cb(err) : cb();
          });
        });
      } else {
        ++totalSkippedEntries;
        cb();
      }
    });
  }, 100);
  queue.drain = function() {
    if (receivedAll) {
      logFn('Transfer of %d entries in bucket "%s"\t to \t "%s" \t took %d \tseconds (%d skipped)', totalMigratedEntries, fromBucket, targetBucket, moment.duration(Date.now() - bucketStart).asSeconds(), totalSkippedEntries);
      queue.kill();
      return cb();
    }
  };

  db.keys(fromBucket, { keys: 'stream' }).on('keys', queue.push).on('end', function() {
    receivedAll = true;
    queue.push(); // we push an empty list here to trigger drain in case we have had no keys in the queue at all
  }).start();

};

var transferBucketEntries = function(buckets, prefix, forcedMode, simulationMode, edgeCases, logger, cb) {
  if (logger && _.isFunction(logger)) {
    logFn = logger;
  }
  var getTargetBucket = function(bucket) {
    for (var i = 0; i < edgeCases.length; i++) {
      if (edgeCases[i][0] === bucket) {
        return edgeCases[i][1];
      }
    }
    return prefix + '' + separator + '' + bucket;
  };

  var start = Date.now();
  logFn('-------------------------------------------------------- CONFIG --------------------------------------------------');
  logFn('Buckets:', buckets);
  logFn('Target bucket prefix is:', prefix);
  logFn('Force write is set to', forcedMode, forcedMode ? ' -> BE CAREFUL!' : '');
  logFn('-------------------------------------------------------- BUCKETS -------------------------------------------------');

  async.eachLimit(
    buckets,
    parallelBucketTransfers,
    function(fromBucket, innerCallback) {
      migrateBucket(fromBucket, getTargetBucket(fromBucket), prefix, forcedMode, simulationMode, function(err) {
        return err ? innerCallback(err) : innerCallback();
      });
    },
    function(err, res) {
      logFn('-------------------------------------------------------- SUMMARY -------------------------------------------------');
      if (simulationMode) {
        logFn('[SIMULATION] [SIMULATION] [SIMULATION] Nothing changed [SIMULATION] [SIMULATION] [SIMULATION]');
      }
      logFn('Transfer of %d buckets with a total of %d transferred entries took %s seconds (%d skipped)', buckets.length, totalEntries, moment.duration(Date.now() - start).asSeconds(), totalSkippedEntries);
      if (simulationMode) {
        logFn('[SIMULATION] [SIMULATION] [SIMULATION] Nothing changed [SIMULATION] [SIMULATION] [SIMULATION]');
      }
      logFn('------------------------------------------------------------------------------------------------------------------');
      cb(err, res);
    }
  );
};

module.exports = transferBucketEntries;