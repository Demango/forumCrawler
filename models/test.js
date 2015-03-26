'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('Test', mongoose.Schema({
    url: String,
    name: String,
    color: String,
    view : { type: String, ref: 'View' }
}));
