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

var sessionKey = null;
if (fs.existsSync('./parameters.json')) {
    var parameters = JSON.parse(fs.readFileSync('./parameters.json', 'utf8'));
    sessionKey = parameters.sessionKey || null;
}

app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(bodyParser());
app.use(express.static('public'));
app.use(express.static('routes'));
app.use(express.static('bower_components'));
app.use(expressSession({secret: sessionKey}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb://localhost/crawler');


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

require('./routes/tests')(app);
require('./routes/users')(app);
require('./routes/issues')(app);
require('./routes/topics')(app);

var initPassport = require('./passport/init');
initPassport(passport);

require('./routes/passport')(app);

app.listen(3000);
