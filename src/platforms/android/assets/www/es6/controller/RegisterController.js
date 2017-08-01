angular.module('controller.register', [])
.controller('RegisterController', ($scope, $location, $rootScope, $ionicModal, $ionicPopup, $ionicHistory, ApiService, CachingService, apiUrl) => {

  let leafletMap = null;
  $scope.resources = [
    "well",
    "checkdam",
    "raingauge"
  ];

  $scope.refreshCoords = () => {
    if (angular.isNullOrUndefined(leafletMap)) {
      return;
    }

    const center = leafletMap.getCenter();
    $scope.form.lat = null;
    $scope.form.lng = null;

    $scope.form.lat = center.lat;
    $scope.form.lng = center.lng;
  }

  const init = function() {
    //load an unsaved resource from localstorage if exists
    $scope.form = CachingService.getResourceFromCache();

    //fix up because data format isn't nice:
    if (!angular.isNullOrUndefined($scope.form.elevation)) {
      $scope.form.max_wt_depth = $scope.form.elevation;
    }
    if (!angular.isNullOrUndefined($scope.form.geo)) {
      $scope.form.lat = $scope.form.geo.lat;
      $scope.form.lng = $scope.form.geo.lng;
    }

    //Set up the Leaflet Map
    if (angular.isNullOrUndefined(leafletMap)){
      leafletMap = L.map('leafletMapRegister', { zoomControl:false, dragging: true, doubleClickZoom:false }).setView([24.593, 74.198], 17);
      L.tileLayer('https://api.mapbox.com/styles/v1/lewisdaly/ciuqhjyzo00242iphq3wo7bm4/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGV3aXNkYWx5IiwiYSI6ImNpdXE3ajltaDAwMGYyb2tkdjk2emx3NGsifQ.wnqFweA7kdijEtsgjTJIPw')
       .addTo(leafletMap);
     }
  }
  init();

  $scope.locate = function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position){
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

  /**
   * Check the map to see if we have a valid lat and lng, if we do, move the map the correct place
   */
  const checkAndUpdateMap = () => {
    if (angular.isNullOrUndefined($scope.form.lat) || angular.isNullOrUndefined($scope.form.lng)) {
      return
    }
    if ($scope.form.lat.toString().length < 5 || $scope.form.lng.toString().length < 4) {
      return;
    }
    //We have a valid(ish) lat and lng
    leafletMap.panTo(new L.LatLng($scope.form.lat, $scope.form.lng));
  }

  $scope.$watch('form.lat', checkAndUpdateMap);
  $scope.$watch('form.lng', checkAndUpdateMap);

  $scope.submit = function(form) {
    if (form === false) {
      $scope.modal.hide();
      return;
    }

    let isFormValid = true;

    if ((form == null)
        || (form.village_name == null) || (form.village_name.trim() === "")
        || (form.owner == null)
        || (form.postcode == null)
        || (form.type == null)
        || (form.lat == null)
        || (form.lng == null)) {
      isFormValid = false;
    }

    //More specific requirements
    if (form.type === "well" && angular.isNullOrUndefined(form.max_wt_depth)) {
      isFormValid = false;
    }

    if (!isFormValid) {
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

    //For now, assume all villages are just 11
    const villageId = 11;

    const data = {
      geo: {
        lat: form.lat,
        lng: form.lng
      },
      owner: form.owner,
      village_name: form.village_name.trim(),
      email: form.email,
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
        template: `Created a new ${form.type} in ${form.village_name.trim()}`
      });

      //navigate back if possible
      $ionicHistory && $ionicHistory.goBack();
    })
    .catch(function(err) {
      if (err.status === 0) {
        displayMessage("Connection Error", "Saving. Please try again later.");
        CachingService.addResourceToCache(data);
        return;
      }

      console.log("err", err);
      var alertPopup = $ionicPopup.alert({
        title: 'Error',
        template: err.statusText
      });
    });
  }



})
