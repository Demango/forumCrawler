'use strict';

var gitApi = require('./../gitApi');

module.exports = function (app) {

    app.get('/issues', function(req, res) {
        gitApi.getIssues(function(issues) {
            res.json(issues);
        });
    });

    app.get('/issues/clear-cache', function(req, res) {
        if (req.user){
            gitApi.downloadIssues();
            res.send('Done');
        } else { res.send(); }
    });

};
