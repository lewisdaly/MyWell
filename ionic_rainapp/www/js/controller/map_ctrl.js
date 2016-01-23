angular.module('map.controllers', [])
.controller('MapCtrl', function($scope, apiUrl, Azureservice, $state, $window, $ionicHistory, $ionicModal, $ionicPopup) {

  $scope.map;
  $scope.isPageActive = true;
  $scope.closestVillage = "Varni"; //default

  // Placeholder
  var infoWindow = new google.maps.InfoWindow({
    content: ""
  });

  $scope.$on('$ionicView.enter', function(e) {
    if ($scope.map) {
          google.maps.event.trigger($scope.map, 'resize');
    }
  });

  $scope.$on('$ionicView.exit')

  $scope.$on('mapInitialized', function(event, map) {
    if(map.class.indexOf("map-main") == -1) {
      return
    }

    $scope.map = map;
    var well_data = {}; //ht

    //Test send request to Azure service
    Azureservice.invokeApi("mobilerequest", {
      body: null,
      method: "get"
    }).then(function(response) {
      var newArray = [];
      for (var i in response) {
        var object = response[i];
        object.lat = ConvertDMSToDD(object.LAT_DEGREE, object.LAT_MINUTE, object.LAT_SECOND, object.LAT_DECIMAL);//"24.570883333333335";
        object.lng = ConvertDMSToDD(object.LNG_DEGREE, object.LNG_MINUTE, object.LNG_SECOND, object.LNG_DECIMAL);//"74.22109861111112";
        object.Level = object.TOT_WELL_DEPTH_m;
      }

      $scope.well_data = response;

      setUpMap();
    }, function(err) {
      console.error('Azure Error: ' + err);
    });
  })


  function refreshMapHeading() {
    //Get the map centre
    var center = $scope.map.getCenter();
    var params = {"lat":center.lat(), "lng":center.lng()};

    var smallestDistance = 9999;
    var closestWellID;
    var closestVillage;

    //find the closest well id
    for (var i in $scope.well_data) {
      var well = $scope.well_data[i];

      var distance = distanceBetween(center.lat(), center.lng(), well.lat, well.lng);
      if (distance <= smallestDistance) {
        closestWellID = well.ID;
        smallestDistance = distance;
        closestVillage = well.village_name;
      }
    }

    $scope.closestVillage = closestVillage;
    var villageID = closestWellID/100; //we just want the first digit

    Azureservice.invokeApiSilently("getclosestvillage", {
      body: {"well_id" : villageID},
      method:"post"
    }).then(function(response) {
      console.log("getclosestvillage response: " + JSON.stringify(response));
      $scope.closestVillageInfo = response;
    }, function(err){
      console.error("Azure Error: " + JSON.stringify(err));
    });
  }

  //Display a popup with the village info
  $scope.displayVillageInfo = function() {
    var message = " ";
    if ($scope.closestVillageInfo){
      message = "Current Ave WT Depth: " + $scope.closestVillageInfo.current_depth.toFixed(2) +
      "m</br>Ave WT Depth 1 month ago: " + $scope.closestVillageInfo.last_month_depth.toFixed(2) +
      "m</br>Ave WT Depth 1 year ago: " + $scope.closestVillageInfo.last_year_depth.toFixed(2) + "m";
    }
    displayMessage($scope.closestVillage, message);
  }

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

  function setUpMap() {

    var wellGeoJson = GeoJSON.parse($scope.well_data, {Point: ['lat', 'lng']});
    $scope.map.data.addGeoJson(wellGeoJson);


    $scope.map.addListener('dragend', function()
    {
      refreshMapHeading();
    });

  $scope.map.data.addListener('click', function(event) {
    infoWindow.setContent('<div style="line-height:1.35;overflow:hidden;white-space:nowrap;"> Village: '
       + event.feature.getProperty('village_name') +
      '<br/>Well Owner: ' + event.feature.getProperty('well_owner') +
      '<br/>Well ID : '+ event.feature.getProperty('ID') +
      '<br/>Depth to Water Level: ' + event.feature.getProperty("Level").toFixed(2)  + "m");


    var anchor = new google.maps.MVCObject();
    anchor.set("position",event.latLng);
    infoWindow.open($scope.map,anchor);
        // $scope.map.showInfoWindow(infoWindow);
      });

      var heatMapData = []; //Container for heatmap data points
      var coords = [];
      //TODO: Change - defaults to 6 with new Backend
      var maxWeight = 6;    //Max weight value for heatmap legend

      //Get maxWeight and populate heatMapdata
      for(var well in wellGeoJson.features){      
        if (wellGeoJson.features[well].properties.Level > maxWeight) {
          maxWeight = wellGeoJson.features[well].properties.Level;
        }

        var point = {
          location: new google.maps.LatLng(
            Number(wellGeoJson.features[well].geometry.coordinates[1]),
            Number(wellGeoJson.features[well].geometry.coordinates[0])),
          weight: wellGeoJson.features[well].properties.Level 
        };
        heatMapData.push(point);
      }

      //Create heapmap layer
      heatmap = new google.maps.visualization.HeatmapLayer({
        data: new google.maps.MVCArray(heatMapData),
        radius: 40
      }); 

      //Build out Legend
      var gradient = ['rgba(0, 255, 255, 0)','rgba(0, 255, 255, 1)','rgba(0, 191, 255, 1)','rgba(0, 127, 255, 1)','rgba(0, 63, 255, 1)','rgba(0, 0, 255, 1)',    'rgba(0, 0, 223, 1)','rgba(0, 0, 191, 1)','rgba(0, 0, 159, 1)','rgba(0, 0, 127, 1)','rgba(63, 0, 91, 1)','rgba(127, 0, 63, 1)','rgba(191, 0, 31, 1)','rgba(255, 0, 0, 1)']

      heatmap.set('gradient',gradient);
      heatmap.setMap($scope.map);

      var gradientCss = '(left';
        for (var i = 0 ; i < gradient.length; ++i){
          gradientCss += ', ' + gradient[i];
        }
        gradientCss += ')';

      //Update the DOM
      document.getElementById('LegendGradient').style.background = '-webkit-linear-gradient' + gradientCss;
      document.getElementById('LegendGradient').style.background =  '-moz-linear-gradient' + gradientCss;
      document.getElementById('LegendGradient').style.background =  '-o-linear-gradient' + gradientCss;
      document.getElementById('LegendGradient').style.background =  'linear-gradient' + gradientCss;

      drawLegend(maxWeight);
    }


    //Called when page is requested to load
    // google.maps.event.addDomListener(window, 'load', initialize);

    function drawLegend(maxIntensity) {
      //var maxIntensity = heatmap['gm_bindings_']['maxIntensity'][484]['Sc']['j'];
      var legendWidth = document.getElementById('LegendGradient').style.width = '100%';
      var offset = Math.round(maxIntensity/6);
      var value = maxIntensity;
      var key = 6;
      //build legend key scale
      for ( key ; key > 0; key--) {
        //Add Value to key
        var t_value = document.createTextNode(Math.round(value));
        document.getElementById(key).appendChild(t_value);
        //decrement value
        value = value - offset;
      }
    }


    $scope.toggleHeatmap = function() {
      heatmap.setMap(heatmap.getMap() ? null : $scope.map);
    }

    //toggles radius of heatmap - this needs some tunning for well applications, what is the effective radius ?
    $scope.changeRadius = function() {
      heatmap.set('radius', heatmap.get('radius') ? null : 20);
    }

    //changes the color of the heat map
    $scope.changeGradient = function() {
      var gradient = ['rgba(0, 255, 255, 0)','rgba(0, 255, 255, 1)','rgba(0, 191, 255, 1)','rgba(0, 127, 255, 1)','rgba(0, 63, 255, 1)','rgba(0, 0, 255, 1)','rgba(0, 0, 223, 1)','rgba(0, 0, 191, 1)','rgba(0, 0, 159, 1)','rgba(0, 0, 127, 1)','rgba(63, 0, 91, 1)','rgba(127, 0, 63, 1)','rgba(191, 0, 31, 1)','rgba(255, 0, 0, 1)']
      heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
    }

    $scope.locate = function() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
          var geolocate = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          $scope.map.setCenter(geolocate);
        //TODO: Drop pin?
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

    function displayMessage(title, message) {
      var alertPopup = $ionicPopup.alert({
        title: title,
        template: message
      });
    }
  })
