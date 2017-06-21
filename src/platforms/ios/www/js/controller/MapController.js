'use strict';

angular.module('controller.map', [])
//TODO: change this name
.controller('MapCtrl', function ($scope, apiUrl, $state, $window, $ionicHistory, $ionicModal, $ionicPopup, ApiService) {

  var ResourceType = {
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
  //TODO: look into this: https://github.com/gregallensworth/L.TileLayer.Cordova
  var leafletMap = L.map('leafletMap', { zoomControl: false, minZoom: 10, maxZoom: 17 }).setView([24.593, 74.198], 16);
  //TODO: make these offline!
  // L.tileLayer('https://api.mapbox.com/styles/v1/lewisdaly/mapbox.mapbox-streets-v7/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGV3aXNkYWx5IiwiYSI6ImNpdXE3ajltaDAwMGYyb2tkdjk2emx3NGsifQ.wnqFweA7kdijEtsgjTJIPw')
  L.tileLayer('https://api.mapbox.com/styles/v1/lewisdaly/ciuqhjyzo00242iphq3wo7bm4/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGV3aXNkYWx5IiwiYSI6ImNpdXE3ajltaDAwMGYyb2tkdjk2emx3NGsifQ.wnqFweA7kdijEtsgjTJIPw')
  // L.tileLayer('img/maptiles/{z}-{x}-{y}.jpeg')
  .addTo(leafletMap);

  ApiService.getResources().then(function (response) {
    $scope.data = response.data;

    var wellIcon = L.icon({
      iconUrl: 'img/ball.png',
      iconSize: [36, 36], // size of the icon
      iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
      popupAnchor: [17, 5] // point from which the popup should open relative to the iconAnchor
    });

    var checkdamIcon = L.icon({
      iconUrl: 'img/wall.png',
      iconSize: [36, 36], // size of the icon
      iconAnchor: [-15, 0], // point of the icon which will correspond to marker's location
      popupAnchor: [17, 5] // point from which the popup should open relative to the iconAnchor
    });

    var raingaugeIcon = L.icon({
      iconUrl: 'img/raindrop.svg',
      iconSize: [36, 56], // size of the icon
      iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
      popupAnchor: [17, 5] // point from which the popup should open relative to the iconAnchor
    });

    //Add village tooltips
    var villages = {};

    $scope.data.forEach(function (resource) {
      //Calculate the well % level:
      var percentageFull = ((resource.well_depth - resource.last_value) / resource.well_depth * 100).toFixed(2);
      resource.percentageFull = percentageFull;

      var icon = null;
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
      }

      var marker = L.marker([resource.geo.lat, resource.geo.lng], { icon: icon }).addTo(leafletMap);
      marker.bindPopup(getPopupContentForResource(resource));
      $scope.markers[resource.id] = marker;

      if (angular.isNullOrUndefined(resource.village)) {
        return;
      }

      if (!villages[resource.village.id]) {
        villages[resource.village.id] = resource.village;
      }
    });

    Object.values(villages).forEach(function (village) {
      var icon = L.divIcon({
        html: '        <div class="">           <a class="centerText" href="#/tab/map/' + village.postcode + '/village/' + village.id + '">             <h4>' + village.name + '</h4>           </a>         </div>',
        className: 'village-div-icon' });
      var marker = L.marker([village.coordinates.lat, village.coordinates.lng], { icon: icon }).addTo(leafletMap);
    });
  });

  $scope.$on('$ionicView.enter', function (e) {
    if ($scope.map) {
      google.maps.event.trigger($scope.map, 'resize');
    }
  });

  /**
   * Someone has clicked search. Get the resource from id, and navigate, also show popup
   */
  $scope.searchItemPressed = function (event, resourceId) {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.close();
    }

    var resource = getResourceFromId(resourceId);
    var marker = $scope.markers[resourceId];

    leafletMap.panTo(new L.LatLng(resource.geo.lat, resource.geo.lng));
    marker.openPopup();
  };

  function distanceBetween(lat1, lng1, lat2, lng2) {
    var R = 6371000; // metres
    var φ1 = lat1 * Math.PI / 180; //convert to radians
    var φ2 = lat2 * Math.PI / 180;
    var Δφ = (lat2 - lat1) * Math.PI / 180;
    var Δλ = (lng2 - lng1) * Math.PI / 180;

    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
  }

  $scope.locate = function () {
    //TODO: re enable for leaflet
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        leafletMap.panTo(new L.LatLng(position.coords.latitude, position.coords.longitude));
        //TODO: drop pin
        // ion-ios-navigate
      });
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };

  function ConvertDMSToDD(degrees, minutes, seconds, decimal) {
    //TODO: implement better...
    degrees = parseFloat(degrees.toFixed(10));
    minutes = minutes.toFixed(10) / 60.00;
    var decString = "0." + decimal;
    seconds = seconds + parseFloat(decString);
    var dd = degrees + minutes + seconds / (60 * 60);

    return dd;
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
    return $scope.data.filter(function (resource) {
      return resource.id === id;
    }).shift();
  }

  var getSpecificContentForWell = function getSpecificContentForWell(resource) {
    var iconImage = "icon_low";
    if (resource.percentageFull > 33) {
      iconImage = "icon_med";
    } else if (resource.percentageFull >= 66) {
      iconImage = "icon_full";
    }

    var watertableHeight = resource.well_depth - resource.last_value;
    return '\n      <br/>Watertable Height: ' + saftelyGetLevelString(watertableHeight) + ' m\n      <br/>Percentage Full: ' + resource.percentageFull + '%\n      <br/> <img src="img/' + iconImage + '.png" style="\n          height: 50px;\n          "/>';
  };

  var getSpecificContentForCheckDam = function getSpecificContentForCheckDam(resource) {
    return '\n      <br/>Latest Reading: ' + saftelyGetLevelString(resource.last_value) + ' m\n      ';
  };

  var getSpecificContentForRainGauge = function getSpecificContentForRainGauge(resource) {
    return '\n      <br/>Latest Reading: ' + saftelyGetLevelString(resource.last_value) + ' m\n      ';
  };

  function getPopupContentForResource(resource) {
    var villageName = "";
    if (!angular.isNullOrUndefined(resource.village)) {
      villageName = resource.village.name;
    }

    var specificContent = null;
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

    return '<div style="line-height:1.35;overflow:hidden;white-space:nowrap;"> Village: ' + villageName + '\n      <br/>ResourceId : ' + resource.id + '\n      ' + specificContent + '\n      <br/><a href=#/tab/map/' + resource.postcode + '/' + resource.id + '>More</a>';
  }
});