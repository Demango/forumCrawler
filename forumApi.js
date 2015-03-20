'use strict';

var http = require("http");
var cheerio = require("cheerio");
var async = require('async');
var fs = require('fs');
var Forum = require('./models/forum');
var Topic = require('./models/topic');

var forumUrl = "http://www.akeneo.com/forums/";

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

        if (ageStr == 'hours' || ageStr == 'hour') {
            newAge = newAge * 60;
        }
        if (ageStr == 'days' || ageStr == 'day') {
            newAge = newAge * 1440;
        }
        if (ageStr == 'weeks' || ageStr == 'week') {
            newAge = newAge * 10080;
        }
        if (ageStr == 'months' || ageStr == 'month') {
            newAge = newAge * 43829.1;
        }
        if (ageStr == 'years' || ageStr == 'year') {
            newAge = newAge * 525949.2;
        }
        parsedAge += newAge;
    });


    parsedAge = parsedAge * 60000;
    return new Date(Date.now() - parsedAge);
}


function downloadForums(cb) {
    var forums = [];

    download(forumUrl, function(data) {
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
            forums.forEach(function(forumData){
                Forum.findOne({ 'url' :  forumData.url },function(err, forum) {
                    if (!forum) {
                        forum = new Forum();
                        console.log('making new entry');
                    }

                    if (
                        forum.topic_count == forumData.topic_count &&
                        forum.reply_count == forumData.reply_count
                    ){
                        forum.needs_update = false;
                    } else { forum.needs_update = true; }
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
                    });
                });
            });
        }
        cb(forums);
    });
}

function getTopics(cb) {
    Topic.find(function(err, topics){
        if (err){
            console.error(err);
        }
        cb(topics);
    });
}

function downloadTopics(cb) {
    if (fs.existsSync('/tmp/topics.json')) {
        console.log('Loading topics from cache file');
        var cachedTopics = fs.readFileSync('/tmp/topics.json', 'utf-8');
        topics = JSON.parse(cachedTopics).topics;
        return cb(topics);
    }

    var topics = [];

    downloadForums(function(forums) {
        forums.forEach(function(forum) {
            if (forum.needs_update){
                downloadForumTopics(forum.url);
            }
        });
    });
}

function downloadForumTopics(url) {
    var topics = [];
    var urls = [];
    urls.push(url);

    for (var j = 1; j <= 5; j++) {
        urls.push(url + 'page/' + j + '/');
    }

    async.eachSeries(
        urls,
        function(url, callback) {
            download(url, function(data) {
                if (data) {
                    var $ = cheerio.load(data);
                    $("ul.topic:not(.super-sticky) a.bbp-topic-permalink").each(function(i, e) {
                        var resolved = $(e).siblings('span.resolved').length;
                        console.log('resolved:', resolved);
                        var title = $(e).attr("title");
                        console.log('title:', title);
                        var author = $(e).parent().siblings('.bbp-topic-freshness').find('.bbp-topic-freshness-author .bbp-author-name').text();
                        console.log('author:', author);
                        var age = $(e).parent().siblings('.bbp-topic-freshness').find('a').text().replace(/ago.*$/i, "");
                        age = parseAge(age);
                        console.log('age:', age);
                        if (!resolved) {
                            topics.push(
                            {
                                url: $(e).attr("href"),
                                title: title,
                                author: author,
                                age: age
                            });
                        }
                    });
                }
                callback();
            });
        }, function () {
            topics.forEach(function(topicData){
                Topic.findOne({ 'url' :  topicData.url },function(err, topic) {
                    if (!topic) {
                        topic = new Topic();
                        console.log('making new entry');
                    }
                    topic.url = topicData.url;
                    topic.title = topicData.title;
                    topic.author = topicData.author;
                    topic.age = topicData.age;

                    topic.save(function(err) {
                        if (err){
                            console.error('Error in Saving topic: '+err);
                        }
                        console.log('Topic Saving succesful');
                    });
                });
            });
        }
    );
}

function clearCache() {
    if (fs.existsSync("/tmp/topics.json")) {
        fs.unlink("/tmp/topics.json");
        console.log('Cache cleared');
    }
}

exports.getTopics = getTopics;
exports.clearCache = clearCache;
