'use strict';

var forumApi = require('./../forumApi');

module.exports = function (app) {

    app.get('/topics', function(req, res) {
        forumApi.getTopics(function(topics) {
            res.json(topics);
        });
    });

    app.get('/topics/clear-cache', function(req, res) {
        if (req.user){
            forumApi.clearCache().done(function () {
                res.send('Done');
            });
        } else { res.send(); }
    });

};
