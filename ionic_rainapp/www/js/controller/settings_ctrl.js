angular.module('controller.settings', ['ionic'])

.controller('SettingsCtrl', ['$scope', 'AuthenticationService', '$location', '$rootScope', 'Azureservice', '$ionicModal', 
	function($scope, AuthenticationService, $location, $rootScope, Azureservice, $ionicModal) {


		$scope.$on('$ionicView.enter', function(e) {
		//if the user is an admin, load the list of requesting users!
		$scope.unverifiedUsers = [];
		$scope.isVerified = false;


		var currentUser = $rootScope.globals.currentUser;
		// console.log("Settings: currentUser: " + JSON.stringify(currentUser));

		if (currentUser) {
			if (currentUser.verified == true) {
				$scope.isVerified = true;
				console.log("Requesting unverified users!");
				Azureservice.invokeApi("authenticateuser", {method:'get'})
				.then(function(response) {
					$scope.unverifiedUsers = response;
				},
				function(error) {
					console.log("Error: " + JSON.stringify(error));
				})
			}
		}
	});

		$scope.logout = function() {
			AuthenticationService.ClearCredentials();
			$rootScope.$broadcast('login-state-changed');
			$scope.isVerified = false;
			$scope.unverifiedUsers = [];
		}

		$ionicModal.fromTemplateUrl('templates/new-well.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal
		})  


		/**
		 * Modal Methods
		 */

		$scope.register = function() {
			$scope.modal.show()
			// $scope.modal.map = angular.element(document.getElementById('map'));

		}

		$scope.closeModal = function(center) {

			//TODO: Submit new well to azure!
			//TODO: convert lat lng? Or do that in the cloud?

			//var params = $scope.form
			//params = { well_owner, well_id, postcode, max_wt_depth, lat, lng}
			//TODO: verify and submit



			console.log("Data: " + center);
			if (center != null) {
				//Assign center, and move map
				//TODO: Update the model!
				$scope.modalMap.setCenter(center);
			}
			$scope.modal.hide();
		}

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

		$scope.verify = function(userID) {
			console.log("Verify");
			var data = {"user_id" : userID, "verified" : true};
			Azureservice.invokeApi("authenticateuser",{method:'put', body:data})
			.then(function(response) {
				console.log("Success! " + JSON.stringify(response))
			},
			function(error) {
				console.log("Error: " + JSON.stringify(error));
			})
		}


	}])