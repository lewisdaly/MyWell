angular.module('controller.settings', [])
.controller('SettingsController', function($scope, AuthenticationService, $location, $rootScope, $ionicModal, $ionicPopup, ApiService, CachingService, apiUrl) {

  $scope.templateUrl = `${apiUrl}/containers/container1/download/template`;
  $scope.apiBaseUrl = apiUrl;


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
  $scope.getImage = () => {
    if (angular.isNullOrUndefined(navigator) || angular.isNullOrUndefined(navigator.camera)) {
      displayMessage("Error", "The camera is not available on your device");
      return;
    }

    const cameraError = (err) => {
      console.log(err);
    }

    const cameraSuccess = (data) => {
      //TODO: upload to api service!
      console.log(data);
    }

    navigator.camera.getPicture(cameraSuccess, cameraError, {
      quality: 25,
      destinationType: 'DATA_URL',
      sourceType: 'PHOTOLIBRARY'
    });
  }


  function displayMessage(title, message) {
    var alertPopup = $ionicPopup.alert({
        title: title,
        template: message
      });
  }
});
