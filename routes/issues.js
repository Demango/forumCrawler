'use strict';

var gitApi = require('./../gitApi');

module.exports = function (app) {

    app.get('/issues', function(req, res) {
        gitApi.downloadIssues(function(issues) {
            res.json(issues);
        });
    });

    app.get('/issues/clear-cache', function(req, res) {
        if (req.user){
            gitApi.clearCache();
            res.send('Done');
        } else { res.send(); }
    });

};
