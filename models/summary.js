'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('Summary', mongoose.Schema({
    tests: Number,
    topics: Number,
    issues: Number,
    time: Date
}));
