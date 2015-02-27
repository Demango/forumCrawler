var app = angular.module('app', ['ngRoute']);

app.controller('AppController', function($http, $routeParams, $scope) {

    this.topics = [];

    this.loadingTopics = false;

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
});

app.filter('pretty', function() {
    return function(input) {
        return input.replace('http://www.akeneo.com/forums/topic/', '').replace(/-/g, ' ').replace('/', '');
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
