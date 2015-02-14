'use strict';
var _ = require('lodash');
var program = require('commander');
program
  .option('-s, --source [s]', 'Source bucket to read keys from')
  .option('-t, --target [s]', 'Target bucket to read keys from')
  .option('-h, --host [s]', 'Database host to connect to (default: localhost)')
  .option('-p, --port [n]', 'Database port to connect on (default: 8096)')
  .parse(process.argv);

var host = program.host || 'localhost';
var port = program.port || 8098;
var source = program.source;
var target = program.target;

if (_.isUndefined(source)) {
  console.error('no source bucket given');
  program.help();
  process.exit(9);
}
if (_.isUndefined(target)) {
  console.error('no target bucket given');
  program.help();
  process.exit(9);
}

var connection = {
  host: host,
  port: port
};

function getKeys(bucket, cb) {
  console.log('acuiring keys for bucket %j', bucket);
  var ar = [];
  var db = require('riak-js').getClient(connection);
  db.keys(bucket, { keys: 'stream' }).on('keys', function(keys) {
    ar.push.apply(ar, keys);
  }).on('end', function(err) {
    return cb(ar);
  }).start();
}

getKeys(source, function(sourceKeys) {
  console.log('%j elements found in the source bucket', sourceKeys.length);
  getKeys(target, function(targetKeys) {
    console.log('%j elements found in the target bucket', targetKeys.length);
    var getMissing = require('./missing_elements.js');
    console.log('aquired keys. sorting....');
    sourceKeys.sort();
    targetKeys.sort();
    var missing = getMissing(sourceKeys, targetKeys);
    console.log('items missing in the source but being in the target: %j', missing[0]);
    console.log('items missing in the target but being in the source: %j', missing[1]);
  });
});