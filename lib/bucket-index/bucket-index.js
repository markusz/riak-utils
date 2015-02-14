'use strict';
var async = require('async');
var receivedAll = false;
var entriesProcessedTotal = 0;
var entriesProcessedRepaired = 0;
var config = require('../../config/riak')[process.env.NODE_ENV];
var db = require('riak-js').getClient(config.connection);
var modelFactory = require('model/model_factory');
var logFn = console.log;
var forceRebuild = false;
var simulate = false;

var RebuildIndexesLogic = {};

RebuildIndexesLogic.handleEntity = function(key, Model, callback) {
  Model.load(key, function(err, instance) {
    if (++entriesProcessedTotal % 100 === 0) {
      logFn('Repaired %s / %s Entries (%s %)', entriesProcessedRepaired, entriesProcessedTotal, Number((entriesProcessedRepaired / entriesProcessedTotal * 100).toFixed(2)));
    }

    //[MZ] using the callbacks with arguments would not be necessary here but enables a better testing by checking the callback type
    if (err) {
      return callback(null);
    }

    if (Object.keys(instance._indexes).length > 0 && !forceRebuild) {
      return callback(null);
    }

    if (simulate) {
      ++entriesProcessedRepaired;
      logFn('[SIMULATION]' + ' Would rebuild indexes: ' + JSON.stringify(instance._indexes) + ' (#' + entriesProcessedRepaired + ')');
      return callback(null);
    }

    instance.save(function(err) {
      if (err) {
        logFn('failed to save instance %j: %j', instance.key(), err);
        return callback(null, instance);
      }
      entriesProcessedRepaired++;
      return callback(null, instance);
    });
  });
};

RebuildIndexesLogic.startRebuilding = function(bucket, model, namespace, parallelRequests, forceRebuilding, simulationMode, logger, cb) {
  if (forceRebuilding) {
    forceRebuild = forceRebuilding;
  }

  if (simulationMode) {
    simulate = simulationMode;
  }

  logFn = logger ? logger : logFn;
  var Model = modelFactory.get(model, namespace);

  var queue = async.queue(function(key, callback) {
    RebuildIndexesLogic.handleEntity(key, Model, callback);
  }, parallelRequests);

  function tryFinish() {
    if (receivedAll) {
      logFn('everything done. %j entries processed.', entriesProcessedTotal);
      cb();
    }
  }

  queue.drain = function() {
    tryFinish();
  };

  db.keys(bucket, { keys: 'stream' }).on('keys', queue.push).on('end', function() {
    receivedAll = true;
    if (queue.idle()) {
      tryFinish();
    }
  }).start();
};

module.exports = RebuildIndexesLogic;