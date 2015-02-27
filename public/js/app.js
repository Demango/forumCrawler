var app = angular.module('app', ['ngRoute']);

app.controller('AppController', function($http, $routeParams, $scope) {

    this.topics = [];

    var self = this;

    this.loadTopics = function() {
        $http.get('/topics').then(function(res) {
            self.topics = res.data;
        });
    };

    this.resetPlayers = function() {
        self.topics = [];
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
