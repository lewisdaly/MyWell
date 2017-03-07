"use strict";

angular.module('controller.map-detail', ['nvd3']).controller('MapDetailController', function ($scope, $state, ApiService, $stateParams) {

  $scope.$on('$ionicView.enter', function (e) {});

  $scope.resourceId = $stateParams.resourceId;
  $scope.juneData = null;
  var detailChart = null;
  var allWeeklyReadings = [];

  var getChartDataAndLabel = function getChartDataAndLabel(dataRange) {
    var dataAndLabel = {
      data: null,
      labels: null
    };

    switch (dataRange) {
      case 'month':
        dataAndLabel.data = allWeeklyReadings.slice(1).slice(-4);
        dataAndLabel.labels = weekStartForWeeksAgo(4).map(function (dateTime) {
          return dateTime.format('DD-MMM');
        });
        break;
      case '3month':
        dataAndLabel.data = allWeeklyReadings.slice(1).slice(-4 * 3);;
        dataAndLabel.labels = weekStartForWeeksAgo(4 * 3).map(function (dateTime) {
          return dateTime.format('DD-MMM');
        });
        break;
      case 'year':
        dataAndLabel.data = allWeeklyReadings.slice(1).slice(-52);
        dataAndLabel.labels = weekStartForWeeksAgo(52).map(function (dateTime) {
          return dateTime.format('DD-MMM');
        });
        break;
      default:
        throw new Error('dataRange ' + dataRange + ' not found');
    }

    return dataAndLabel;
  };

  /**
   * Iteratively go back a bunch of weeks
   */

  var weekStartForWeeksAgo = function weekStartForWeeksAgo(weeksAgo, startDate, weeks) {
    if (angular.isNullOrUndefined(weeks)) {
      weeks = [];
    }

    if (weeksAgo == 0) {
      return weeks;
    }

    //First time - set everything up
    if (angular.isNullOrUndefined(startDate)) {
      //Get monday UTC
      startDate = moment.utc().startOf('week').add(1, 'days');
      weeks = [startDate];

      return weekStartForWeeksAgo(weeksAgo - 1, startDate, weeks);
    }

    var previousWeekStart = startDate.clone().subtract(1, 'week');
    weeks.unshift(previousWeekStart);
    return weekStartForWeeksAgo(weeksAgo - 1, previousWeekStart, weeks);
  };

  var setupChart = function setupChart() {
    var chartData = getChartDataAndLabel("month");
    var ctx = document.getElementById("detailChart");
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
              beginAtZero: true
            }
          }]
        }
      }
    });
  };

  var init = function init() {
    // setupChart();
  };

  $scope.updateData = function (dataRange) {
    console.log("update chart data", dataRange);

    var chartData = getChartDataAndLabel(dataRange);
    console.log(detailChart.data);
    detailChart.data.datasets[0].data = chartData.data;
    detailChart.data.labels = chartData.labels;
    detailChart.update();
  };

  //Get the data from the api service
  Promise.all([ApiService.getResourceReadings($stateParams.postcode, $scope.resourceId), ApiService.getDifferenceFromJune(null, 'individual', $scope.resourceId, $stateParams.postcode).catch(function (err) {
    return console.log(err);
  }), ApiService.getResource($stateParams.postcode, $scope.resourceId)]).then(function (results) {
    var pastReadings = results[0].data;
    if (!angular.isNullOrUndefined(results[1]) && !angular.isNullOrUndefined(results[1].data)) {
      var pastReadingDate = new Date(results[1].data.pastReadingDate).toISOString().slice(0, 10);
      var difference = results[1].data.difference.toFixed(2) + ' m';

      $scope.juneData = {
        pastReadingDate: pastReadingDate,
        difference: difference
      };
    }

    $scope.resource = results[2].data;

    //configure chart data and buttons
    var weeks = weekStartForWeeksAgo(52);
    allWeeklyReadings = [];
    var addedCount = 0; //optimize - we can skip once we have added readings from this index
    var avg = function avg(array) {
      return array.reduce(function (p, c) {
        return p + c;
      }, 0) / array.length;
    };
    console.log(pastReadings);

    weeks.forEach(function (weekEnd) {
      var weekStart = weekEnd.clone().subtract(1, 'week');

      var readingsThisWeek = [];
      for (var i = addedCount; i < pastReadings.length; i++) {
        var reading = pastReadings[i];
        var readingMoment = moment.utc(reading.date);
        if (readingMoment.isBetween(weekStart, weekEnd)) {
          readingsThisWeek.push(reading.value);
        }
      }

      var weeklyAverage = Math.round(avg(readingsThisWeek) * 100) / 100;
      if (isNaN(weeklyAverage)) {
        allWeeklyReadings.push(0);
      } else {
        allWeeklyReadings.push(0 + weeklyAverage);
      }

      addedCount = addedCount + readingsThisWeek.length;
    });

    setupChart();
  }).catch(function (err) {
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
      x: function x(d) {
        return d.label;
      },
      y: function y(d) {
        return 0 - d.value;
      },
      showValues: false,
      showControls: false,
      valueFormat: function valueFormat(d) {
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
        tickFormat: function tickFormat(d) {
          return -d;
        }
      },
      tooltip: {
        enabled: false
      }
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
    var values = historicalData.map(function (value) {
      return { label: value.month, value: value.aveReading };
    });
    return {
      key: graphKey,
      bar: true,
      color: color,
      values: values
    };
  }

  init();
});