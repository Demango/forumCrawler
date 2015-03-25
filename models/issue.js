'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('Issue', mongoose.Schema({
    html_url: String,
    title: String,
    author: String,
    updated_at: Date,
    repository : { type: String, ref: 'Repository' }
}));
