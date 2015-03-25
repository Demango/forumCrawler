'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var https = require('https');
var fs = require('fs');
var async = require('async');
var util = require('util');
var _ = require('underscore');
var Q = require('q');
var userApi = require('./userApi');
var Repository = require('./models/repository');
var Issue = require('./models/issue');

var users = [];

var ghToken = null;
if (fs.existsSync('./parameters.json')) {
    var parameters = JSON.parse(fs.readFileSync('./parameters.json', 'utf8'));
    ghToken = parameters.gh_token || null;
}

var isWhitelisted = function(issue) {
    var deferred = Q.defer();

    if (!issue) {
        deferred.resolve(false);
    }

    if (issue.comments) {
        if (_.contains(users, issue.user.login)){
            deferred.resolve(_.contains(users, issue.user.login));
        }
        else{
            downloadJSON(issue.comments_url, function(data){
                deferred.resolve(_.contains(users, data[data.length-1].user.login));
            });
        }

    } else {
        deferred.resolve(_.contains(users, issue.user.login));
    }

    return deferred.promise;
};

var filterIssues = function (issues) {
    var deferred = Q.defer();
    var promises = [];
    var goodIssues = [];

    userApi.getGitNames()
        .then(function (usernames) {
            users = usernames;
            _.each(issues, function (issue) {
                promises.push(isWhitelisted(issue).then(function (whitelisted) {
                    if (!whitelisted){
                        goodIssues.push(issue);
                    }
                }));
            });
            Q.all(promises).then(function() {
                deferred.resolve(goodIssues);
            });
        });

    return deferred.promise;
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
            async.eachSeries(
                repos,
                updateRepository,
                function () {
                    Repository.find({ 'needs_update': true }, function(err, repos) {
                        if(err){
                            console.error(err);
                        }
                        cb(repos);
                    });
                }
            );
        } else {
            cb([]);
        }
    });
};

exports.downloadIssues = function() {

    downloadRepositories(function(repos) {
        async.eachSeries(repos, function(repo, callback) {
            console.log('Downloading issues from', repo.full_name);
            downloadJSON('/repos/akeneo/' + repo.name + '/issues', function(data) {
                filterIssues(data)
                    .then(function(result){
                        return(updateIssues(repo.full_name, result, function(){
                            markRepositoryUpdated(repo.full_name);
                            callback();
                        }));
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            });
        });
    });
};

exports.getIssues = function(cb) {
    var issues = [];
    Repository.find(function(err, repos){
        if (err) {
            console.error(err);
        }
        async.eachSeries(repos, function(repo, callback){
            Issue.find({'repository': repo._id})
                .populate('repository')
                .lean()
                .exec(function(err, issueData) {
                    if (err) {
                        console.error(err);
                    }
                    issues.push({
                        'repository': repo,
                        'issues': issueData
                    });
                    callback();
                });
        }, function() {
            cb(issues);
        });
    });
};

var updateRepository = function(repoData, callback) {
    Repository.findOne({ 'full_name': repoData.full_name }, function(err, repo) {
        if (!repo) {
            repo = new Repository();
        }
        if (repo.open_issues === repoData.open_issues &&
            !repo.needs_update
        ) {
            repo.needs_update = false;
        } else {
            repo.needs_update = true;
        }

        repo.name = repoData.name;
        repo.full_name = repoData.full_name;
        repo.open_issues = repoData.open_issues;

        repo.save(function(err) {
            if (err){
                console.error('Error in Saving repository: '+err);
            }
            console.log('Repository Saving succesful');
            callback();
        });
    });
};

var updateIssues = function (repoFullName, issues, callback) {
    async.eachSeries(issues, function(issueData, cb) {
        Issue.findOne({ 'html_url': issueData.html_url }, function(err, issue) {
            if (err) {
                console.error(err);
            }
            if (!issue) {
                issue = new Issue();
            }

            issue.html_url = issueData.html_url;
            issue.title = issueData.title;
            issue.author = issueData.user.login;
            issue.updated_at = issueData.updated_at;
            Repository.findOne({ 'full_name': repoFullName }, function(err, repo){
                if (err) {
                    console.error(err);
                }
                issue.repository = repo._id;
                issue.save(function(err) {
                    if (err){
                        console.error('Error in Saving issue: '+err);
                    }
                    console.log('Issue Saving succesful');
                    cb();
                });
            });

        });
    }, function(){
        callback();
    });
};

function markRepositoryUpdated (repoFullName){
    var deferred = Q.defer();

    Repository.findOne({ 'full_name' :  repoFullName },function(err, repo) {
        if (err) {
            console.error(err);
        }

        repo.needs_update = false;
        repo.save(function(err) {
            if (err){
                console.error('Error in Saving repository: '+err);
            }
            deferred.resolve();
        });
    });

    return deferred.promise;
}
