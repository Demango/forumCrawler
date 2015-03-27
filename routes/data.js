'use strict';

var dataApi = require('./../dataApi');

module.exports = function(app) {

    app.post('/summary/create-entry', function(req, res) {
        if (req.user){
            dataApi.saveSummary(req.body);
            res.send('done');
        } else { res.sendStatus(401); }
    });

    app.get('/summaries', function(req, res) {
        dataApi.getSummaries(function(summaries) {
            res.json(summaries);
        });
    });

};
