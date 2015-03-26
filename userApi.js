'use strict';

var _ = require('underscore');
var Q = require('q');
var User = require('./models/setUser');
var SetUser = require('./models/setUser');


var users = [];

function saveUsers(){

    User.remove({}, function(err) {
        if(err){
            console.error(err);
        }
    });

    users.forEach(function(user){

        var newUser = new User();


        newUser.name = user.name;
        newUser.git = user.git;
        newUser.forum = user.forum;
        newUser.community = user.community;
        newUser.CI = user.CI;
        newUser.maintenance = user.maintenance;
        newUser.position = user.position;

        newUser.save(function(err) {
            if (err){
                console.error('Error in Saving user: '+err);
                throw err;
            }
        });
    });
}

exports.createUser = function(data, cb) {
    users.push(
        {
            'name': data.name,
            'git': data.git,
            'forum': data.forum,
            'community': data.community,
            'CI': data.CI,
            'maintenance': data.maintenance,
            'position': data.position
        }
    );
    saveUsers();
    cb();
};

exports.updateUserPosition = function(data, cb) {
    var user = _.findWhere(users, {name: data.userName});
    user.position = data.pos;
    exports.updateUser(user, cb);
};

exports.deleteUser = function(userName, cb) {
    users = _.reject(users, function(user) {
        return user.name === userName;
    });
    saveUsers();
    cb();
};

exports.updateUser = function(user, cb) {
    users.splice(users.indexOf(_.findWhere(users, {name: user.name})), 1, user);
    saveUsers();
    cb();
};

exports.getUsers = function(cb) {
    User.find({}).exec(
        function(err, setUsers) {
            if (err){
                console.error(err);
            }
            users = setUsers;
            cb(users);
        }
    );
};

exports.getForumNames = function () {
    var deferred = Q.defer();
    var forumNames = [];

    SetUser.find({}, 'forum', function(err, usernames) {
        if (err) {
            console.error(err);
        }
        usernames.forEach(function(user){
            if (user.forum){
                forumNames.push(user.forum);
            }
        });
        deferred.resolve(forumNames);
    });

    return deferred.promise;
};

exports.getGitNames = function () {
    var deferred = Q.defer();
    var gitNames = [];

    SetUser.find({}, 'git', function(err, usernames) {
        if (err) {
            console.error(err);
        }
        usernames.forEach(function(user){
            if (user.git){
                gitNames.push(user.git);
            }
        });
        deferred.resolve(gitNames);
    });

    return deferred.promise;
};
