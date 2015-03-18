'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var https = require('https');
var fs = require('fs');
var async = require('async');
var util = require('util');
var _ = require('underscore');
var Q = require('q');

var ghToken = null;
if (fs.existsSync('./parameters.json')) {
    var parameters = JSON.parse(fs.readFileSync('./parameters.json', 'utf8'));
    ghToken = parameters.gh_token || null;
}

if (fs.existsSync('./users.json')) {
    var users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
}

var isWhitelisted = function(issue) {
    var deferred = Q.defer();

    if (!issue) {
        deferred.resolve(false);
    }

    if (issue.comments) {
        if (_.where(users, {git: issue.user.login})[0] !== undefined){
            deferred.resolve(_.where(users, {git: issue.user.login})[0] !== undefined);
        }
        else{
            downloadJSON(issue.comments_url, function(data){
                deferred.resolve(_.where(users, {git: data[data.length-1].user.login})[0] !== undefined);
            });
        }

    } else {
        deferred.resolve(_.where(users, {git: issue.user.login})[0] !== undefined);
    }

    return deferred.promise;
};

var filterIssues = function (issues) {
    var deferred = Q.defer();
    var promises = [];
    var goodIssues = [];

    _.each(issues, function (issue) {
        promises.push(isWhitelisted(issue).then(function (whitelisted) {
            if (!whitelisted){
                goodIssues.push(issue);
            }
        }));
    });

    Q.all(promises).then(function() {
        console.log('promises done');
        console.log(arguments);
        deferred.resolve(goodIssues);
    });

    return deferred.promise;

    // return isWhitelisted(issue)
    //     .then(function(whitelisted){
    //         deferred.resolve(whitelisted);
    //         console.log(deferred.promise);
    //         return deferred.promise;
    //     })
    //     .catch(function(err) {
    //         console.error(err);
    //     })
    //     .done();
};

function clearCache() {
    if (fs.existsSync("/tmp/issues.json")) {
        fs.unlink("/tmp/issues.json");
        console.log('Cache cleared');
    }
}
exports.clearCache = clearCache;

function downloadJSON(url, callback) {
    var headers = {
        "user-agent": "forum-app",
    };
    if (ghToken) {
        headers.Authorization = "token " + ghToken;
    }
    https.get(
        {
            hostname: 'api.github.com',
            'path': url,
            headers: headers
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
            cb([]);
        }
    });
};

exports.downloadIssues = function(cb) {
    if (fs.existsSync('/tmp/issues.json')) {
        console.log('Loading issues from cache file');
        var cachedIssues = fs.readFileSync('/tmp/issues.json', 'utf-8');
        issues = JSON.parse(cachedIssues).issues;
        return cb(issues);
    }

    var issues = [];

    downloadRepositories(function(repos) {
        console.log('starting issue download from ' + repos.length + ' repositories');

        async.eachSeries(repos, function(repo, callback) {
            console.log('Downloading issues from', repo.full_name);
            downloadJSON('/repos/akeneo/' + repo.name + '/issues', function(data) {
                filterIssues(data)
                    .then(function(data){
                        issues.push({
                            repo: repo,
                            issues: data
                        });
                    })
                    .catch(function (error) {
                        console.error(error);
                    })
                    .done();
                callback();
            });
        }, function() {
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
