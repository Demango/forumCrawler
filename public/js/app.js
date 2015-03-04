var app = angular.module('app', ['ngRoute']);

app.controller('ForumController', function($http, $routeParams, $scope) {
    this.topics = [];

    this.loadingTopics = false;

    this.activeTab = null;

    var self = this;

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
        $http.get('/topics/clear-cache').then(function(res) {
            self.loadTopics();
            self.topics = [];
        });
    };

});

app.controller('IssueController', function($http, $routeParams, $scope) {

    this.issuesData = [];

    this.loadingIssues = false;

    this.activeTab = null;

    var self = this;

    this.toggleActive = function(tab) {
        if (self.activeTab === tab){
            self.activeTab = null;
        }
        else{self.activeTab = tab;}
    };


    this.clearCache = function() {
        $http.get('/issues/clear-cache').then(function(res) {
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

app.controller('TestController', function($http, $routeParams, $scope) {
    this.tests = [];

    this.activeTab = null;

    this.loadingTests = false;

    this.showGreen = false;

    var self = this;

    this.isVisible = function(test) {
        if (/^red/.test(test.color)) {
            return true;
        }
        return this.showGreen;
    };

    this.showButton = function(test) {
        if (/^red/.test(test.color)) {
            return true;
        }else { return false; }
    };

    this.toggleActive = function(tab) {
        if (self.activeTab === tab){
            self.activeTab = null;
        }
        else{self.activeTab = tab;}
    };

    this.loadTests = function() {
        self.loadingTests = true;
        $http.get('/tests').then(function(res) {
            self.tests = res.data;
            self.loadingTests = false;
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
        if(/^red/.test(test.color)){
            count++;
        }
    });
    return count;
};

});

app.controller('AppController', function($http, $routeParams, $scope) {
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

        otherwise({
            redirectTo: '/'
        });
});
