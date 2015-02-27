process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var https = require('https');
var fs = require('fs');

var cache = {};

exports.downloadIssues = function(cb) {
    var url = 'https://api.github.com/repos/akeneo/pim-community-dev/issues';

    if (cache[url]) {
        console.log('serving request', url, 'from cache');
        if (cb) {
            cb(cache[url]);
        }
        return;
    }

    var callback = function(response) {
      var str = '';

      response.on('data', function (chunk) {
        str += chunk;
      });

      response.on('end', function () {
        console.log('request completed');
        var result = JSON.parse(str);
        cache[url] = result;
        if (cb) {
            cb(result);
        }
      });
    };

    console.log('starting request to', url);
    https.request({
        hostname: 'api.github.com',
        'path': '/repos/akeneo/pim-community-dev/issues',
        headers: {
             "user-agent": "forumCrawler"
        }
    }, callback).end();
};

setInterval(
  function() {
    cache = {};
  },
  600000
);
