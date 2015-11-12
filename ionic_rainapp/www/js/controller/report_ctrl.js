  angular.module('report.controllers', [])

  .controller('ReportCtrl', function($scope, $ionicPopup, $http, apiUrl, Azureservice, $rootScope) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  $scope.$on('$ionicView.enter', function(e) {
    $scope.isUserNotLoggedIn = false;
    $scope.isUserNotVerified = false;
    $scope.isUserLoggedInAndVerified = false;

    var currentUser = $rootScope.globals.currentUser;
    console.log("currentUser: " + JSON.stringify(currentUser));

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


  });

  $scope.form = {};
  $scope.form.date =  new Date();


  $scope.isUserNotLoggedIn = function () {
    // return $rootScope.globals.currentUser;
    return true;
  }

  $scope.isUserNotVerified = false;

  $scope.isUserLoggedInAndVerified = function() {

    return false;
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