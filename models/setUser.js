'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('setUser',{
    name: String,
    git: String,
    forum: String,
    community: Boolean,
    CI: Boolean,
    maintenance: Boolean,
    position: String
});
