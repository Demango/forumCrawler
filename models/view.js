'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('View', mongoose.Schema({
    url: String,
    name: String,
    tests : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }]
}));
