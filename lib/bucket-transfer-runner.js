'use strict';

/**
 * We use an extra runner in order to be able to better test the transfer script with integration tests
 * This runner enables:
 *  - real integration testing
 *  - testing with different simulated process args
 *  while still being able to run the script using node (i.e. for batch jobs)
 */

var transfer = require('./logic/bucket-transfer');
var _ = require('lodash');
var separator = '_';
var defaultBuckets = [
  'favorites',
  'playlists',
  'preferences',
  'interests',
  'subscriptions',
  'sharedStore',
  'receipts',
  'user_crm_activity',
  'crm_events',
  'processed_crm_events'
];

//Sample usage
//$ node ../transfer_entries_from_non_appId_buckets_runner.js -p 7TV -f -s -e position#7TV_positions
//  -> simulate a run that transfers the default buckets to buckets prefixed by 7TV
//  -> also considers the edgecase that position has to be transferred to 7TV_positions (you have to include the prefix for edge cases!)
//  -> omitting -s will start the actual transfer
var program = require('commander');
program
  .option('-f, --force [b]', 'Force overwrite if value exists in new bucket (default: false)')
  .option('-o, --only [s]', 'A comma separated list of buckets that should be used instead of the default buckets (default: [' + defaultBuckets + '])')
  .option('-p, --prefix [s]', 'The prefix of the target bucket, concatenated by "' + separator + '" (required)')
  .option('-e  --edgecases [s]', 'provide edge cases in the format bucket_before#bucket_after" (default: [])')
  .option('-s, --simulation [b]', 'Simulates the run only without changing anything (default: false)')
  .parse(process.argv);

var getBucketNames = function() {
  if (!program.only) {
    return defaultBuckets;
  }
  return program.only.split(',').map(function(bucketName) {
    return bucketName.trim();
  });
};

var getEdgeCases = function() {
  if (!program.edgecases) {
    return [];
  }
  return program.edgecases.split(',').map(function(cases) {
    var edgeCaseAsArray = cases.split('#');
    return edgeCaseAsArray;
  });
};

if (_.isUndefined(program.prefix)) {
  //https://github.com/joyent/node/blob/master/doc/api/process.markdown#exit-codes
  //9 - Invalid Argument - Either an unknown option was specified, or an option requiring a value was provided without a value.
  process.exit(9);
}

var prefix = program.prefix;
var buckets = getBucketNames();
var forcedWrite = _.isUndefined(program.force) ? false : true;
var simulatedRun = _.isUndefined(program.simulation) ? false : true;
var edgeCases = getEdgeCases();

transfer(buckets, prefix, forcedWrite, simulatedRun, edgeCases, null, function() {
  process.exit(0);
});