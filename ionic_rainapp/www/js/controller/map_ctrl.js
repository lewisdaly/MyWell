angular.module('map.controllers', [])
.controller('MapCtrl', function($scope, apiUrl, Azureservice) {

  console.log(apiUrl);
  $scope.map;

  // Placeholder
  var infoWindow = new google.maps.InfoWindow({
    content: ""
  });


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
      console.log('Here is my response object');
      var newArray = [];
      for (var i in response) {
        var object = response[i];
        object.lat = ConvertDMSToDD(object.LAT_DEGREE, object.LAT_MINUTE, object.LAT_SECOND, object.LAT_DECIMAL);//"24.570883333333335";
        object.lng = ConvertDMSToDD(object.LNG_DEGREE, object.LNG_MINUTE, object.LNG_SECOND, object.LNG_DECIMAL);//"74.22109861111112";
        object.Level = object.TOT_WELL_DEPTH_m;

        // var newObj = {};
        // newObj.lat = object.lat;
        // newObj.lng = object.lng;
        // newObj.Id = 501;
        // newObj.Elevation = 453.12;
        // newObj.Level = 31;
        // newArray.push(newObj);
      }

      console.log(JSON.stringify(response));
      $scope.well_data = response;
      // $scope.well_data = newArray;

      //TESTING:
      var originalWell = JSON.parse("[{\"Id\":501,\"lat\":24.570883333333335,\"lng\":74.22109861111112,\"Elevation\":438.07,\"Level\":31,\"TimeStamp\":\"2015-08-28\"}]");
      console.log(JSON.stringify(originalWell));
      setUpMap();
    }, function(err) {
      console.error('Azure Error: ' + err);
    });
})

function setUpMap() {

  var wellGeoJson = GeoJSON.parse($scope.well_data, {Point: ['lat', 'lng']});

      //Create Info window pop up to display Well Id and water level
      //Might want to change this to onClick -- mouseover get annoying
      // $scope.map.data.addListener('click', function() {
      //   console.log("click!");
      // });
$scope.map.data.addGeoJson(wellGeoJson);


$scope.map.data.addListener('click', function(event) {
  console.log("Click!");
  infoWindow.setContent('<div style="line-height:1.35;overflow:hidden;white-space:nowrap;"> Well ID = '+
    event.feature.getProperty('ID') +"<br/>Water Level: " + event.feature.getProperty("Level")  + "m");
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
      console.log("MaxIntesity: " + maxIntensity +", offset:" + offset  );
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
  })
