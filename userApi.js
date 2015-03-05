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
          } else {
              console.log("Users saved to file!");
          }
      });
}

exports.deleteUser = function(userName, cb) {
    users = _.reject(users, function(user) {
        return user.name === userName;
    });
    console.log('user', userName, 'deleted');
    saveUsers();
    cb();
};

exports.createUser = function(data, cb) {
    users.push(
        {
            'name': data.name,
            'git': data.git,
            'forum': data.forum
        }
    );
    saveUsers();
    cb();
};

exports.getUsers = function(cb) {
    cb(users);
};
