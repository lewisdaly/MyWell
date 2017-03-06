angular.module('controller.settings', [])
.controller('SettingsController', function($scope, AuthenticationService, $location, $rootScope, $ionicModal, $ionicPopup, ApiService, CachingService, apiUrl) {

  $scope.templateUrl = `${apiUrl}/containers/container1/download/template`;
  $scope.apiBaseUrl = apiUrl;
  $scope.imageResourceId = null;

	$scope.$on('$ionicView.enter', function(e) {
		checkUserStatus();
	});

	$scope.$on('login-state-changed', function(e) {
  		checkUserStatus();
		});

	$scope.logout = function() {
		AuthenticationService.ClearCredentials();
		$rootScope.$broadcast('login-state-changed');
		$scope.isVerified = false;
		$scope.unverifiedUsers = [];
	}

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
			}
		else if (currentUser.verified == false) {
		    $scope.isUserNotVerified = true;
	    }
	    else {
	    	$scope.isUserLoggedInAndVerified = true;
			$scope.isVerified = true;
			// loadUnverifiedUsers();
		}
	}

  /**
   * Camera Methods
   */

  // Triggered on a button click, or some other target
  $scope.showGetImagePopup = function() {
    const isResourceIdValid = (resourceId) => {
      let valid = true;
      if (angular.isNullOrUndefined(resourceId)) { valid = false;}
      if (resourceId < 999) { valid = false;}
      if (resourceId > 9999) { valid = false;}

      return valid;
    }

    var popup = $ionicPopup.show({
     template: '<input type="number" ng-model="imageResourceId">',
     title: 'ResourceId',
     subTitle: 'Enter the resourceId of the new image',
     scope: $scope,
     buttons: [
       { text: 'Cancel',
        onTap: function(e) { }
       },
       {
         text: '<b>Next</b>',
         type: 'button-positive'
       }
     ]
    });

   popup
    .then(res => {
      if
        if (!isResourceIdValid($scope.imageResourceId)) {
          //don't allow the user to close unless he enters wifi password
          e.preventDefault();
        } else {
          return $scope.imageResourceId;
        }
      }
    })
    .then(() => getImage())
    .then(data => {
      console.log('get image data', data);
      return ApiService.uploadImageForResource($scope.imageResourceId, data)
    })
    .catch(err => {
      console.log('Error getting image', err);
      //TODO: display to user?
    });
 }

  const getImage = () => {
    return new Promise((resolve, reject) => {
      if (angular.isNullOrUndefined(navigator) || angular.isNullOrUndefined(navigator.camera)) {
        displayMessage("Error", "The camera is not available on your device");
        return;
      }

      navigator.camera.getPicture(resolve, reject, {
        quality: 25,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY
      });
    });
  }

  const displayMessage = (title, message) => {
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: message
    });
  }

});
