'use strict';

var http = require('http');
var cheerio = require('cheerio');
var async = require('async');
var Q = require('q');
var Forum = require('./models/forum');
var Topic = require('./models/topic');
var userApi = require('./userApi');

var forumUrl = 'http://www.akeneo.com/forums/';

function download(url, callback) {
    http.get(url, function(res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on("end", function() {
            callback(data);
        });
    }).on("error", function() {
        callback(null);
    });
}

function parseAge(age) {
    age = age.replace(/ /g, "");
    age = age.split(",");
    var parsedAge = 0;

    age.forEach(function(block)
    {
        var newAge = block.match(/\d+/)[0];
        newAge = parseInt(newAge);

        var ageStr = block.match(/[a-zA-Z]+/)[0];

        if (ageStr === 'hours' || ageStr === 'hour') {
            newAge = newAge * 60;
        }
        if (ageStr === 'days' || ageStr === 'day') {
            newAge = newAge * 1440;
        }
        if (ageStr === 'weeks' || ageStr === 'week') {
            newAge = newAge * 10080;
        }
        if (ageStr === 'months' || ageStr === 'month') {
            newAge = newAge * 43829.1;
        }
        if (ageStr === 'years' || ageStr === 'year') {
            newAge = newAge * 525949.2;
        }
        parsedAge += newAge;
    });


    parsedAge = parsedAge * 60000;
    return new Date(Date.now() - parsedAge);
}

function updateForum (forumData, callback) {
    Forum.findOne({ 'url' :  forumData.url },function(err, forum) {
        if (!forum) {
            forum = new Forum();
            console.log('making new entry');
        }

        if (forum.topic_count === forumData.topic_count &&
            forum.reply_count === forumData.reply_count &&
            !forum.needs_update
        ) {
            forum.needs_update = false;
        } else {
            forum.needs_update = true;
        }

        forum.url = forumData.url;
        forum.name = forumData.name;
        forum.topic_count = forumData.topic_count;
        forum.reply_count = forumData.reply_count;
        forum.freshness = forumData.freshness;

        forum.save(function(err) {
            if (err){
                console.error('Error in Saving forum: '+err);
            }
            console.log('Forum Saving succesful');
            callback();
        });
    });
}

function markForumUpdated (forumData){
    var deferred = Q.defer();

    Forum.findOne({ 'url' :  forumData.url },function(err, forum) {
        if (err) {
            console.error(err);
        }

        forum.needs_update = false;
        forum.save(function(err) {
            if (err){
                console.error('Error in Saving forum: '+err);
            }
            console.log('Forum Saving succesful');
            deferred.resolve();
        });
    });

    return deferred.promise;
}

function updateTopic(topicData) {
    var deferred = Q.defer();

    Topic.findOne({ 'url' :  topicData.url },function(err, topic) {
        if (!topic) {
            topic = new Topic();
            console.log('making new entry');
        }

        topic.url = topicData.url;
        topic.title = topicData.title;
        topic.author = topicData.author;
        topic.age = topicData.age;
        topic.forum = topicData.forum._id;

        topic.save(function(err) {
            if (err){
                console.error('Error in Saving topic: '+err);
            }
            console.log('Topic Saving succesful');
            deferred.resolve();
        });
    });

    return deferred.promise;
}

function getTopics(cb) {
    var promises = [];

    var topics = [];
    userApi.getForumNames().done(function (usernames) {
        Forum.find(function(err, forums){
            forums.forEach(function(forum){
                promises.push(Topic.find({'author': { $nin: usernames }, 'forum': forum._id})
                    .populate('forum')
                    .lean()
                    .exec(function(err, topicData) {
                        if (err) {
                            console.error(err);
                        }
                        topics.push({
                            'forum': forum,
                            'topics': topicData
                        });
                    }));
            });
            Q.all(promises).done(function () {
                cb(topics);
            });
        });
    });
}

function downloadForums(cb) {
    download(forumUrl, function(data) {
        var forums = [];
        if (data) {
            var $ = cheerio.load(data);
            $("a.bbp-forum-title").each(function(i, e) {
                forums.push(
                    {
                        'url': $(e).attr("href"),
                        'name':  $(e).text(),
                        'topic_count': $(e).parent().siblings('.bbp-forum-topic-count').text(),
                        'reply_count': $(e).parent().siblings('.bbp-forum-reply-count').text(),
                        'freshness': $(e).parent().siblings('.bbp-forum-freshness').find('a:first-child').text()
                    }
                );
            });
            async.eachSeries(
                forums,
                updateForum,
                function () {
                    console.log('forums up to date');
                    cb();
                }
            );
        } else {
            console.log('nothing found');
            cb();
        }
    });
}

function downloadTopics(callback) {
    var deferred = Q.defer();
    var promises = [];

    downloadForums(function() {
        Forum.find({ 'needs_update': true }, function(err, forums) {
            forums.forEach(function (forum) {
                promises.push(downloadForumTopics(forum));
            });

            Q.all(promises).done(function () {
                console.log('everything up to date');
                callback();
                deferred.resolve();

            });
        });
    });

    return deferred.promise;
}

function downloadTopicPage(url, forum) {
    var deferred = Q.defer();
    var topics = [];

    download(url, function(data) {
        var $ = cheerio.load(data);
        $("ul.topic:not(.super-sticky) a.bbp-topic-permalink").each(function(i, e) {
            var resolved = $(e).siblings('span.resolved').length;
            // console.log('resolved:', resolved);
            var title = $(e).attr("title");
            // console.log('title:', title);
            var author = $(e).parent().siblings('.bbp-topic-freshness').find('.bbp-topic-freshness-author .bbp-author-name').text();
            // console.log('author:', author);
            var age = $(e).parent().siblings('.bbp-topic-freshness').find('a').text().replace(/ago.*$/i, "");
            age = parseAge(age);
            // console.log('age:', age);
            if (!resolved) {
                topics.push({
                    url: $(e).attr("href"),
                    title: title,
                    author: author,
                    age: age,
                    forum: forum
                });
            }
        });
        deferred.resolve(topics);
    });

    return deferred.promise;
}

function downloadForumTopics(forum) {
    var url = forum.url;
    var promises = [];
    var updatePromises = [];
    var urls = [];
    urls.push(url);

    for (var j = 1; j <= 5; j++) {
        urls.push(url + 'page/' + j + '/');
    }

    var deferred = Q.defer();

    urls.forEach(function(url) {
        promises.push(downloadTopicPage(url, forum));
    });

    Q.all(promises).done(function(results) {
        results.forEach(function (topics) {
            topics.forEach(function (topic) {
                updatePromises.push(updateTopic(topic));
            });
        });

        updatePromises.push(markForumUpdated(forum));

        Q.all(updatePromises).done(function() {
            deferred.resolve();
        });
    });

    return deferred.promise;
}

exports.getTopics = getTopics;
exports.clearCache = downloadTopics;
