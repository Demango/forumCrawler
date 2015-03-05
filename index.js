'use strict';

var express = require('express');
var app = express();
var hbs = require('hbs');
var bodyParser = require('body-parser');

var forumApi = require('./forumApi');
var gitApi = require('./gitApi');
var testApi = require('./testApi');
var userApi = require('./userApi');

app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(bodyParser());
app.use(express.static('public'));
app.use(express.static('bower_components'));

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

app.get('/tests/clear-cache', function(req, res) {
    testApi.clearCache();
    res.send('Done');
});

app.get('/tests/:name', function(req, res) {
    testApi.getTestInfo(req.params.name, function(testInfo) {
        res.json(testInfo);
    });
});

app.get('/users', function(req, res) {
    userApi.getUsers(function(users) {
        res.json(users);
    });
});

app.post('/users', function(req, res){
    userApi.createUser(req.body, function(){
        res.send('Done');
    });
});

app.post('/users/delete', function(req, res){
    userApi.deleteUser(req.body.username, function(){
        res.send('Done');
    });
});

app.listen(3000);
