'use strict';

var express = require('express');
var app = express();
var hbs = require('hbs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var expressSession = require('express-session');
var fs = require('fs');

var testApi = require('./testApi');
var forumApi = require('./forumApi');
var gitApi = require('./gitApi');

var sessionKey = null;
var portToOpen = null;
var allowSigningUp = null;
if (fs.existsSync('./parameters.json')) {
    var parameters = JSON.parse(fs.readFileSync('./parameters.json', 'utf8'));
    sessionKey = parameters.sessionKey || null;
    portToOpen = parameters.portToOpen || 3000;
    allowSigningUp = parameters.allowSigningUp || false;
}

app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(bodyParser());
app.use(express.static('public'));
app.use(express.static('routes'));
app.use(express.static('bower_components'));
app.use(expressSession({
    secret: sessionKey,
    cookie:{_expires : 60000000}
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb://localhost/crawler');


app.get('/config', function(req, res) {
    testApi.getToken(function(token) {
        res.json({
            'showTests': token,
            'signedIn': req.user ? true : false,
            'allowSigningUp': allowSigningUp
        });
    });
});

app.get('/summary', function(req, res) {
    testApi.redCount(function(tests) {
        forumApi.topicCount(function(topics) {
            gitApi.issueCount(function(issues) {
                res.json({
                    'issues': issues,
                    'topics': topics,
                    'tests': req.user ? tests : null
                });
            });
        });
    });
});

app.get('/', function(req, res) {
    res.render('index', {title:"Dashboard"});
});

require('./routes/tests')(app);
require('./routes/users')(app);
require('./routes/issues')(app);
require('./routes/topics')(app);

var initPassport = require('./passport/init');
initPassport(passport);

require('./routes/passport')(app, allowSigningUp);

app.listen(portToOpen);
