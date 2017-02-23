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

		function checkUserStatus() {

			//if the user is an admin, load the list of requesting users!
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
		 * Modal Methods
		 */
		$ionicModal.fromTemplateUrl('templates/new-well.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal
		})

    var leafletMap = null;


		$scope.$on('$destroy', function() {
			$scope.modal.remove();
		});

		$scope.$on('mapInitialized', function(event, map) {
			if(map.class.indexOf("map-modal") == -1) {
				return
			}
			console.log("Settings map init");
			$scope.modalMap = map;
		});

    function displayMessage(title, message) {
      var alertPopup = $ionicPopup.alert({
          title: title,
          template: message
        });
    }

});
