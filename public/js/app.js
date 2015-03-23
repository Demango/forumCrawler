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
        $http.get('/topics').then(function(res) {
            self.topics = res.data;
            self.loadingTopics = false;
        });
    };

    this.clearCache = function() {
        self.loadingTopics = true;
        self.topics = [];
        $http.get('/topics/clear-cache').then(function() {
            self.loadTopics();
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
    this.editingUser = {};
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
        self.showForm = false;
        self.loadUsers();
    };

    this.sendUpdate = function(user) {
        self.user = user;
        $http.post('/users/update',  this.user );
        self.user = {};
        self.loadUsers();
    };

    this.deleteUser = function(user) {
        $http.post('/users/delete', { username: user.name });
        self.loadUsers();
    };

    this.selectEdit = function(user) {
        self.editingUser = user;
    };
});

app.controller('AppController', function($http) {

    this.config = {};
    this.location = null;

    var self = this;

    this.loadConfig = function() {
        $http.get('/config').then(function(res) {
            self.config = res.data;
        });
    };

});

app.controller('LoginController', function($http, $location) {

    this.login = function(user) {
        $http.post('/login', user).then(function(response) {
            console.log(response);
            window.response = response;
            if (response.status == 200) {
                $location.path('/');
            }
        });
    };

    this.signUp = function(user) {
        $http.post('/signup', user).then(function(response) {
            console.log(response);
            window.response = response;
            if (response.status == 200) {
                $location.path('/');
            }
        });
    };

    this.signOut = function() {
        $http.post('/signout');
    };
});

app.config(function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'templates/index.html'
        }).
        when('/community', {
            templateUrl: 'templates/community.html'
        }).
        when('/tests', {
            templateUrl: 'templates/tests.html'
        }).
        when('/users', {
            templateUrl: 'templates/users.html'
        }).
        when('/sign-in', {
            templateUrl: 'templates/sign-in.html'
        }).
        when('/sign-up', {
            templateUrl: 'templates/sign-up.html'
        }).

        otherwise({
            redirectTo: '/'
        });
});
