angular.module('controller.login', [])
.controller('LoginController', function($scope, $location, AuthenticationService,$ionicPopup, debug, Azureservice, $http){
    $scope.user = {};

    (function initController() {
        // reset login status
        AuthenticationService.ClearCredentials();
    })();


    //TODO: Add more login buttons!

    //Get the user info depending on SSO:
    //http://blogs.msdn.com/b/carlosfigueira/archive/2012/10/25/getting-user-information-on-azure-mobile-services.aspx

    // $scope.login = function login() {

    //     Azureservice.login("facebook")
    //     .then(function(results) {
    //         var  currentUser = Azureservice.getCurrentUser();
    //         console.log("Current user: " + JSON.stringify(currentUser));

    //         Azureservice.invokeApi("authenticateuser", {
    //           body: {"service":"facebook", "user":Azureservice.getCurrentUser()},
    //           method: "post"})
    //         .then(function(response) {
    //             console.log("Azure success: " + JSON.stringify(response));

    //         },
    //         function(err) {
    //             console.error('Azure Error: ' + err);
    //         });

    //     }, function(error){
    //         alert(error);
    //     });


        // //Always log in in debug mode!
        // if (debug == 1) {
        //     AuthenticationService.SetCredentials("lewis", 1, "password");
        //     $location.path('/tab/map');
        //     return;
        // }



        // AuthenticationService.Login($scope.user)
        // .then(function(response) {
        //     //Get the logged in user info
        //     AuthenticationService.SetCredentials(response.data.username, response.data.id, $scope.user.password);
        //         $location.path('/tab/report');

        // },
        // function(data) {
        //       var alertPopup = $ionicPopup.alert({
        //         title: 'Login failed!',
        //         template: 'Please check your credentials!'
        //     });
        //     //TODO: alert user
        // });
// };  



$scope.signup = function signup() {
    $location.path('/signup');
}        
});