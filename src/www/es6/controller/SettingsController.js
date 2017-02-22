angular.module('controller.settings', [])
.controller('SettingsController', function($scope, AuthenticationService, $location, $rootScope, $ionicModal, $ionicPopup, ApiService, CachingService, apiUrl) {
		$scope.resources = [
			"well",
			"dam",
			"rain_gauge"
		];

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

    $scope.locate = function() {
      console.log('locate');

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
          console.log(position);
          leafletMap.panTo(new L.LatLng(position.coords.latitude, position.coords.longitude));
          $scope.form.lat = position.coords.latitude;
          $scope.form.lng = position.coords.longitude;
          $scope.$apply();

          //TODO: drop pin
        }, function(err) {
          console.log(err);
          var alertPopup = $ionicPopup.alert({
            title: 'GeoLocation Error',
            template: err.message
          });
        });
      }
      else {
        console.log("Geolocation is not supported by this browser.");
        var alertPopup = $ionicPopup.alert({
          title: 'GeoLocation Error',
          template: "Geolocation is not supported"
        });
      }
    }

    var leafletMap = null;

		$scope.register = function() {
      //TODO: load an unsaved resource from localstorage if exists
      $scope.form = CachingService.getResourceFromCache();

      //fix up because data format isn't nice:
      if (!angular.isNullOrUndefined($scope.form.elevation)) {
        $scope.form.max_wt_depth = $scope.form.elevation;
      }
      if (!angular.isNullOrUndefined($scope.form.geo)) {
        $scope.form.lat = $scope.form.geo.lat;
        $scope.form.lng = $scope.form.geo.lng;
      }

			$scope.modal.show()

      //Set up the Leaflet Map
      //TODO: disable map dragging - only allow moving using the locate button for now
      if (angular.isNullOrUndefined(leafletMap)){
        leafletMap = L.map('leafletMapRegister', { zoomControl:false, dragging: false, doubleClickZoom:false }).setView([24.593, 74.198], 17);
        L.tileLayer('https://api.mapbox.com/styles/v1/lewisdaly/ciuqhjyzo00242iphq3wo7bm4/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGV3aXNkYWx5IiwiYSI6ImNpdXE3ajltaDAwMGYyb2tkdjk2emx3NGsifQ.wnqFweA7kdijEtsgjTJIPw')
         .addTo(leafletMap);
       }
		}

		$scope.closeModal = function(form) {
			if (form === false) {
				$scope.modal.hide();
				return;
			}

			if ((form == null)
          || (form.postcode == null)
          || (form.owner == null)
          || (form.postcode == null)
          || (form.id== null)
          || (form.max_wt_depth == null)
          || (form.type == null)
          || (form.lat == null)
          || (form.lng == null)) {

	      var alertPopup = $ionicPopup.alert({
	        title: 'Error',
	        template: "Please fill out all the fields"
	      });

	      return;
			}

			if ((form.id > 9999) || (form.id < 1000)) {
			  var alertPopup = $ionicPopup.alert({
	        title: 'Error',
	        template: "Id must be between 1000-9999"
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
				well_depth: form.max_wt_depth,
				type:form.type,
				postcode: form.postcode,
				villageId: villageId,
        elevation: 0
			};

			ApiService.registerWell(data)
			.then(function(response) {
				var alertPopup = $ionicPopup.alert({
	        title: 'Thanks!',
	        template: "Created new resource with Id " + data.id
	      });

				$scope.modal.hide();
			})
			.catch(function(err) {
        if (err.status === 0) {
          displayMessage("Connection Error", "Saving. Please try again later.");
          CachingService.addResourceToCache(data);
          $scope.modal.hide();
          return;
        }

				console.log("err", err);
			 	var alertPopup = $ionicPopup.alert({
        	title: 'Error',
        	template: err
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

    function displayMessage(title, message) {
      var alertPopup = $ionicPopup.alert({
          title: title,
          template: message
        });
    }

});
