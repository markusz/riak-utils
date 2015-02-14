'use strict';

var packageJson = require('../package.json');
var BucketStatistics = require('../lib/bucket-statistics/bucket-statistics');
var AvailableStatistics = require('../lib/bucket-statistics/metrics');
var RiakJS = require('riak-js');

//Sample usage
//$ node ../transfer_entries_from_non_appId_buckets_runner.js -p 7TV -f -s -e position#7TV_positions
//  -> simulate a run that transfers the default buckets to buckets prefixed by 7TV
//  -> also considers the edgecase that position has to be transferred to 7TV_positions (you have to include the prefix for edge cases!)
//  -> omitting -s will start the actual transfer
var program = require('commander');
var defaults = Object.keys(AvailableStatistics)
program
  .version(packageJson.version)
  .usage('[options] bucketName')
  .option('-o, --only [s]', 'Comma separated list of statistics that should be used instead of all (default: [' + defaults + '])')
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}

var riakDefaultConfig = require('../config/riak').local;
program.host = program.host || riakDefaultConfig.host;
program.port = program.port || riakDefaultConfig.port;

program.emulate = !!program.emulate;

var settings = {
  bucket: program.args,
  host: program.host,
  port: program.port
};

var riakClient = RiakJS.getClient({host: settings.host, port: settings.port});

BucketStatistics.calculateStatistics('7TV_playlists', riakClient, Object.keys(AvailableStatistics), function(results){
  console.log('DONE with results:', results);
});