'use strict';

var RiakPopulator = require('./../lib/bucket-populate/bucket-populate');
var ENTRIES_TO_CREATE = {
  'xx': 20
};

console.log('Starting RiakPopulationRunner. Be aware that this blocks certain ports');

RiakPopulator.fillMultipleBucketsWithEntries(ENTRIES_TO_CREATE, true, function() {
  process.exit();
});
