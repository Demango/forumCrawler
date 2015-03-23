'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('Topic', mongoose.Schema({
    url: String,
    title: String,
    author: String,
    age: Date,
    forum : { type: String, ref: 'Forum' }
}));
