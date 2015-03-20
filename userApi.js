'use strict';

var _ = require('underscore');
var User = require('./models/setUser');

var users = [];

User.find({}).sort('position').exec(
    function(err, setUsers) {
        if (err){
            console.error(err);
        }
        if (!setUsers){
            console.log('No users found');
        }
        users = setUsers;
    }
);

function saveUsers(){

    User.remove({}, function(err) {
        if(err){
            console.error(err);
        } else { console.log('collection removed'); }
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
                console.log('Error in Saving user: '+err);
                throw err;
            }
            console.log('User Saving succesful');
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
    cb(users);
};
