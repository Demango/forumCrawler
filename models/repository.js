'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('Repository', mongoose.Schema({
    name: String,
    full_name: String,
    open_issues: Number,
    needs_update: Boolean,
    issues : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }]
}));
