angular.module('controller.login', [])
.controller('LoginController', function($scope, $location, AuthenticationService,$ionicPopup, debug, $http){
    $scope.user = {};

    (function initController() {
        // reset login status
        AuthenticationService.ClearCredentials();
    })();



$scope.signup = function signup() {
    $location.path('/signup');
}
});
