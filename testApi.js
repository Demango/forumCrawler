'use strict';

var http = require("http");
var async = require('async');
var fs = require('fs');

var View = require('./models/view');
var Test = require('./models/test');

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
                console.log(url);
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
    download('/api/json', function(viewsData) {
        if (viewsData) {
            updateViews(viewsData.views, function() {
                cb(viewsData.views);
            });
        } else {
            cb([]);
        }
    });
};

var updateViews = function(views, cb) {
    async.eachSeries(views, function(viewData, callback) {
        if (/^Main/.test(viewData.name)) {
            console.log('viewData.url: ' + viewData.url);
            View.findOne({ 'url': viewData.url }, function(err, view) {
                if (err) {
                    console.error(err);
                }
                if (!view) {
                    view = new View();
                }
                view.url = viewData.url;
                view.name = viewData.name;

                view.save(function(err) {
                    if (err){
                        console.error('Error in Saving view: '+err);
                    }
                    console.log('View Saving succesful');
                    callback();
                });

            });
        } else { callback(); }
    },function() {
        cb();
    });
};

var downloadTests = function() {
    var tests = [];

    downloadViews(function(views) {
        console.log('starting test download');

        async.eachSeries(views, function(view, callback) {
            if (/^Main/.test(view.name))
            {
                console.log('Downloading tests from', view.name);
                download('/view/' + view.name + '/api/json', function(data) {
                    console.log('downloaded');
                    tests.push({
                        view: view.url,
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
            tests.forEach(function(view){
                async.eachSeries(view.tests, function(testData, callback) {
                    Test.findOne({ 'url': testData.url }, function(err, test) {
                        if (err) {
                            console.error(err);
                        }
                        if (!test) {
                            test = new Test();
                        }
                        test.url = testData.url;
                        test.name = testData.name;
                        test.color = testData.color;

                        View.findOne({ 'url': view.view }, function(err,viewData) {
                            if (err) {
                                console.error(err);
                            }
                            test.view = viewData._id;

                            test.save(function(err) {
                                if (err){
                                    console.error('Error in Saving test: '+err);
                                }
                                console.log('Test Saving succesful');
                                callback();
                            });
                        });
                    });
                });
            });
        });
    });
};

exports.getToken = function(cb) {
    if (jenkinsUrl && jenkinsAuth){
        cb(true);
    } else { cb(false); }
};

exports.hasToken = function() {
    var token;
    exports.getToken(function(res){
        token = res;
    });
    return token;
};

exports.redCount = function(cb) {
    Test.find({color: /^(yellow|red)/}, function(err, tests){
        if (err) {
            console.error(err);
        }
        cb(tests.length);
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

exports.getTests = function(cb) {
    var tests = [];
    View.find(function(err, views){
        if (err) {
            console.error(err);
        }
        async.eachSeries(views, function(view, callback){
            Test.find({'view': view._id})
                .populate('view')
                .lean()
                .exec(function(err, testData) {
                    if (err) {
                        console.error(err);
                    }
                    tests.push({
                        'view': view,
                        'tests': testData
                    });
                    callback();
                });
        }, function() {
            cb(tests);
        });
    });
};

exports.downloadTests = downloadTests;
exports.clearCache = downloadTests;
