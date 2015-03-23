'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('Forum', mongoose.Schema({
    url: String,
    name: String,
    topic_count: String,
    reply_count: String,
    freshness: String,
    needs_update: Boolean,
    topics : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }]
}));
