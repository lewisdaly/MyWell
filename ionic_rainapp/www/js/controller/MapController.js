angular.module('controller.map', [])
//TODO: change this name
.controller('MapCtrl', function($scope, apiUrl, $state, $window, $ionicHistory, $ionicModal, $ionicPopup, ApiService) {

  $scope.map;
  $scope.markers = {}; //dict of Leaflet Marker Objects
  $scope.data = []; //Data loaded from Server
  $scope.isPageActive = true;
  $scope.closestVillage = "Varni"; //default
  $scope.searchResource = '';


  //Set up the Leaflet Map
  var leafletMap = L.map('leafletMap', { zoomControl:false }).setView([24.593, 74.198], 17);
  //TODO: make these offline!
  // L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  //   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
  //   maxZoom: 18,
  //   id: 'mapbox.satellite',
  //   accessToken: 'pk.eyJ1IjoibGV3aXNkYWx5IiwiYSI6ImNpdXE3ajltaDAwMGYyb2tkdjk2emx3NGsifQ.wnqFweA7kdijEtsgjTJIPw'
  // }).addTo(leafletMap);

  L.tileLayer('https://api.mapbox.com/styles/v1/lewisdaly/ciuqhjyzo00242iphq3wo7bm4/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGV3aXNkYWx5IiwiYSI6ImNpdXE3ajltaDAwMGYyb2tkdjk2emx3NGsifQ.wnqFweA7kdijEtsgjTJIPw')
   .addTo(leafletMap);

  ApiService.getResources()
  .then(function(response) {
    $scope.data = response.data;

    var greenIcon = L.icon({
      iconUrl: '/img/icon_full.png',

      iconSize:     [36, 56], // size of the icon
      iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
      popupAnchor:  [17, 5] // point from which the popup should open relative to the iconAnchor
    });

    //TODO: change icon based on well level!
    $scope.data.forEach(function(resource) {
      var marker = L.marker([resource.geo.lat, resource.geo.lng], {icon: greenIcon}).addTo(leafletMap);
      //TODO: change the icon depending on resource type
      marker.bindPopup(getPopupContentForResource(resource));

      $scope.markers[resource.id] = marker;
    });
  });

  $scope.$on('$ionicView.enter', function(e) {
    if ($scope.map) {
      google.maps.event.trigger($scope.map, 'resize');
    }
  });

  // $scope.$on('$ionicView.exit')

  /**
   * Someone has clicked search. Get the resource from id, and navigate, also show popup
   */
  $scope.searchItemPressed = function(event, resourceId) {
    var resource = getResourceFromId(resourceId);
    var marker = $scope.markers[resourceId];

    leafletMap.panTo(new L.LatLng(resource.geo.lat, resource.geo.lng));
    marker.openPopup();
  }

  // function refreshMapHeading() {
  //   //Get the map centre
  //   var center = $scope.map.getCenter();
  //   var params = {"lat":center.lat(), "lng":center.lng()};
  //
  //   var smallestDistance = 9999999999999999;
  //   var closestWellId;
  //   var closestVillageId
  //
  //   //find the closest well id
  //   //TODO: replace with a simple mongo function...
  //   $scope.well_data.forEach(function (resource) {
  //     const distance = distanceBetween(center.lat(), center.lng(), resource.geo.lat, resource.geo.lng);
  //     if (distance <= smallestDistance) {
  //       closestWellId = resource.id;
  //       smallestDistance = distance;
  //       closestVillageId = resource.villageId;
  //     }
  //   });
  //
  //   ApiService.getClosestVillage(closestVillageId)
  //   .then(function (response) {
  //     $scope.closestVillage = response.data.response.name;
  //     $scope.closestVillageInfo = response.data.response;
  //   })
  //   .catch(function (err) {
  //     console.log("err", err);
  //     $scope.closestVillageInfo = undefined;
  //     $scope.closestVillage = "";
  //   });
  // }

  //Display a popup with the village info
  // $scope.displayVillageInfo = function() {
  //   var message = " ";
  //   if ($scope.closestVillageInfo){
  //
  //     const line1 = $scope.closestVillageInfo.thisMonth.average ? "Current Ave WT Depth: " + $scope.closestVillageInfo.thisMonth.average.toFixed(2) : "";
  //     const line2 = $scope.closestVillageInfo.lastMonth.average ? "m</br>Ave WT Depth 1 month ago: " + $scope.closestVillageInfo.lastMonth.average.toFixed(2) : "";
  //     const line3 = $scope.closestVillageInfo.lastYear.average ? "m</br>Ave WT Depth 1 year ago: " + $scope.closestVillageInfo.lastYear.average.toFixed(2) : "";
  //
  //     message = line1 + line2 + line3 +"m";
  //   }
  //   displayMessage($scope.closestVillage, message);
  // }

  function distanceBetween(lat1, lng1, lat2, lng2) {
    var R = 6371000; // metres
    var φ1 = lat1 * Math.PI / 180; //convert to radians
    var φ2 = lat2 * Math.PI / 180;
    var Δφ = (lat2-lat1) * Math.PI / 180;
    var Δλ = (lng2-lng1) * Math.PI / 180;

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d;
  }

  // function setUpMap() {
  //   console.log("well_data", $scope.well_data);
  //   var wellGeoJson = GeoJSON.parse($scope.well_data, {Point: ['lat', 'lng']});
  //   console.log("well geoJson", wellGeoJson);
  //
  //   $scope.map.data.addGeoJson(wellGeoJson);
  //
  //   $scope.map.addListener('dragend', function()
  //   {
  //     refreshMapHeading();
  //   });
  // }


  // $scope.map.data.addListener('click', function(event) {
  //   infoWindow.setContent(
  //     `<div style="line-height:1.35;overflow:hidden;white-space:nowrap;"> Village: ${event.feature.f.villageId}
  //     <br/>Well ID : ${event.feature.f.id}
  //     <br/>Depth to Water Level: ${saftelyGetLevelString(event.feature.f.last_value)} m
  //     <br/><a href=#/tab/map/${event.feature.f.id}>More</a>`
  //   );
  //
  //   // '<br/>Well Owner: ' + event.feature.f.owner +
  //
  //   var anchor = new google.maps.MVCObject();
  //   anchor.set("position",event.latLng);
  //   infoWindow.open($scope.map,anchor);
  //       // $scope.map.showInfoWindow(infoWindow);
  //     });
  //
  //     var heatMapData = []; //Container for heatmap data points
  //     var coords = [];
  //     //TODO: Change - defaults to 6 with new Backend
  //     var maxWeight = 6;    //Max weight value for heatmap legend
  //
  //     //Get maxWeight and populate heatMapdata
  //     for(var well in wellGeoJson.features){
  //       if (wellGeoJson.features[well].properties.Level > maxWeight) {
  //         maxWeight = wellGeoJson.features[well].properties.Level;
  //       }
  //
  //       var point = {
  //         location: new google.maps.LatLng(
  //           Number(wellGeoJson.features[well].geometry.coordinates[1]),
  //           Number(wellGeoJson.features[well].geometry.coordinates[0])),
  //         weight: wellGeoJson.features[well].properties.Level
  //       };
  //       heatMapData.push(point);
  //     }
  //
  //     //Create heapmap layer
  //     heatmap = new google.maps.visualization.HeatmapLayer({
  //       data: new google.maps.MVCArray(heatMapData),
  //       radius: 40
  //     });
  //
  //     //Build out Legend
  //     var gradient = ['rgba(0, 255, 255, 0)','rgba(0, 255, 255, 1)','rgba(0, 191, 255, 1)','rgba(0, 127, 255, 1)','rgba(0, 63, 255, 1)','rgba(0, 0, 255, 1)',    'rgba(0, 0, 223, 1)','rgba(0, 0, 191, 1)','rgba(0, 0, 159, 1)','rgba(0, 0, 127, 1)','rgba(63, 0, 91, 1)','rgba(127, 0, 63, 1)','rgba(191, 0, 31, 1)','rgba(255, 0, 0, 1)']
  //
  //     heatmap.set('gradient',gradient);
  //     heatmap.setMap($scope.map);
  //
  //     var gradientCss = '(left';
  //       for (var i = 0 ; i < gradient.length; ++i){
  //         gradientCss += ', ' + gradient[i];
  //       }
  //       gradientCss += ')';
  //
  //     //Update the DOM
  //     document.getElementById('LegendGradient').style.background = '-webkit-linear-gradient' + gradientCss;
  //     document.getElementById('LegendGradient').style.background =  '-moz-linear-gradient' + gradientCss;
  //     document.getElementById('LegendGradient').style.background =  '-o-linear-gradient' + gradientCss;
  //     document.getElementById('LegendGradient').style.background =  'linear-gradient' + gradientCss;
  //
  //     drawLegend(maxWeight);
  //   }

    //Called when page is requested to load
    // google.maps.event.addDomListener(window, 'load', initialize);
    // function drawLegend(maxIntensity) {
    //   //var maxIntensity = heatmap['gm_bindings_']['maxIntensity'][484]['Sc']['j'];
    //   var legendWidth = document.getElementById('LegendGradient').style.width = '100%';
    //   var offset = Math.round(maxIntensity/6);
    //   var value = maxIntensity;
    //   var key = 6;
    //   //build legend key scale
    //   for ( key ; key > 0; key--) {
    //     //Add Value to key
    //     var t_value = document.createTextNode(Math.round(value));
    //     document.getElementById(key).appendChild(t_value);
    //     //decrement value
    //     value = value - offset;
    //   }
    // }

    // $scope.toggleHeatmap = function() {
    //   heatmap.setMap(heatmap.getMap() ? null : $scope.map);
    // }
    //
    // //toggles radius of heatmap - this needs some tunning for well applications, what is the effective radius ?
    // $scope.changeRadius = function() {
    //   heatmap.set('radius', heatmap.get('radius') ? null : 20);
    // }
    //
    // //changes the color of the heat map
    // $scope.changeGradient = function() {
    //   var gradient = ['rgba(0, 255, 255, 0)','rgba(0, 255, 255, 1)','rgba(0, 191, 255, 1)','rgba(0, 127, 255, 1)','rgba(0, 63, 255, 1)','rgba(0, 0, 255, 1)','rgba(0, 0, 223, 1)','rgba(0, 0, 191, 1)','rgba(0, 0, 159, 1)','rgba(0, 0, 127, 1)','rgba(63, 0, 91, 1)','rgba(127, 0, 63, 1)','rgba(191, 0, 31, 1)','rgba(255, 0, 0, 1)']
    //   heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
    // }

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

    function ConvertDMSToDD(degrees, minutes, seconds, decimal) {
      //TODO: implement better...
      degrees = parseFloat(degrees.toFixed(10));
      minutes = minutes.toFixed(10)/60.00;
      var decString = "0." + decimal;
      seconds = seconds + parseFloat(decString);
      var dd =  degrees + minutes + seconds/(60*60);

      return dd;
    }

    function saftelyGetLevelString(value) {
      if (!value) {
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

    function getPopupContentForResource(resource) {
      return `<div style="line-height:1.35;overflow:hidden;white-space:nowrap;"> Village: ${resource.village.name}
      <br/>Well ID : ${resource.id}
      <br/>Depth to Water Level: ${saftelyGetLevelString(resource.last_value)} m
      <br/><a href=#/tab/map/${resource.id}>More</a>`;
    }
  })
