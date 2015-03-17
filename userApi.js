'use strict';

var fs = require('fs');
var _ = require('underscore');
var mongoose = require('mongoose');
var db = mongoose.connection;
mongoose.connect('mongodb://localhost/test');

if (fs.existsSync('./users.json')) {
    var users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
}

function saveUsers(){
    fs.writeFile("./users.json", JSON.stringify(users), function(err) {
        if(err) {
            console.log(err);
        }
      });

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        var UserSchema = mongoose.Schema({
            name: String,
            git: String,
            forum: String,
            position: Number,
            community: Boolean,
            CI: Boolean,
            maintenance: Boolean
        });

        var User = mongoose.model('User', UserSchema);
        mongoose.connection.db.dropCollection("users", function() {});

        users.forEach(function(user){

            var newUser = new User({
                name: user.name,
                git: user.git,
                forum: user.forum,
                position: user.position,
                community: user.community,
                CI: user.CI,
                maintenance: user.maintenance
            });

            newUser.save(function (err, newUser) {
            if (err)
                return console.error(err);
            });


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
