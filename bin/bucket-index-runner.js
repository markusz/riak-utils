'use strict';
var RebuildIndexesLogic = require('./../lib/bucket-index');

/*

 * BUCKET is the name of the bucket which contains all keys that should be loaded for the model
 * PATH_TO_MODEL has to be a path to a model that can be loaded and instantiated with each bucket key by using Model.load(key, callback) and model.save(callback). Each model instance also needs to contain an hash of all _indexes
 * NUM_OF_PARALLEL_ITEMS is how many items will be processed in parallel by the script (usually around 100)
 */
var program = require('commander');
program
  .option('-b, --bucket <String>', 'Bucket name')
  .option('-m, --model <String>', 'Path to model')
  .option('-n, --numParallel <n>', 'Number of items processed in parallel')
  .option('-ns, --namespace <String>', 'The namespace')
  .option('-f, --forced', 'force the rebuild for EVERY key <optional>')
  .option('-s, --simulate', 'do a simulated run <optional>')
  .parse(process.argv);

if (!program.bucket) {
  console.log('bucket is required');
  process.exit(0);
}
if (!program.model) {
  console.log('model is required');
  process.exit(0);
}
if (!program.numParallel) {
  console.log('parallelRequests is required');
  process.exit(0);
}
if (!program.namespace) {
  console.log('namespace is required');
  process.exit(0);
}

var forceRebuild = false;
if (program.forced) {
  forceRebuild = true;
}

var simulate = false;
if (program.simulate) {
  simulate = true;
}

RebuildIndexesLogic.startRebuilding(program.bucket, program.model, program.namespace, program.numParallel, forceRebuild, simulate, console.log, function() {
  console.log('done');
  process.exit(0);
});