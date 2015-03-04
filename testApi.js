var http = require("http");
var async = require('async');
var util = require('util');
var fs = require('fs');

var jenkinsUrl;
var jenkinsAuth;
if (fs.existsSync('./parameters.json')) {
    var parameters = JSON.parse(fs.readFileSync('./parameters.json', 'utf8'));
    jenkinsUrl = parameters.jenkins_url || null;
    jenkinsAuth = parameters.jenkins_auth || null;
}

function download(url, callback) {
    http.get(
        {
            hostname: jenkinsUrl,
            path: url,
            auth: jenkinsAuth
        },
        function(res) {
            var data = "";
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on("end", function() {
                callback(JSON.parse(data));
            });
        }
    ).on("error", function(e) {
        console.log(e);
        console.log('request error');
        callback(null);
    });
}

var downloadViews = function(cb) {
    console.log('Loading views...');
    download('/api/json', function(views) {
        if (views) {
            cb(views.views);
        } else {
            console.log(views.views);
            cb([]);
        }
    });
};

exports.downloadTests = function(cb) {

    var tests = [];

    downloadViews(function(views) {
        console.log('starting test download');

        async.eachSeries(views, function(view, callback) {
            if (view.name.substring(0, 4) == "Main")
            {
                console.log('Downloading tests from', view.name);
                download('/view/' + view.name + '/api/json', function(data) {
                    console.log('downloaded');
                    tests.push({
                        view: view,
                        tests: data.jobs
                    });
                    callback();
                }, function(err) {
                    console.log(err);
                });
            } else {
                callback();
            }
        }, function() {
            cb(tests);
        });
    });
};

exports.getTestInfo = function(name, cb) {
    var url = '/job/' + name +'/api/json';

    download(url, function(info) {
        if (info) {
            cb(info);
        } else {
            console.log(info);
            cb([]);
        }
    });

};
