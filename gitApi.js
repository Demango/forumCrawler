process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var https = require('https');
var fs = require('fs');
var async = require('async');
var util = require('util');
var parameters = JSON.parse(fs.readFileSync('./parameters.json', 'utf8'));

var cache = {};

function downloadJSON(url, callback) {
    https.get(
        {
            hostname: 'api.github.com',
            'path': url,
            headers: {
                "user-agent": "forum-app",
                "Authorization": "token " + parameters.gh_token
            }
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
    ).on("error", function() {
        console.log('request error');
        callback(null);
    });
}

var downloadRepositories = function(cb) {
    console.log('Loading repositories...');
    downloadJSON('/orgs/akeneo/repos', function(repos) {
        if (util.isArray(repos)) {
            cb(repos);
        } else {
            console.log(repos);
            cb([]);
        }
    });
};

exports.downloadIssues = function(cb) {
    if (fs.existsSync('/tmp/issues.json')) {
        console.log('Loading issues from cache file');
        var cachedIssues = fs.readFileSync('/tmp/issues.json', 'utf-8');
        issues = JSON.parse(cachedIssues).issues;
        console.log(issues);
        return cb(issues);
    }

    var issues = [];

    downloadRepositories(function(repos) {
        console.log('starting issue download from ' + repos.length + ' repositories');

        async.eachSeries(repos, function(repo, callback) {
            console.log('Downloading issues from', repo.full_name);
            downloadJSON('/repos/akeneo/' + repo.name + '/issues', function(data) {
                issues.push({
                    repo: repo,
                    issues: data
                });
                callback();
            });
        }, function() {
            console.log('done, got a total of', issues.length, 'issues');
            console.log(issues);
            if (repos.length) {
                fs.writeFile("/tmp/issues.json", JSON.stringify({ "issues": issues }), function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("issues saved to file!");
                    }
                });
            }

            cb(issues);
        });
    });
};

setInterval(
  function() {
    cache = {};
  },
  600000
);
