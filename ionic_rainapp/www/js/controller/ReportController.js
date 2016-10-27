angular.module('report.controllers', [])

.controller('ReportController', function($scope, $ionicPopup, $http, apiUrl, $rootScope, LoginService, ApiService) {

  /**
   * Init
   */

  //Set up the form
  resetForm();

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
      console.log("form", $scope.form);

      data = {};
      data.postcode = $scope.form.postcode;
      data.value = $scope.form.value;
      data.resourceId = $scope.form.resourceId;
      data.date = $scope.form.date;

      ApiService.updateReading(data)
      .then(function(response) {
        console.log("Submitted successfully");
        displayMessage("Thanks!", "Submitted successfully.")
        resetForm();
      })
      .catch(function(response) {
        console.log("Error: ", response);
        displayMessage("Error", response.data.error.message);
      });
    }
  }

  /**
   *  Helper functions
   */

  function displayMessage(title, message) {
    var alertPopup = $ionicPopup.alert({
        title: title,
        template: message
      });
  }

  function resetForm () {
    $scope.form = {};
    $scope.form.date =  new Date();
  }
})
