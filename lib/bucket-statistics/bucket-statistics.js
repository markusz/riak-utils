'use strict';
var BucketStatistics = {};
var KeyStream = require('../keystream');
var AvailableStatistics = require('./metrics');

BucketStatistics.calculateStatistics = function(bucket, riakClient, statistics, cb) {

  var statisticsResults = {};
  statistics = statistics || Object.keys(AvailableStatistics);
  var handler = function(key, cb) {
    riakClient.get(bucket, key, function(err, element, meta) {
      for (var i = 0; i < statistics.length; i++) {
        var currentStatistic = statisticsResults[statistics[i]];
        var updatedStatistic = AvailableStatistics[statistics[i]](currentStatistic, key, element, meta);
        statisticsResults[statistics[i]] = updatedStatistic;
      }
      cb();
    });
  };

  var config = {
    bucket: bucket
  };

  var keyStream = KeyStream.instance(config, riakClient, handler, function() {
    cb(statisticsResults);
  });
  keyStream.start();
};

module.exports = BucketStatistics;