angular.module('controller.map', [])
//TODO: change this name
.controller('MapCtrl', function($scope, apiUrl, $state, $window, $ionicHistory, $ionicModal, $ionicPopup, ApiService) {

  const ResourceType = {
    WELL: 'well',
    RAINGAUGE: 'raingauge',
    CHECKDAM: 'checkdam'
  };

  $scope.map;
  $scope.markers = {}; //dict of Leaflet Marker Objects
  $scope.data = []; //Data loaded from Server
  $scope.isPageActive = true;
  $scope.closestVillage = "Varni"; //default
  $scope.searchResource = '';

  //Set up the Leaflet Map
  var leafletMap = L.map('leafletMap', { zoomControl:false, minZoom:10, maxZoom:20}).setView([24.593, 74.198], 16);
  L.tileLayer('https://api.mapbox.com/styles/v1/lewisdaly/ciuqhjyzo00242iphq3wo7bm4/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGV3aXNkYWx5IiwiYSI6ImNpdXE3ajltaDAwMGYyb2tkdjk2emx3NGsifQ.wnqFweA7kdijEtsgjTJIPw')
   .addTo(leafletMap);

  var wellIcon = L.icon({
   iconUrl: 'img/ball.png',
   iconSize:     [36, 36], // size of the icon
   iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
   popupAnchor:  [17, 5] // point from which the popup should open relative to the iconAnchor
  });

  var checkdamIcon = L.icon({
   iconUrl: 'img/wall.png',
   iconSize:     [36, 36], // size of the icon
   iconAnchor:   [-15, 0], // point of the icon which will correspond to marker's location
   popupAnchor:  [17, 5] // point from which the popup should open relative to the iconAnchor
  });

  var raingaugeIcon = L.icon({
   iconUrl: 'img/raindrop.svg',
   iconSize:     [36, 56], // size of the icon
   iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
   popupAnchor:  [17, 5] // point from which the popup should open relative to the iconAnchor
  });

  ApiService.getVillages()
    .then(villages => {
      $scope.villages = villages;
      villages.forEach(village => {
        const icon = L.divIcon({
          html:`\
          <div class=""> \
            <a class="centerText" href="#/tab/map/${village.postcode}/village/${village.id}"> \
              <h4>${village.name}</h4> \
            </a> \
          </div>`,
          className: 'village-div-icon'});
        const marker = L.marker([village.coordinates.lat, village.coordinates.lng], {icon:icon}).addTo(leafletMap);
      });
    })
    .then(() => ApiService.getResources())
    .then(function(response) {

      //Manually join the village name
      $scope.data = response.data.map(resource => {
        resource.villageName = $scope.getVillageName(resource.postcode, resource.villageId);
        return resource;
      });

      $scope.data.forEach(resource => {
        //Calculate the well % level:
        const percentageFull = (((resource.well_depth - resource.last_value)/resource.well_depth) * 100).toFixed(2);
        resource.percentageFull = percentageFull;

        let icon = null;
        switch (resource.type) {
          case ResourceType.WELL:
            icon = wellIcon;
            break;
          case ResourceType.CHECKDAM:
            icon = checkdamIcon;
            break;
          case ResourceType.RAINGAUGE:
            icon = raingaugeIcon;
            break;
          default:
            console.error(`Unknown ResourceType: ${resource.type}`);
        }

        var marker = L.marker([resource.geo.lat, resource.geo.lng], {icon:icon}).addTo(leafletMap);
        marker.bindPopup(getPopupContentForResource(resource));
        $scope.markers[resource.id] = marker;
      });
    });

  $scope.getVillageName = (postcode, villageId) => {
    const village = $scope.villages.filter(village => village.postcode === postcode && village.id === villageId)[0]
    if (!village) {
      console.error(`Village not found for postcode: ${postcode} and villageId: ${villageId}`);
      return "null";
    }

    return village.name;
  };

  // $scope.$on('$ionicView.enter', function(e) {
  //   if ($scope.map) {
  //     google.maps.event.trigger($scope.map, 'resize');
  //   }
  // });

  /**
   * Someone has clicked search. Get the resource from id, and navigate, also show popup
   */
  $scope.searchItemPressed = function(event, resourceId) {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.close();
    }

    var resource = getResourceFromId(resourceId);
    var marker = $scope.markers[resourceId];

    leafletMap.panTo(new L.LatLng(resource.geo.lat, resource.geo.lng));
    marker.openPopup();
  }

  $scope.locate = function() {
    //TODO: re enable for leaflet
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position){
        leafletMap.panTo(new L.LatLng(position.coords.latitude, position.coords.longitude));
        //TODO: drop pin
        // ion-ios-navigate
      });
    }
    else {
      console.log("Geolocation is not supported by this browser.");
    }
  }


  function saftelyGetLevelString(value) {
    if (angular.isNullOrUndefined(value)) {
      return "";
    }
    return value.toFixed(2);
  }

  function displayMessage(title, message) {
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: message
    });
  }

  function getResourceFromId(id) {
    return $scope.data.filter(function(resource) {
      return resource.id === id;
    }).shift();
  }

  const getSpecificContentForWell = (resource) => {
    let iconImage = "icon_low";
    if (resource.percentageFull > 33) {
      iconImage = "icon_med";
    } else if (resource.percentageFull >= 66) {
      iconImage = "icon_full";
    }

    const watertableHeight = resource.well_depth - resource.last_value;
    return `
    <br/>Watertable Height: ${saftelyGetLevelString(watertableHeight)} m
    <br/>Percentage Full: ${resource.percentageFull}%
    <br/> <img src="img/${iconImage}.png" style="
        height: 50px;
        "/>`
  }

    const getSpecificContentForCheckDam = (resource) => {
      return `
      <br/>Latest Reading: ${saftelyGetLevelString(resource.last_value)} m
      `
    }

    const getSpecificContentForRainGauge = (resource) => {
      return `
      <br/>Latest Reading: ${saftelyGetLevelString(resource.last_value)} m
      `
    }

    function getPopupContentForResource(resource) {
      let postcodeVillage = `${resource.postcode}:${resource.villageId}`;

      if (!angular.isNullOrUndefined(resource.village)) {
        villageName = resource.village.name;
      }

      let specificContent = null;
      switch (resource.type) {
        case ResourceType.WELL:
          specificContent = getSpecificContentForWell(resource);
          break;
        case ResourceType.CHECKDAM:
          specificContent = getSpecificContentForCheckDam(resource);
          break;
        case ResourceType.RAINGAUGE:
          specificContent = getSpecificContentForRainGauge(resource);
      }

      return `<div style="line-height:1.35;overflow:hidden;white-space:nowrap;"> Village: ${$scope.getVillageName(resource.postcode, resource.villageId)}
      <br/>ResourceId : ${resource.id}
      ${specificContent}
      <br/><a href=#/tab/map/${resource.postcode}/${resource.id}>More</a>`;
    }
});
