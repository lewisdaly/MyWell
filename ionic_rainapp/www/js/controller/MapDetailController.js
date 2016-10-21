angular.module('controller.map-detail', [])
.controller('MapDetailController', function($scope, $state, ApiService) {

  $scope.$on('$ionicView.enter', function(e) {
    console.log("Entered!");
  });
  
});
