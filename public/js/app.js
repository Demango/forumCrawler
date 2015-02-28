var app = angular.module('app', ['ngRoute']);

app.controller('AppController', function($http, $routeParams, $scope) {

    this.topics = [];
    this.issuesData = [];

    this.loadingTopics = false;
    this.loadingIssues = false;

    var activeTab = null;

    var gitAuthorWhitelist = [
        'sumbobyboys',
        'grena',
        'jmleroux',
        'Nuscly',
        'jjanvier',
        'solivier',
        'nidup',
        'willy-ahva',
        'fitn',
        'filipsalpe',
        'BitOne',
        'antoineguigan',
        'nono-akeneo',
        'skeleton',
        'rybus',
        'CharlyP',
        'damien-carcel',
        'gquemener'
    ];

    var self = this;

    this.toggleActive = function(tab) {
        if (self.activeTab === tab){
            self.activeTab = null;
        }
        else{ self.activeTab = tab;}
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

    this.clearIssuesCache = function() {
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
                    issues: _.filter(repoData.issues, function(issue) {
                        return !isWhitelisted(issue);
                    })
                };
            });

            self.issuesData = _.filter(issuesData, function(item) {
                return item.issues.length > 0;
            });
            self.loadingIssues = false;
        });
    };

    var isWhitelisted = function(issue) {
        if(!issue){
            return false;
        }
        return gitAuthorWhitelist.indexOf(issue.user.login) !== -1;
    };
});

app.config(function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'templates/index.html',
            controller: 'AppController',
            controllerAs: 'app'
        }).

        otherwise({
            redirectTo: '/'
        });
});
