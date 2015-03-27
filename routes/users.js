'use strict';

var userApi = require('./../userApi');

module.exports = function (app) {

    app.get('/users', function(req, res) {
        if (req.user){
            userApi.getUsers(function(users) {
                res.json(users);
            });
        } else { res.sendStatus(401); }
    });

    app.post('/users', function(req, res){
        if (req.user){
            userApi.createUser(req.body, function(){
                res.send('Done');
            });
        } else { res.sendStatus(401); }
    });

    app.post('/users/delete', function(req, res){
        if (req.user){
            userApi.deleteUser(req.body.username, function(){
                res.send('Done');
            });
        } else { res.sendStatus(401); }
    });

    app.post('/users/update/', function(req, res){
        if (req.user){
            userApi.updateUser(req.body, function(){
                res.send('Done');
            });
        } else { res.sendStatus(401); }
    });

    app.post('/users/update_position', function(req, res){
        if (req.user){
            userApi.updateUserPosition(req.body, function(){
                res.send('Done');
            });
        } else { res.sendStatus(401); }
    });
};
