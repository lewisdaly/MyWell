"use strict";
angular.module('controller.map-detail', ['nvd3'])
.controller('MapDetailController', function($scope, $state, ApiService, $stateParams) {

  $scope.$on('$ionicView.enter', function(e) {

  });

  $scope.resourceId = $stateParams.resourceId;
  $scope.juneData = null;
  let detailChart = null;

  const getChartDataAndLabel = (dataRange) => {
    let dataAndLabel = {
      data: null,
      labels: null
    };

    console.log("dataRange", dataRange);
    switch (dataRange) {
      case 'month':
        dataAndLabel.data = [12.4, 56.4, 20.0, 19.3];
        dataAndLabel.labels = ["5th Feb", "12th Feb", "19th Feb", "26th Feb"];
        break;
      case '3month':
        dataAndLabel.data = [12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3];
        dataAndLabel.labels = ["5th Feb", "12th Feb", "19th Feb", "26th Feb"];
        break;
      case 'year':
        dataAndLabel.data = [12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3, 12.4, 56.4, 20.0, 19.3];
        dataAndLabel.labels = ["5th Feb", "12th Feb", "19th Feb", "26th Feb"];
        break;
      default:
        throw new Error(`dataRange ${dataRange} not found`);
    }

    return dataAndLabel;
  }

  const setupChart = () => {
    let chartData = getChartDataAndLabel("month");
    const ctx = document.getElementById("detailChart");
    detailChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: chartData.labels,
          datasets: [{
              label: 'Water Table Height (m)',
              data: chartData.data,
              borderWidth: 1
          }]
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }]
          }
      }
    });
  }

  const init = () => {
    setupChart();
  }

  $scope.updateData = (dataRange) => {
    console.log("update chart data", dataRange);

    const chartData = getChartDataAndLabel(dataRange);
    console.log(detailChart.data);
    detailChart.data.datasets[0].data = chartData.data;
    detailChart.data.labels = chartData.labels;
    detailChart.update();
  }

  //Get the data from the api service
  Promise.all([
    ApiService.getStatisticsForResource($stateParams.postcode, $scope.resourceId),
    ApiService.getDifferenceFromJune(null, 'individual', $scope.resourceId, $stateParams.postcode)
      .catch(err => console.log(err))
  ])
  .then(results => {
    const data = results[0];
    if (!angular.isNullOrUndefined(results[1]) && !angular.isNullOrUndefined(results[1].data)) {
      let pastReadingDate = new Date(results[1].data.pastReadingDate).toISOString().slice(0,10);
      let difference = `${results[1].data.difference.toFixed(2)} m`;

      $scope.juneData = {
        pastReadingDate: pastReadingDate,
        difference: difference
      };
    }

    //TODO: configure chart data and buttons

    console.log("$Scope.juneData", $scope.juneData);

    const emptyAverage = {last_value:0}
    let resource = emptyAverage;
    let villageAverage = emptyAverage;

    if (!angular.isNullOrUndefined(data[0])) {
      resource = data[0].data;
    }

    if (!angular.isNullOrUndefined(data[1])) {
      villageAverage = data[1].data;
    }

    let historicalResourceAverages = data[2].data.readings;
    let historicalVillageAverages = data[3].data.readings;

    $scope.resource = resource;
    $scope.village = villageAverage;

    //Calculate the % full
    const percentageFull = (((resource.well_depth - resource.last_value)/resource.well_depth) * 100).toFixed(2);
    $scope.resource.percentageFull = percentageFull;
    const watertableHeight = resource.well_depth - resource.last_value;
    $scope.watertableHeight = watertableHeight;


    //Add the current village and resource readings to the historical:
    const thisMonthString = new Date().toISOString().slice(0,7);
    historicalResourceAverages.push({month:thisMonthString, aveReading:resource.last_value});
    historicalVillageAverages.push({month:thisMonthString, aveReading:villageAverage.last_value});

    console.log(resource);

    //Convert to the right format for d3
    $scope.data.push(mapHistoricalDataToD3(historicalResourceAverages, 'Well Average', '#1f77b4'));
    $scope.data.push(mapHistoricalDataToD3(historicalVillageAverages, 'Village Average', '#d62728'));
  })
  .catch(function(err) {
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
        return 0 - d.value;
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
        axisLabel: 'Depth to water level (m)',
        axisLabelDistance: -10,
        tickFormat: function(d) {
          return (-d);
        }
      },
      tooltip: {
        enabled: false
      },
    }
  };

  $scope.data = [
    // {
    //   "key" : "aveValueVillage",
    //   "bar": true,
    //   "color": "#d62728",
    //   "values": [
    //     {label:'2015-01', value:0.45},
    //     {label:'2015-02', value:1},
    //     {label:'2015-03', value:0.22},
    //     {label:'2015-04', value:0.12},
    //     {label:'2015-05', value:0.4},
    //     {label:'2015-06', value:0.5},
    //     {label:'2015-07', value:0.9},
    //     {label:'2015-08', value:0.1},
    //     {label:'2015-09', value:0.1},
    //     {label:'2015-10', value:0.1},
    //     {label:'2015-11', value:0.1},
    //     {label:'2015-12', value:0.1}
    //   ]
    // },
    // {
    //   "key" : "aveValueWell",
    //   "bar": true,
    //   "color": "#1f77b4",
    //   "values": [
    //     {label:'2015-01', value:0.1},
    //     {label:'2015-02', value:0.5},
    //     {label:'2015-03', value:0.12},
    //     {label:'2015-04', value:0.2},
    //     {label:'2015-05', value:0.6},
    //     {label:'2015-06', value:0.7},
    //     {label:'2015-07', value:0.7},
    //     {label:'2015-08', value:0.4},
    //     {label:'2015-09', value:0.1},
    //     {label:'2015-10', value:0.4},
    //     {label:'2015-11', value:0.3},
    //     {label:'2015-12', value:0.2}
    //   ]
    // }
  ];


  function mapHistoricalDataToD3(historicalData, graphKey, color) {
    //We have an array containing months: [{aveReading:x, month:"YYYY-MM"}, ...]
    const values = historicalData.map(value => {
      return {label: value.month, value: value.aveReading};
    });
    return {
      key: graphKey,
      bar:true,
      color: color,
      values: values
    };
  }

  init();
});
