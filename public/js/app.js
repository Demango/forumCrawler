var app = angular.module('app', ['ngRoute']);

app.controller('AppController', function($http, $routeParams, $scope) {

    this.topics = [];
    this.issuesData = [];

    this.loadingTopics = false;

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
        'damien-carcel'
    ];

    var self = this;

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

    this.loadIssues = function() {
        $http.get('/issues').then(function(res) {
            self.issuesData = res.data;
            console.log(self.issuesData);
        });
    };

    this.isWhitelisted = function(issue) {
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
