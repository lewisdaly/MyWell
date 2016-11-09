angular.module('controller.map-detail', ['nvd3'])
.controller('MapDetailController', function($scope, $state, ApiService, $stateParams) {

  $scope.$on('$ionicView.enter', function(e) {
    console.log("Entered!");
  });

  console.log($stateParams.resourceId);
  $scope.resourceId = $stateParams.resourceId;

  //Get the data from the api service
  ApiService.getStatisticsForResourceId($scope.resourceId)
  .then((data) => {
    const resource = data[0].data;
    const villageAverage = data[1].data;
    const historicalResourceAverages = data[2].data.readings;
    const historicalVillageAverages = data[3].data.readings;

    $scope.resource = resource;
    $scope.village = villageAverage;

    console.log(resource);
    console.log(villageAverage);
    console.log(historicalResourceAverages);
    console.log(historicalVillageAverages);
  })
  .catch(err => {
    console.log(err);

  });

  $scope.options = {
    chart: {
      type: 'multiBarChart',
      height: 450,
      margin: {
        top: 20,
        right: 20,
        bottom: 100,
        left: 55
      },
      x: function(d) {
        return d.label;
      },
      y: function(d) {
        return d.value;
      },
      showValues: false,
      showControls: false,
      valueFormat: function(d) {
        return d3.format(',.4f')(d);
      },
      duration: 500,
      xAxis: {
        axisLabel: 'Month',
        rotateLabels: 30
      },
      yAxis: {
        axisLabel: 'Average Well level',
        axisLabelDistance: -10,
        tickFormat: function(d) {
          return d3.format('.0%')(d);
        }
      },
      tooltip: {
        enabled: false
      },
    }
  };

  $scope.data = [
    {
      "key" : "aveValueVillage",
      "bar": true,
      "color": "#d62728",
      "values": [
        {label:'2015-01', value:0.45},
        {label:'2015-02', value:1},
        {label:'2015-03', value:0.22},
        {label:'2015-04', value:0.12},
        {label:'2015-05', value:0.4},
        {label:'2015-06', value:0.5},
        {label:'2015-07', value:0.9},
        {label:'2015-08', value:0.1},
        {label:'2015-09', value:0.1},
        {label:'2015-10', value:0.1},
        {label:'2015-11', value:0.1},
        {label:'2015-12', value:0.1}
      ]
    },
    {
      "key" : "aveValueWell",
      "bar": true,
      "color": "#1f77b4",
      "values": [
        {label:'2015-01', value:0.1},
        {label:'2015-02', value:0.5},
        {label:'2015-03', value:0.12},
        {label:'2015-04', value:0.2},
        {label:'2015-05', value:0.6},
        {label:'2015-06', value:0.7},
        {label:'2015-07', value:0.7},
        {label:'2015-08', value:0.4},
        {label:'2015-09', value:0.1},
        {label:'2015-10', value:0.4},
        {label:'2015-11', value:0.3},
        {label:'2015-12', value:0.2}
      ]
    }
  ];
});
