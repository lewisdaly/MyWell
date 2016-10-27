angular.module('controller.settings', [])
.controller('SettingsController', function($scope, AuthenticationService, $location, $rootScope, $ionicModal, $ionicPopup, ApiService) {
		$scope.resources = [
			"well",
			"dam",
			"rain_gauge"
		];

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


		// function loadUnverifiedUsers() {
		// 	console.log("Requesting unverified users!");
		// 	Azureservice.invokeApi("authenticateuser", {method:'get'})
		// 	.then(function(response) {
		// 		$scope.unverifiedUsers = response;
		// 	},
		// 	function(error) {
		// 		console.log("Error: " + JSON.stringify(error));
		// 	})
		// }


		/**
		 * Modal Methods
		 */

		$ionicModal.fromTemplateUrl('templates/new-well.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal
		})

		$scope.register = function() {
			$scope.modal.show()
			// $scope.modal.map = angular.element(document.getElementById('map'));

		}

		$scope.closeModal = function(form) {
			if (form === false) {
				$scope.modal.hide();
				return;
			}

			if ((form == null) ||
					(form.postcode == null) ||
				  (form.owner == null) ||
				  (form.postcode == null) ||
				  (form.id== null) ||
				  (form.max_wt_depth == null) ||
				  (form.type == null) ||
				  (form.lat == null) ||
				  (form.lng == null)
				  ){

				console.log("Fill out the form!");
	      var alertPopup = $ionicPopup.alert({
	        title: 'Error',
	        template: "Please fill out all the fields"
	      });

	      return;
			}

			if ((form.id > 999) ||
				  (form.id < 100)) {
			  var alertPopup = $ionicPopup.alert({
	        title: 'Error',
	        template: "Id must be between 100-999"
	      });

				return;
			}

			//Transform to the format we need:
			const villageId = parseInt(form.id.toString()[0]);

			const data = {
				id: form.id,
				geo: {
					lat: form.lat,
					lng: form.lng
				},
				owner: form.owner,
				elevation: form.max_wt_depth,
				type:form.type,
				postcode: form.postcode,
				villageId: villageId,
			};

			ApiService.registerWell(data)
			.then(function(response) {
				var alertPopup = $ionicPopup.alert({
	        title: 'Thanks!',
	        template: "Created new resource with Id " + data.id
	      });

				$scope.modal.hide();
			})
			.catch(function(response) {
				console.log("err", response.data.error);
			 	var alertPopup = $ionicPopup.alert({
        	title: 'Error',
        	template: response.data.error.message
      	});
			});
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


		/**
		 * Verify a user
		 */

		// $scope.verify = function(userID) {
		// 	console.log("Verify");
		// 	var data = {"user_id" : userID, "verified" : true};
		// 	Azureservice.invokeApi("authenticateuser",{method:'put', body:data})
		// 	.then(function(response) {
		// 		console.log("Success! " + JSON.stringify(response));
		// 		// loadUnverifiedUsers();
    //
		// 	},
		// 	function(error) {
		// 		console.log("Error: " + JSON.stringify(error));
		// 	})
		// }
});
