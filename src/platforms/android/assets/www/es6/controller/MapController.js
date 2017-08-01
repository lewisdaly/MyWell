angular.module('controller.map', [])

.controller('MapCtrl', function($scope, apiUrl, $state, $window, $ionicHistory, $ionicModal, $ionicPopup, ApiService, CachingService) {

  $scope.$on('$ionicView.enter', function(e) {
    leafletMap.invalidateSize();
  });

  const ResourceType = {
    WELL: 'well',
    RAINGAUGE: 'raingauge',
    CHECKDAM: 'checkdam'
  };

  const wellIcon = L.icon({iconUrl: 'img/ball.png', iconSize:[36, 36], iconAnchor:[0, 0], popupAnchor:[17, 5]});
  const checkdamIcon = L.icon({iconUrl: 'img/wall.png',iconSize: [36, 36], iconAnchor: [-15, 0], popupAnchor: [17, 5]});
  const raingaugeIcon = L.icon({iconUrl: 'img/raindrop.svg', iconSize: [36, 56], iconAnchor: [0,0], popupAnchor: [17, 5]});

  $scope.markers = {}; //dict of Leaflet Marker Objects
  $scope.data = []; //Data loaded from Server
  $scope.isPageActive = true;
  $scope.closestVillage = "Varni"; //default
  $scope.searchResource = '';

  const getMarkerIdForVillage = (village) => {
    return `${village.postcode}-${village.id}`;
  }

  const getMarkerIdForResource = (resource) => {
    return `${resource.postcode}-${resource.id}`;
  }

  const getFirstLocation = () => {
    const savedResource = CachingService.getFavouriteLocation();
    if (!savedResource) {
      console.log("No first location!");
      return [24.593, 74.198];
    }

    return savedResource;
  }

  const resetMap = () => {
    Object.keys($scope.markers).forEach(_key => {
      let marker = $scope.markers[_key];
      if (!marker) {
        console.log("no marker for key:", _key);
        return;
      }
      leafletMap.removeLayer(marker);
    });
    //Trying this out - it may fix the greyness and popup position errors
    //maybe call this whenever the page
    leafletMap.invalidateSize();
  }

  const loadDataAndSetupMap = () => {
    ApiService.getVillages()
      .then(villages => {
        $scope.villages = villages;
        villages.forEach(village => {
          const icon = L.divIcon({
            html:`\
            <div class=""> \
                <h2>${village.name}</h2> \
            </div>`,
            className: 'village-div-icon'});
          const marker = L.marker([village.coordinates.lat, village.coordinates.lng], {icon:icon}).addTo(leafletMap);
          $scope.markers[getMarkerIdForVillage(village)] = marker;

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
          $scope.markers[getMarkerIdForResource(resource)] = marker;
        });
      });
  }

  //Set up the Leaflet Map
  var leafletMap = L.map('leafletMap', { zoomControl:true, minZoom:5, maxZoom:18});
  L.tileLayer('https://api.mapbox.com/styles/v1/lewisdaly/ciuqhjyzo00242iphq3wo7bm4/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGV3aXNkYWx5IiwiYSI6ImNpdXE3ajltaDAwMGYyb2tkdjk2emx3NGsifQ.wnqFweA7kdijEtsgjTJIPw')
   .addTo(leafletMap);

  loadDataAndSetupMap();
  const firstLocation = getFirstLocation();
  leafletMap.setView(firstLocation, 16);

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
  $scope.searchItemPressed = function(event, resource) {
    $scope.hideSearchResults();
    //disable text box
    document.getElementById("search-box-input").blur();
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.close();
    }

    var marker = $scope.markers[getMarkerIdForResource(resource)];
    leafletMap.panTo(new L.LatLng(resource.geo.lat, resource.geo.lng));
    marker.openPopup();
  }

  document.getElementById("search-box-input").addEventListener('focus', function () {
      console.log('focus on input ');
  });

  document.getElementById("search-box-input").addEventListener('click', function () {
      console.log('click on input');
  });

  $scope.locate = function() {
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

  $scope.showSearchResults = () => {
    $scope.showSearchPanel = true;
  }

  $scope.hideSearchResults = () => {
    $scope.showSearchPanel = false;
  }

  $scope.watchSearch = (search) => {
    $scope.searchResource = search;
    if (search.length > 2) {
      return $scope.showSearchResults();
    }

    return $scope.hideSearchResults();
  }

  $scope.refreshDataPressed = () => {
    resetMap();
    loadDataAndSetupMap();
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

  const getSpecificContentForWell = (resource) => {
    const watertableHeight = resource.last_value;
    return `
    <br/>Depth to Water Table: ${saftelyGetLevelString(watertableHeight)} m
    `
  }

    const getSpecificContentForCheckDam = (resource) => {
      return `
      <br/>Latest Reading: ${saftelyGetLevelString(resource.last_value)} m
      `
    }

    const getSpecificContentForRainGauge = (resource) => {
      return `
      <br/>Latest Reading: ${saftelyGetLevelString(resource.last_value)} mm
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
      <br/><a class="button button-small popup-more-button" href=#/tab/map/${resource.postcode}/${resource.id}>More</a>`;
    }
});
