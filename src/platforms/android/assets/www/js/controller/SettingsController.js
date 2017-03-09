'use strict';

angular.module('controller.settings', []).controller('SettingsController', function ($scope, AuthenticationService, $location, $rootScope, $ionicModal, $ionicPopup, ApiService, CachingService, apiUrl) {

  $scope.templateUrl = apiUrl + '/containers/container1/download/template';
  $scope.apiBaseUrl = apiUrl;
  $scope.imageResourceId = null;

  $scope.isDesktop = angular.isNullOrUndefined(window.cordova);

  $scope.$on('$ionicView.enter', function (e) {
    checkUserStatus();
  });

  $scope.$on('login-state-changed', function (e) {
    checkUserStatus();
  });

  $scope.logout = function () {
    AuthenticationService.ClearCredentials();
    $rootScope.$broadcast('login-state-changed');
    $scope.isVerified = false;
    $scope.unverifiedUsers = [];
  };

  //if the user is an admin, load the list of requesting users!
  function checkUserStatus() {
    $scope.unverifiedUsers = [];
    $scope.isUserNotLoggedIn = false;
    $scope.isUserNotVerified = false;
    $scope.isUserLoggedInAndVerified = false;
    $scope.isVerified = false;

    var currentUser = $rootScope.globals.currentUser;

    if (!currentUser) {
      $scope.isUserNotLoggedIn = true;
    } else if (currentUser.verified == false) {
      $scope.isUserNotVerified = true;
    } else {
      $scope.isUserLoggedInAndVerified = true;
      $scope.isVerified = true;
      // loadUnverifiedUsers();
    }
  }

  /**
   * Add new image for resource
   */
  $scope.showGetImagePopup = function () {
    var isDataValid = function isDataValid(data) {
      var valid = true;

      if (angular.isNullOrUndefined(data)) {
        valid = false;return false;
      }
      if (angular.isNullOrUndefined(data.postcode)) {
        valid = false;return false;
      }
      if (angular.isNullOrUndefined(data.imageResourceId)) {
        valid = false;return false;
      }

      if (data.postcode > 999999) {
        valid = false;
      }
      if (data.postcode < 99999) {
        valid = false;
      }
      if (data.imageResourceId < 999) {
        valid = false;
      }
      if (data.imageResourceId > 9999) {
        valid = false;
      }

      console.log(valid);

      return valid;
    };

    $scope.data = {};

    var popup = $ionicPopup.show({
      template: '<div>\
       <input type="number" placeholder="Pin Code" ng-model="data.postcode">\
       <input type="number" placeholder="ResourceId" ng-model="data.imageResourceId">\
      </div>',
      title: 'Details',
      subTitle: 'Enter the details of the resource to attach the image to.',
      scope: $scope,
      buttons: [{
        text: 'Cancel',
        onTap: function onTap(e) {
          console.log('closing');
        }
      }, {
        text: '<b>Next</b>',
        type: 'button-positive',
        onTap: function onTap(e) {
          console.log($scope.data);
          if (!isDataValid($scope.data)) {
            e.preventDefault();
          } else {
            return $scope.data;
          }
        }
      }]
    });

    popup.then(function (response) {
      console.log("hey");
      if (angular.isNullOrUndefined(response)) {
        //Do nothing!
        return null;
      }
      var postcode = response.postcode;
      var imageResourceId = response.imageResourceId;

      return getImage().then(function (data) {
        console.log('get image data', data);
        return ApiService.uploadImageForResource(postcode, imageResourceId, data);
      });
    }).then(function () {
      displayMessage('Thanks.', 'Updated image successfully!');
    }).catch(function (err) {
      console.log('Error getting image', err);
      displayMessage('Error updating image', err.statusText);
    });
  };

  var getImage = function getImage() {
    return new Promise(function (resolve, reject) {
      if (angular.isNullOrUndefined(navigator) || angular.isNullOrUndefined(navigator.camera)) {
        displayMessage("Error", "The camera is not available on your device");

        //Right now for testing
        return reject(new Error('Unsupported device'));
      }

      //TODO: tweak these settings
      navigator.camera.getPicture(resolve, reject, {
        quality: 10,
        destinationType: Camera.DestinationType.DATA_URL,
        targetWidth: 500,
        targetHeight: 250,
        // destinationType: Camera.DestinationType.FILE_URI
        sourceType: Camera.PictureSourceType.CAMERA
      });

      //We need to read the image back, and then squash it!
    });
  };

  var displayMessage = function displayMessage(title, message) {
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: message
    });
  };
});