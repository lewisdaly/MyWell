"use strict";
angular.module('controller.map-detail', ['nvd3'])
.controller('MapDetailController', function($scope, $state, ApiService, $stateParams) {

  $scope.$on('$ionicView.enter', function(e) {

  });

  $scope.resourceId = $stateParams.resourceId;
  $scope.juneData = null;
  let detailChart = null;
  let allWeeklyReadings = [];
  let splitWeeklyReadings = []; //all weekly readings split per year

  const getChartDataAndLabel = (dataRange) => {
    let dataAndLabel = {
      data: [],
      labels: null
    };

    switch (dataRange) {
      case 'month':
        dataAndLabel.data[0] = splitWeeklyReadings[0].slice(1).slice(-4);
        dataAndLabel.data[1] = splitWeeklyReadings[1].slice(1).slice(-4);
        dataAndLabel.data[2] = splitWeeklyReadings[2].slice(1).slice(-4);
        dataAndLabel.labels = weekStartForWeeksAgo(4).map(dateTime => dateTime.format('DD-MMM'));
        break;
      case '3month':
        dataAndLabel.data[0] = splitWeeklyReadings[0].slice(1).slice(-4 * 3);
        dataAndLabel.data[1] = splitWeeklyReadings[1].slice(1).slice(-4 * 3);
        dataAndLabel.data[2] = splitWeeklyReadings[2].slice(1).slice(-4 * 3);
        dataAndLabel.labels = weekStartForWeeksAgo(4 * 3).map(dateTime => dateTime.format('DD-MMM'));
        break;
      case 'year':
        dataAndLabel.data[0] = splitWeeklyReadings[0].slice(1).slice(-52);
        dataAndLabel.data[1] = splitWeeklyReadings[1].slice(1).slice(-52);
        dataAndLabel.data[2] = splitWeeklyReadings[2].slice(1).slice(-52);
        dataAndLabel.labels = weekStartForWeeksAgo(52).map(dateTime => dateTime.format('DD-MMM'));
        break;
      default:
        throw new Error(`dataRange ${dataRange} not found`);
    }

    return dataAndLabel;
  }

  /**
   * Iteratively go back a bunch of weeks
   */

  const weekStartForWeeksAgo = (weeksAgo, startDate, weeks) => {
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

    let previousWeekStart = startDate.clone().subtract(1, 'week');
    weeks.unshift(previousWeekStart);
    return weekStartForWeeksAgo(weeksAgo -1 , previousWeekStart, weeks);
  }

  const setupChart = () => {

    const colors = [
      {border:'rgba(54, 162, 235, 1)',background:'rgba(54, 162, 235, 0.2)'},
      {border:'rgba(153, 102, 255, 1)', background:'rgba(153, 102, 255, 0.2)'},
      {border:'rgba(255, 159, 64, 1)',background:'rgba(255, 159, 64, 0.2)'}
    ]

    let chartData = getChartDataAndLabel("month");
    const ctx = document.getElementById("detailChart");
    detailChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: chartData.labels,
          datasets: [
          {
            label: 'This year',
            data: chartData.data[0],
            borderWidth: 1,
            backgroundColor: colors[0].background,
            borderColor: colors[0].border,
            fill: 'bottom'
          },
          {
            label: 'Last Year',
            data: chartData.data[1],
            borderWidth: 1,
            backgroundColor: colors[1].background,
            borderColor: colors[1].border,
            fill: 'bottom'
          },
          {
            label: '2 years ago',
            data: chartData.data[2],
            borderWidth: 1,
            backgroundColor: colors[2].background,
            borderColor: colors[2].border,
            fill: 'bottom'
          }
        ]
      },
      options: {
        title: {
            display: true,
            text: 'Depth to Water Level (m)'
        },
        spanGaps: false,
        scales: {
          // reverse: true,
          yAxes: [{
            ticks: {
              beginAtZero:true,
              reverse:true
            }
          }]
        }
      }
    });
  }

  const init = () => {
    // setupChart();
  }

  $scope.updateData = (dataRange) => {
    const chartData = getChartDataAndLabel(dataRange);

    detailChart.data.datasets[0].data = chartData.data[0];
    detailChart.data.datasets[1].data = chartData.data[1];
    detailChart.data.datasets[2].data = chartData.data[2];
    detailChart.data.labels = chartData.labels;
    detailChart.update();
  }

  //Get the data from the api service
  console.log("Getting data from server");
  Promise.all([
    ApiService.getResourceReadings($stateParams.postcode, $scope.resourceId),
    ApiService.getDifferenceFromJune(null, 'individual', $scope.resourceId, $stateParams.postcode)
      .catch(err => console.log(err)),
    ApiService.getResource($stateParams.postcode, $scope.resourceId),
  ])
  .then(results => {
    console.log("finished getting data from server");

    console.log("transforming data");

    const pastReadings = results[0].data;
    let juneData = {}
    if (!angular.isNullOrUndefined(results[1]) && !angular.isNullOrUndefined(results[1].data)) {
      let pastReadingDate = new Date(results[1].data.pastReadingDate).toISOString().slice(0,10);
      let difference = `${results[1].data.difference.toFixed(2)} m`;
      juneData =  {
        pastReadingDate: pastReadingDate,
        difference: difference
      };
    }

    $scope.resource = results[2].data;
    //TODO: calculate these stats
    $scope.stats = {
      watertableHeight: 0,
      percentageFull: 0,
      villageAverageReading: 0,
      juneData: juneData
    }

    // $scope.stats = null;

    //configure chart data and buttons
    let weeks = weekStartForWeeksAgo(52 * 3); //Three years of data!
    allWeeklyReadings = [];
    let addedCount = 0; //optimize - we can skip once we have added readings from this index
    const avg = array => array.reduce((p, c) => p + c, 0)/ array.length;

    weeks.forEach(weekEnd => {
      let weekStart = weekEnd.clone().subtract(1, 'week');

      let readingsThisWeek = [];
      for (var i = addedCount; i < pastReadings.length; i++) {
        let reading = pastReadings[i];
        let readingMoment = moment.utc(reading.date);
        if (readingMoment.isBetween(weekStart, weekEnd)) {
          readingsThisWeek.push(reading.value);
        }
      }

      const weeklyAverage = Math.round(avg(readingsThisWeek) * 100) / 100;
      if (isNaN(weeklyAverage)) {
        allWeeklyReadings.push(null);
      } else {
        allWeeklyReadings.push(0 + weeklyAverage);
      }

      addedCount = addedCount + readingsThisWeek.length;
    });

    //Split into 3, one for each year
    const slicePoints = [0, 51, 103, allWeeklyReadings.length]
    splitWeeklyReadings = [
      allWeeklyReadings.slice(slicePoints[2], slicePoints[3]),//This year
      allWeeklyReadings.slice(slicePoints[1], slicePoints[2]),
      allWeeklyReadings.slice(slicePoints[0], slicePoints[1])
    ];

    console.log("finished transforming data");

    console.log("setting up chart");
    setupChart();
    console.log("finished setting up chart");
  })
  .catch(function(err) {
    console.log(err);

  });

  init();
})
.filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});
