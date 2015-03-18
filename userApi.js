'use strict';

var fs = require('fs');
var _ = require('underscore');

if (fs.existsSync('./users.json')) {
    var users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
}

function saveUsers(){
    fs.writeFile("./users.json", JSON.stringify(users), function(err) {
        if(err) {
            console.log(err);
        }
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
