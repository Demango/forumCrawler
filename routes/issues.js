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
        } else { res.sendStatus(401); }
    });

    app.post('/repo_needs_update', function(req, res) {
        if (req.user){
            gitApi.markNeedsUpdate(req.body.repoFullName);
            res.send('Done');
        } else { res.sendStatus(401); }
    });
};
