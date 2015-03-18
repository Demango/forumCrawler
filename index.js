'use strict';

var express = require('express');
var app = express();
var hbs = require('hbs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var expressSession = require('express-session');

var forumApi = require('./forumApi');
var gitApi = require('./gitApi');
var testApi = require('./testApi');

app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(bodyParser());
app.use(express.static('public'));
app.use(express.static('routes'));
app.use(express.static('bower_components'));
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb://localhost/passport');


app.get('/config', function(req, res) {
    testApi.getToken(function(token) {
        res.json({
            'showTests': token,
            'signedIn': req.user ? true : false
        });
    });
});

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

require('./routes/tests')(app);
require('./routes/users')(app);

var initPassport = require('./passport/init');
initPassport(passport);

require('./routes/passport')(app);

app.listen(3000);
