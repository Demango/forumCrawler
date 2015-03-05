'use strict';

var app = angular.module('app', ['ngRoute']);

app.controller('ForumController', function($http) {
    this.topics = [];

    this.loadingTopics = false;

    this.activeTab = null;

    this.topicCount = 0;

    var self = this;

    this.globalTopicCount = function(){
        var count = 0;
        self.topics.forEach(function(forum){
            count += forum.topics.length;
        });
        return count;
    };

    this.toggleActive = function(tab) {
        if (self.activeTab === tab){
            self.activeTab = null;
        }
        else{self.activeTab = tab;}
    };

    this.loadTopics = function() {
        self.loadingTopics = true;
        $http.get('/topics').then(function(res) {
            self.topics = res.data;
            self.loadingTopics = false;
        });
    };

    this.clearCache = function() {
        $http.get('/topics/clear-cache').then(function() {
            self.loadTopics();
            self.topics = [];
        });
    };

});

app.controller('IssueController', function($http) {

    this.issuesData = [];

    this.loadingIssues = false;

    this.activeTab = null;

    var self = this;

    this.globalIssueCount = function(){
        var count = 0;
        self.issuesData.forEach(function(repo){
            count += repo.issues.length;
        });
        return count;
    };

    this.toggleActive = function(tab) {
        if (self.activeTab === tab){
            self.activeTab = null;
        }
        else{self.activeTab = tab;}
    };

    this.clearCache = function() {
        $http.get('/issues/clear-cache').then(function() {
            self.loadIssues();
            self.issuesData = [];
        });
    };

    this.loadIssues = function() {
        self.loadingIssues = true;
        $http.get('/issues').then(function(res) {
            var issuesData = _.map(res.data, function(repoData) {
                return {
                    repo: repoData.repo,
                    issues: repoData.issues
                };
            });

            self.issuesData = _.filter(issuesData, function(item) {
                return item.issues.length > 0;
            });
            self.loadingIssues = false;
        });
    };
});

app.controller('TestController', function($http) {
    this.tests = [];

    this.activeTab = null;

    this.loadingTests = false;

    this.showGreen = false;

    this.redCount = 0;

    var self = this;

    this.isVisible = function(test) {
        if (/^(yellow|red)/.test(test.color)) {
            return true;
        }
        return this.showGreen;
    };

    this.showButton = function(test) {
        if (/^(yellow|red)/.test(test.color)) {
            return true;
        }else { return false; }
    };

    this.toggleActive = function(tab) {
        if (self.activeTab === tab){
            self.activeTab = null;
        }
        else{self.activeTab = tab;}
    };

    this.loadTests = function(cb) {
        self.loadingTests = true;
        $http.get('/tests').then(function(res) {
            self.tests = res.data;
            self.loadingTests = false;
            if (cb) {
                cb();
            }
        });
    };

    this.getInfo = function(test) {
        $http.get('/tests/' + test.name).then(function(res) {
            test.info = res.data;
        });
    };

    this.redCount = function(tests) {
    var count = 0;
    tests.forEach(function(test){
        if(/^(yellow|red)/.test(test.color)){
            count++;
        }
    });
    return count;
    };

    this.globalRedCount = function(){
        var count = 0;
        this.loadTests(function(){
            self.tests.forEach(function(view){
                view.tests.forEach(function(test){
                    if(/^(yellow|red)/.test(test.color)){
                        count++;
                    }
                });
            });
            self.redCount = count;
        });
    };

    this.clearCache = function() {
        $http.get('/tests/clear-cache').then(function() {
            self.loadTests();
            self.tests = [];
        });
    };

});

app.controller('UserController', function($http) {

    this.users = [];
    this.user = {};
    this.showForm = false;

    var self = this;

    this.loadUsers = function() {
        $http.get('/users').then(function(res) {
            self.users = res.data;
        });
    };

    this.sendForm = function() {
        $http.post('/users', this.user);
        self.user = {};
        self.loadUsers();
    };

    this.deleteUser = function(user) {
        $http.post('/users/delete', { username: user.name });
        self.loadUsers();
    };

});

app.controller('AppController', function() {
    });

app.config(function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'templates/index.html',
            controller: 'AppController',
            controllerAs: 'app'
        }).
        when('/community', {
            templateUrl: 'templates/community.html',
            controller: 'AppController',
            controllerAs: 'app'
        }).
        when('/tests', {
            templateUrl: 'templates/tests.html',
            controller: 'AppController',
            controllerAs: 'app'
        }).
        when('/users', {
            templateUrl: 'templates/users.html',
            controller: 'AppController',
            controllerAs: 'app'
        }).

        otherwise({
            redirectTo: '/'
        });
});
