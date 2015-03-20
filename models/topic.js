'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('Topic',{
    url: String,
    title: String,
    author: String,
    age: Date
});
