angular.module('report.controllers', [])

.controller('ReportCtrl', function($scope, $ionicPopup, $http, apiUrl, Azureservice, $rootScope, LoginService) {

  $scope.form = {};
  $scope.form.date =  new Date();

  $scope.$on('$ionicView.enter', function(e) {
    checkUserStatus();
  });

  $scope.$on('login-state-changed', function(e) {
    checkUserStatus();
  })
  
  $scope.refreshUser = function() {
    //Perform login again - in case user's verification status has changed:
    LoginService.reAuthenticateUser()
    .then(function(response){
      var currentUser = $rootScope.globals.currentUser;
      console.log("currentUser: " + JSON.stringify(currentUser));
      checkUserStatus();

    },function(error) {
    });
  }


  function checkUserStatus() {
    $scope.isUserNotLoggedIn = false;
    $scope.isUserNotVerified = false;
    $scope.isUserLoggedInAndVerified = false;

    var currentUser = $rootScope.globals.currentUser;

    if (!currentUser) {
      $scope.isUserNotLoggedIn = true;
    }
    else if (currentUser.verified == false) {
      $scope.isUserNotVerified = true;
    }
    else
    {
      $scope.isUserLoggedInAndVerified = true;
    }
  }



  // Validate and submit form
  $scope.sendReport = function(form){
	// TODO: Validate fields
  if (($scope.form.postcode == null) || ($scope.form.postcode == null) || ($scope.form.postcode== null) || ($scope.form.postcode == null))
  {
    console.log("Fill out the form!");
    var alertPopup = $ionicPopup.alert({
      title: 'Error',
      template: "Please fill out all the fields"
    });
  }
  else
  {
    data = {};
    data.wellDepth = $scope.form.wt_depth;
    data.wellID = $scope.form.well_id;
    data.timestamp = new Date();

    Azureservice.invokeApi("mobilerequest", {
      method: "post",
      body:data
    }).then(function(response) {
      console.log("Submitted successfully");

    },function(err) {
      console.log("Error: " + err);
    });
  }

}})