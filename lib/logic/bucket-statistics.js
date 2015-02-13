'use strict';

var Position = require('model/records/position');
var async = require('async');
var parallelOperations = 1;
var moment = require('moment');

var program = require('commander');
program
  .option('-d, --days [n]', 'Goes back d days (required)', parseInt)
  .option('-t, --to [n]', 'The date (DD.MM.YYYY) until the evaluation goes to. Values are calculated for the intervall [t-d; t] (default: today())')
  .parse(process.argv);

var showStatistic = function(from, to) {

  var interval = 24 * 60 * 60 * 1000;

  to = moment(to, 'DD.MM.YYYY').startOf('day').valueOf();

  var steps = [to];
  for (var i = to - interval; i > from; i -= interval) {
    steps.push(i);
  }
  console.log('Calculating statistics for date d between %s < d <= %s', moment(from).format('DD.MM.YYYY'), moment(to).format('DD.MM.YYYY'));
  var result = {};

  async.eachLimit(
    steps,
    parallelOperations,
    function(start, innerCallback) {
      Position.getKeysInTimerange(start, start + interval, function(err, res) {
        if (err) {
          result[start] = 0;
        } else {
          result[moment(start).format('DD.MM.YYYY') + ' (' + moment(start).valueOf() + ')'] = res.length;
        }

        innerCallback(null);
      });
    },
    function(err, res) {
      console.log(result);
      process.exit(0);
    }
  );
};

if (!program.days) {
  //https://github.com/joyent/node/blob/master/doc/api/process.markdown#exit-codes
  //9 - Invalid Argument - Either an unknown option was specified, or an option requiring a value was provided without a value.
  process.exit(9);
}

var to = program.to ? program.to : moment().format('DD.MM.YYYY').valueOf();
var from = moment(to, 'DD.MM.YYYY').valueOf() - program.days * 24 * 60 * 60 * 1000;

showStatistic(from, to);