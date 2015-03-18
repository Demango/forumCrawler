'use strict';

var testApi = require('./../testApi');

module.exports = function (app) {
    if (!testApi.hasToken()) {
        return;
    }

    app.get('/tests', function(req, res) {
        testApi.downloadTests(function(tests) {
            res.json(tests);
        });
    });

    app.get('/tests/clear-cache', function(req, res) {
        testApi.clearCache();
        res.send('Done');
    });

    app.get('/tests/:name', function(req, res) {
        testApi.getTestInfo(req.params.name, function(testInfo) {
            res.json(testInfo);
        });
    });
};
