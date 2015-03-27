'use strict';

var _ = require('underscore');

var Summary = require('./models/summary');

exports.saveSummary = function(summaryData) {
    var currentTime = new Date();

    Summary.findOne({}, {}, { sort: { 'time': -1 } }, function(err, summary) {
        if (err) {
            console.error(err);
        }
        if ( !summary ||
            (
            summary.tests != summaryData.tests ||
            summary.topics != summaryData.topics ||
            summary.issues != summaryData.issues ||
            summary.time.toDateString() != currentTime.toDateString()
            )
        ) {
            summary = new Summary();

            summary.time = currentTime;
            summary = _.defaults(summary, summaryData);

            summary.save(function(err) {
                if (err){
                    console.error('Error in Saving summary: '+err);
                }
            });
        }
    });
};

exports.getSummaries = function(cb) {
    Summary.find(function(err, summaries) {
        if (err) {
            console.error(err);
        }

        cb(summaries);
    });
};
