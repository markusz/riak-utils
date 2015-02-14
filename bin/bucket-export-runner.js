'use strict';
var packageJson = require('../package.json');
var BucketExport = require('../lib/bucket-export/bucket-export');

var program = require('commander');
program
  .version(packageJson.version)
  .usage('[options] bucketName')
  .option('-o, --output [s]', '(Optional) The name of the output-file. Defaults to [bucket-name].json')
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}

var riakDefaultConfig = require('../config/riak').local;
program.host = program.host || riakDefaultConfig.host;
program.port = program.port || riakDefaultConfig.port;

program.emulate = !!program.emulate;

var settings = {
  bucket: program.args[0],
  host: program.host,
  port: program.port,
  output: program.output || program.args[0] + Math.random() + '.json'
};

var riakClient = require('riak-js')({ host: settings.host, port: settings.port });

BucketExport.exportBucket(settings, riakClient, function(results) {
  console.log('DONE with results:', results);
});