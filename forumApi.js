var http = require("http");
var cheerio = require("cheerio");
var async = require('async');
var fs = require('fs');

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

var topicCache = [];
var authorWhitelist = [
  'Nicolas Dupont',
  'Benoit Jacquemont',
  'Julien Janvier',
  'Willy',
  'sumbobyboys',
  'Gildas Quéméner',
  'olivier',
  'Stephan',
  'fitn',
  'rybus',
  'Nuscly',
  'Damien Carcel',
  'Frédéric de Gombert',
  'Filips Alpe',
  'Adrien Pétremann',
  'Charles',
  'Emilie Gieler'
];

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
        forums.push($(e).attr("href"));
        for (var j = 1; j <= 5; j++) {
          forums.push($(e).attr("href") + 'page/' + j + '/');
        }
      });
    }

    cb(forums);
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
    console.log('starting download from forums:', forums);

    async.forEach(forums, function(url, callback) {
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
            if (!resolved && authorWhitelist.indexOf(author) === -1) {
              topics.push(
                {
                  url: $(e).attr("href"),
                  title: title,
                  author: author,
                  age: age
                }
              );
            }
          });
        }
        callback();
      });
    }, function() {
      console.log('done, topics are:', topics, 'a total of', topics.length, 'topics');
      fs.writeFile("/tmp/topics.json", JSON.stringify({ "topics": topics }), function(err) {
          if(err) {
              console.log(err);
          } else {
              console.log("Topics saved to file!");
          }
      });

      cb(topics);
    });
  });
}

function clearCache() {
  if (fs.existsSync("/tmp/topics.json")) {
    fs.unlink("/tmp/topics.json");
    console.log('Cache cleared');
  }
}

function clearIssuesCache() {
  if (fs.existsSync("/tmp/issues.json")) {
    fs.unlink("/tmp/issues.json");
    console.log('Cache cleared');
  }
}

exports.getTopics = downloadTopics;
exports.clearCache = clearCache;
exports.clearIssuesCache = clearIssuesCache;
