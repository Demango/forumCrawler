var express = require('express');
var app = express();
var hbs = require('hbs');
var bodyParser = require('body-parser');

var forumApi = require('./forumApi');
var gitApi = require('./gitApi');
var testApi = require('./testApi');

app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(bodyParser());
app.use(express.static('public'));

app.get('/', function(req, res) {
    res.render('index', {title:"Crawler"});
});

app.get('/topics', function(req, res) {
    forumApi.getTopics(function(topics) {
        res.json(topics);
    });
});

app.get('/topics/clear-cache', function(req, res) {
    forumApi.clearCache();
    res.send('Done');
});

app.get('/issues', function(req, res) {
    gitApi.downloadIssues(function(issues) {
        res.json(issues);
    });
});

app.get('/issues/clear-cache', function(req, res) {
    forumApi.clearIssuesCache();
    res.send('Done');
});

app.get('/tests', function(req, res) {
    testApi.downloadTests(function(tests) {
        res.json(tests);
    });
});

app.get('/tests/:name', function(req, res) {
    testApi.getTestInfo(req.params.name, function(testInfo) {
        res.json(testInfo);
    });
});

app.listen(3000);
