'use strict';

var passport = require('passport');

module.exports = function(app){

    app.post('/login', passport.authenticate('login'), function (req, res) {
        res.send(req.user);
    });

    app.post('/signup', passport.authenticate('signup'), function (req, res) {
        res.send(req.user);
    });

    app.post('/signout', function(req, res) {
    req.logout();
        res.send('signed out');
    });

  return app;
};
